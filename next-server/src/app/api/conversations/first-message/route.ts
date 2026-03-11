import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { ObjectId } from "bson";
import { containsProhibited } from "@/src/app/utils/aiPolicy";

export const runtime = "nodejs";

const toSortedIds = (ids: string[]) => [...new Set(ids)].sort();

type MemberInput = string | { value: string };

/**
 * 대화방 생성 + 첫 메시지 저장을 한 번의 요청으로 처리
 * 기존: POST /api/conversations → POST /api/messages (2 round trips)
 * 개선: POST /api/conversations/first-message (1 round trip)
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

    // 메시지 내용 검증
    const hasContent = !!(image || message?.trim());
    if (!hasContent) {
      return new NextResponse("메시지 내용이 없습니다.", { status: 400 });
    }

    // 금칙어 검사
    if (message && containsProhibited(String(message))) {
      return new NextResponse("부적절한 내용은 허용되지 않습니다.", { status: 400 });
    }

    const msgId = messageId || new ObjectId().toHexString();
    let conversation: {
      id: string;
      name: string | null;
      isGroup: boolean | null;
      isAIChat: boolean | null;
      aiAgentType: string | null;
      userIds: string[];
      users: { id: string; name: string | null; nickname?: string | null; email: string | null; image: string | null }[];
      lastMessageAt?: Date | null;
    } | undefined;
    let existingConversation = false;

    // ── AI 대화방 ──────────────────────────────────────────────────
    if (aiAgentType) {
      // 이전에 빈 채로 남은 AI 대화방이 있으면 재사용 (하위 호환)
      const existingEmpty = await prisma.conversation.findFirst({
        where: {
          isAIChat: true,
          aiAgentType,
          userIds: { has: user.id },
          messages: { none: {} },
        },
        include: {
          users: { select: { id: true, name: true, nickname: true, email: true, image: true } },
        },
      });

      if (existingEmpty) {
        conversation = existingEmpty;
        existingConversation = true;
      }
      // 신규 AI 대화방은 아래 트랜잭션 내에서 메시지와 함께 원자적으로 생성

      // ── 그룹 대화방 ────────────────────────────────────────────────
    } else if (isGroup) {
      const memberIds = Array.isArray(members)
        ? members
          .map((m: MemberInput) => (typeof m === "string" ? m : m?.value))
          .filter(Boolean)
        : [];
      const memberIdsSorted = toSortedIds([user.id, ...memberIds]);

      if (memberIdsSorted.length < 2) {
        return new NextResponse("대화방에 참여한 멤버가 없습니다.", { status: 400 });
      }

      const found = await prisma.conversation.findFirst({
        where: { isGroup: true, userIds: { equals: memberIdsSorted } },
        include: {
          users: { select: { id: true, name: true, nickname: true, email: true, image: true } },
        },
      });

      if (found) {
        conversation = found;
        existingConversation = true;
      } else {
        try {
          conversation = await prisma.conversation.create({
            data: {
              isGroup: true,
              name: name ?? null,
              userIds: memberIdsSorted,
              users: { connect: memberIdsSorted.map((id: string) => ({ id })) },
            },
            include: {
              users: { select: { id: true, name: true, nickname: true, email: true, image: true } },
            },
          });
        } catch (e: unknown) {
          if ((e as { code?: string })?.code === "P2002") {
            const again = await prisma.conversation.findFirst({
              where: { isGroup: true, userIds: { equals: memberIdsSorted } },
              include: {
                users: { select: { id: true, name: true, nickname: true, email: true, image: true } },
              },
            });
            if (!again) throw e;
            conversation = again;
            existingConversation = true;
          } else {
            throw e;
          }
        }
      }

      // ── 1:1 대화방 ─────────────────────────────────────────────────
    } else {
      if (!userId) {
        return new NextResponse("상대 유저 ID가 필요합니다.", { status: 400 });
      }
      if (userId === user.id) {
        return new NextResponse("본인과는 대화를 시작할 수 없습니다.", { status: 400 });
      }

      const userIdsSorted = toSortedIds([user.id, userId]);

      // user 존재 확인 + 기존 대화방 조회를 병렬로 실행
      const [targetUser, found] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
        prisma.conversation.findFirst({
          where: { isGroup: false, userIds: { equals: userIdsSorted } },
          include: {
            users: { select: { id: true, name: true, nickname: true, email: true, image: true } },
          },
        }),
      ]);

      if (!targetUser) {
        return new NextResponse("해당 회원을 찾을 수 없습니다.", { status: 404 });
      }

      if (found) {
        conversation = found;
        existingConversation = true;
      } else {
        conversation = await prisma.conversation.create({
          data: {
            isGroup: false,
            userIds: userIdsSorted,
            users: { connect: userIdsSorted.map((id: string) => ({ id })) },
          },
          include: {
            users: { select: { id: true, name: true, nickname: true, email: true, image: true } },
          },
        });
      }
    }

    // ── 첫 메시지 저장 (트랜잭션) ──────────────────────────────────
    const inferredType = image ? "image" : "text";

    const { msg: newMessage, conv: resolvedConversation } = await prisma.$transaction(
      async (tx) => {
        // 신규 AI 대화방: 트랜잭션 내에서 메시지와 함께 원자적으로 생성
        let conv = conversation;
        if (!conv) {
          conv = await tx.conversation.create({
            data: {
              isAIChat: true,
              aiAgentType,
              userIds: [user.id],
              users: { connect: [{ id: user.id }] },
            },
            include: {
              users: { select: { id: true, name: true, nickname: true, email: true, image: true } },
            },
          });
        }

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
          // 멱등: 동일 messageId가 이미 있으면 그대로 사용
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
