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

type MsgShape = {
  id: string;
  body: string | null;
  image: string | null;
  type: string | null;
  createdAt: Date;
  conversationId: string;
  sender: { id: string; name: string | null; email: string | null; image: string | null };
};

const userSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  image: true,
} as const;

const messageSelect = {
  id: true,
  body: true,
  image: true,
  type: true,
  createdAt: true,
  conversationId: true,
  sender: { select: { id: true, name: true, email: true, image: true } },
} as const;

// 메시지 insert (멱등: 동일 messageId면 기존 메시지 반환)
async function insertMessage(
  msgId: string,
  message: string | undefined,
  image: string | undefined,
  type: string,
  convId: string,
  senderId: string,
): Promise<MsgShape> {
  try {
    return await prisma.message.create({
      data: {
        id: msgId,
        body: message,
        image,
        type,
        conversation: { connect: { id: convId } },
        sender: { connect: { id: senderId } },
        isAIResponse: false,
        isError: false,
      },
      select: messageSelect,
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return prisma.message.findUniqueOrThrow({ where: { id: msgId }, select: messageSelect });
    }
    throw e;
  }
}

// lastMessageAt 업데이트는 표시용이므로 fire-and-forget
function fireUpdateLastMessage(convId: string, lastMessageAt: Date, lastMessageId: string) {
  prisma.conversation
    .update({ where: { id: convId }, data: { lastMessageAt, lastMessageId } })
    .catch(console.error);
}

function buildResponse(conv: ConvShape, msg: MsgShape, existingConversation: boolean) {
  return NextResponse.json({
    conversation: { ...conv, existingConversation },
    newMessage: {
      ...msg,
      serverCreatedAtMs: new Date(msg.createdAt).getTime(),
      conversation: { isGroup: !!conv.isGroup, userIds: conv.userIds ?? [] },
    },
  });
}

/**
 * 대화방 생성 + 첫 메시지 저장을 한 번의 요청으로 처리
 *
 * 최적화 전략:
 * - AI 채팅: 항상 새 대화방 → findFirst 없이 바로 create
 * - 1:1 / 단체: 기존 대화방 조회를 트랜잭션 밖에서 먼저 실행
 *   - 기존 대화방 존재 시 → message.create만 (트랜잭션 최소화)
 *   - 새 대화방 생성 시 → conversation.create + message.create
 * - 1:1: 상대방 확인 + 기존 대화방 조회를 Promise.all로 병렬 실행
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user?.email) {
      return new NextResponse("로그인이 필요합니다.", { status: 401 });
    }

    const body = await req.json();
    const { userId, isGroup, members, name, aiAgentType, message, image, messageId } = body;

    const hasContent = !!(image || message?.trim());
    if (!hasContent) {
      return new NextResponse("메시지 내용이 없습니다.", { status: 400 });
    }
    if (message && containsProhibited(String(message))) {
      return new NextResponse("부적절한 내용은 허용되지 않습니다.", { status: 400 });
    }

    const msgId = messageId || randomUUID();
    const inferredType = image ? "image" : "text";

    // ── AI 채팅: 항상 새 대화방 → findFirst 없이 바로 create ─────────────
    if (aiAgentType) {
      const { msg, conv } = await prisma.$transaction(
        async (tx) => {
          const conv = await tx.conversation.create({
            data: {
              isAIChat: true,
              aiAgentType,
              userIds: [user.id],
              users: { connect: [{ id: user.id }] },
            },
            include: { users: { select: userSelect } },
          });
          const msg = await tx.message.create({
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
            select: messageSelect,
          });
          return { msg, conv };
        },
        { maxWait: 3000, timeout: 6000 }
      );
      fireUpdateLastMessage(conv.id, msg.createdAt, msg.id);
      return buildResponse(conv, msg, false);
    }

    // ── 1:1 채팅 ──────────────────────────────────────────────────────────
    if (!isGroup) {
      if (!userId) return new NextResponse("상대 유저 ID가 필요합니다.", { status: 400 });
      if (userId === user.id) return new NextResponse("본인과는 대화를 시작할 수 없습니다.", { status: 400 });

      const userIdsSorted = toSortedIds([user.id, userId]);

      // 상대방 확인 + 기존 대화방 조회 병렬 실행
      const [targetUser, existingConv] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
        prisma.conversation.findFirst({
          where: { isGroup: false, userIds: { equals: userIdsSorted } },
          include: { users: { select: userSelect } },
        }),
      ]);

      if (!targetUser) return new NextResponse("해당 회원을 찾을 수 없습니다.", { status: 404 });

      if (existingConv) {
        // 기존 대화방 → message.create만 (트랜잭션 최소화)
        const msg = await insertMessage(msgId, message, image, inferredType, existingConv.id, user.id);
        fireUpdateLastMessage(existingConv.id, msg.createdAt, msg.id);
        return buildResponse(existingConv, msg, true);
      }

      // 새 대화방 → conversation + message 함께 생성
      const lockKey = `conv:1to1:${userIdsSorted.join(",")}`;
      const { msg, conv } = await prisma.$transaction(
        async (tx) => {
          // 동시성 경합으로 인한 중복 대화방 생성을 막기 위해 생성 구간만 직렬화
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}));`;

          const existing = await tx.conversation.findFirst({
            where: { isGroup: false, userIds: { equals: userIdsSorted } },
            include: { users: { select: userSelect } },
          });

          const conv: ConvShape =
            existing ??
            (await tx.conversation.create({
              data: {
                isGroup: false,
                userIds: userIdsSorted,
                users: { connect: userIdsSorted.map((id: string) => ({ id })) },
              },
              include: { users: { select: userSelect } },
            }));
          const msg = await tx.message.create({
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
            select: messageSelect,
          });
          return { msg, conv };
        },
        { maxWait: 3000, timeout: 6000 }
      );
      fireUpdateLastMessage(conv.id, msg.createdAt, msg.id);
      return buildResponse(conv, msg, false);
    }

    // ── 단체 채팅 ──────────────────────────────────────────────────────────
    const memberIds = Array.isArray(members)
      ? members.map((m: MemberInput) => (typeof m === "string" ? m : m?.value)).filter(Boolean)
      : [];
    const memberIdsSorted = toSortedIds([user.id, ...memberIds]);
    if (memberIdsSorted.length < 2) {
      return new NextResponse("대화방에 참여한 멤버가 없습니다.", { status: 400 });
    }

    // 기존 단체 대화방 조회 (트랜잭션 밖)
    const existingGroupConv = await prisma.conversation.findFirst({
      where: { isGroup: true, userIds: { equals: memberIdsSorted } },
      include: { users: { select: userSelect } },
    });

    if (existingGroupConv) {
      // 기존 대화방 → message.create만 (트랜잭션 최소화)
      const msg = await insertMessage(msgId, message, image, inferredType, existingGroupConv.id, user.id);
      fireUpdateLastMessage(existingGroupConv.id, msg.createdAt, msg.id);
      return buildResponse(existingGroupConv, msg, true);
    }

    // 새 단체 대화방 → conversation + message 함께 생성
    const lockKey = `conv:group:${memberIdsSorted.join(",")}`;
    const { msg, conv } = await prisma.$transaction(
      async (tx) => {
        // 동시성 경합으로 인한 중복 대화방 생성을 막기 위해 생성 구간만 직렬화
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}));`;

        const existing = await tx.conversation.findFirst({
          where: { isGroup: true, userIds: { equals: memberIdsSorted } },
          include: { users: { select: userSelect } },
        });

        const conv: ConvShape =
          existing ??
          (await tx.conversation.create({
            data: {
              isGroup: true,
              name: name ?? null,
              userIds: memberIdsSorted,
              users: { connect: memberIdsSorted.map((id: string) => ({ id })) },
            },
            include: { users: { select: userSelect } },
          }));

        const msg = await tx.message.create({
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
          select: messageSelect,
        });
        return { msg, conv };
      },
      { maxWait: 3000, timeout: 6000 }
    );
    fireUpdateLastMessage(conv.id, msg.createdAt, msg.id);
    return buildResponse(conv, msg, false);
  } catch (err) {
    console.error("[POST /api/conversations/first-message] error:", err);
    return new NextResponse("서버 오류", { status: 500 });
  }
}
