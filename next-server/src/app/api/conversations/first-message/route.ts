import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { randomUUID } from "crypto";
import { containsProhibited } from "@/src/app/utils/aiPolicy";

export const runtime = "nodejs";

const toSortedIds = (ids: string[]) => [...new Set(ids)].sort();

type MemberInput = string | { value: string };

type ConvShape = {
  id: string;
  name: string | null;
  isGroup: boolean | null;
  isAIChat: boolean | null;
  aiAgentType: string | null;
  userIds: string[];
  users: { id: string; name: string | null; nickname?: string | null; email: string | null; image: string | null }[];
  lastMessageAt?: Date | null;
};

const userSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  image: true,
} as const;

/**
 * 대화방 생성 + 첫 메시지 저장을 한 번의 요청으로 처리
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user?.email) {
      return new NextResponse("로그인이 필요합니다.", { status: 401 });
    }

    const body = await req.json();
    const {
      userId,
      isGroup,
      members,
      name,
      aiAgentType,
      message,
      image,
      messageId,
    } = body;

    const hasContent = !!(image || message?.trim());
    if (!hasContent) {
      return new NextResponse("메시지 내용이 없습니다.", { status: 400 });
    }

    if (message && containsProhibited(String(message))) {
      return new NextResponse("부적절한 내용은 허용되지 않습니다.", { status: 400 });
    }

    const msgId = messageId || randomUUID();
    const inferredType = image ? "image" : "text";

    let memberIdsSorted: string[] = [];
    let userIdsSorted: string[] = [];

    if (aiAgentType) {
      // AI
    } else if (isGroup) {
      const memberIds = Array.isArray(members)
        ? members
          .map((m: MemberInput) => (typeof m === "string" ? m : m?.value))
          .filter(Boolean)
        : [];
      memberIdsSorted = toSortedIds([user.id, ...memberIds]);
      if (memberIdsSorted.length < 2) {
        return new NextResponse("대화방에 참여한 멤버가 없습니다.", { status: 400 });
      }
    } else {
      if (!userId) {
        return new NextResponse("상대 유저 ID가 필요합니다.", { status: 400 });
      }
      if (userId === user.id) {
        return new NextResponse("본인과는 대화를 시작할 수 없습니다.", { status: 400 });
      }
      userIdsSorted = toSortedIds([user.id, userId]);
    }

    // 1:1: 상대방 존재 확인
    if (!aiAgentType && !isGroup) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!targetUser) {
        return new NextResponse("해당 회원을 찾을 수 없습니다.", { status: 404 });
      }
    }

    let existingConversation = false;

    const { msg: newMessage, conv: resolvedConversation } = await prisma.$transaction(
      async (tx) => {
        let conv!: ConvShape;

        if (aiAgentType) {
          conv = await tx.conversation.create({
            data: {
              isAIChat: true,
              aiAgentType,
              userIds: [user.id],
              users: { connect: [{ id: user.id }] },
            },
            include: { users: { select: userSelect } },
          });
        } else if (isGroup) {
          const found = await tx.conversation.findFirst({
            where: { isGroup: true, userIds: { equals: memberIdsSorted } },
            include: { users: { select: userSelect } },
          });
          if (found) {
            conv = found;
            existingConversation = true;
          } else {
            try {
              conv = await tx.conversation.create({
                data: {
                  isGroup: true,
                  name: name ?? null,
                  userIds: memberIdsSorted,
                  users: { connect: memberIdsSorted.map((id: string) => ({ id })) },
                },
                include: { users: { select: userSelect } },
              });
            } catch (e: unknown) {
              if ((e as { code?: string })?.code === "P2002") {
                const again = await tx.conversation.findFirst({
                  where: { isGroup: true, userIds: { equals: memberIdsSorted } },
                  include: { users: { select: userSelect } },
                });
                if (!again) throw e;
                conv = again;
                existingConversation = true;
              } else {
                throw e;
              }
            }
          }
        } else {
          const found = await tx.conversation.findFirst({
            where: { isGroup: false, userIds: { equals: userIdsSorted } },
            include: { users: { select: userSelect } },
          });
          if (found) {
            conv = found;
            existingConversation = true;
          } else {
            conv = await tx.conversation.create({
              data: {
                isGroup: false,
                userIds: userIdsSorted,
                users: { connect: userIdsSorted.map((id: string) => ({ id })) },
              },
              include: { users: { select: userSelect } },
            });
          }
        }

        // 메시지 생성 (멱등: 동일 messageId면 기존 메시지 반환)
        let msg;
        try {
          msg = await tx.message.create({
            data: {
              id: msgId,
              body: message,
              image,
              type: inferredType,
              conversation: { connect: { id: conv.id } },
              sender: { connect: { id: user.id } },
              isAIResponse: false,
              isError: false,
            },
            select: {
              id: true,
              body: true,
              image: true,
              type: true,
              createdAt: true,
              conversationId: true,
              sender: { select: { id: true, name: true, email: true, image: true } },
            },
          });
        } catch (e: unknown) {
          if ((e as { code?: string })?.code === "P2002") {
            msg = await tx.message.findUniqueOrThrow({
              where: { id: msgId },
              select: {
                id: true,
                body: true,
                image: true,
                type: true,
                createdAt: true,
                conversationId: true,
                sender: { select: { id: true, name: true, email: true, image: true } },
              },
            });
          } else {
            throw e;
          }
        }

        await tx.conversation.update({
          where: { id: conv.id },
          data: {
            lastMessageAt: msg.createdAt,
            lastMessageId: msg.id,
          },
        });

        return { msg, conv };
      },
      { maxWait: 5000, timeout: 10000 }
    );

    return NextResponse.json({
      conversation: {
        ...resolvedConversation,
        existingConversation,
      },
      newMessage: {
        ...newMessage,
        serverCreatedAtMs: new Date(newMessage.createdAt).getTime(),
        conversation: {
          isGroup: !!resolvedConversation.isGroup,
          userIds: resolvedConversation.userIds ?? [],
        },
      },
    });
  } catch (err) {
    console.error("[POST /api/conversations/first-message] error:", err);
    return new NextResponse("서버 오류", { status: 500 });
  }
}
