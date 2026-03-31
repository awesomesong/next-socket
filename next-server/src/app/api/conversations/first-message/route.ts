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

const convInclude = { users: { select: userSelect } } as const;

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
 * memberKey를 이용해 대화방을 찾거나 생성 (트랜잭션 없이 P2002 catch로 중복 방지)
 *
 * memberKey로 찾은 대화방의 userIds가 요청과 다르면 (멤버 탈퇴 등)
 * stale memberKey를 해제하고 새 대화방을 생성한다.
 */
async function findOrCreateConversation(
  memberKey: string,
  data: {
    isGroup: boolean;
    name?: string | null;
    userIdsSorted: string[];
  },
): Promise<{ conv: ConvShape; existing: boolean }> {
  // 1) memberKey로 빠르게 조회
  const existing = await prisma.conversation.findUnique({
    where: { memberKey },
    include: convInclude,
  });

  if (existing) {
    // memberKey는 매칭되지만 실제 멤버가 다르면 stale → memberKey 해제
    const isMemberMatch =
      JSON.stringify([...existing.userIds].sort()) ===
      JSON.stringify([...data.userIdsSorted].sort());

    if (isMemberMatch) return { conv: existing, existing: true };

    // stale memberKey 해제 (탈퇴한 유저가 있는 옛 대화방)
    await prisma.conversation.update({
      where: { id: existing.id },
      data: { memberKey: null },
    });
  }

  // 2) 없거나 stale → 새로 생성
  try {
    const conv = await prisma.conversation.create({
      data: {
        isGroup: data.isGroup,
        name: data.name ?? null,
        memberKey,
        userIds: data.userIdsSorted,
        users: { connect: data.userIdsSorted.map((id: string) => ({ id })) },
      },
      include: convInclude,
    });
    return { conv, existing: false };
  } catch (e: unknown) {
    // 3) 동시 요청으로 P2002(unique violation) → 기존 대화방 반환
    if ((e as { code?: string })?.code === "P2002") {
      const conv = await prisma.conversation.findUnique({
        where: { memberKey },
        include: convInclude,
      });
      if (conv) return { conv, existing: true };
    }
    throw e;
  }
}

/**
 * 대화방 생성 + 첫 메시지 저장을 한 번의 요청으로 처리
 *
 * 최적화 전략:
 * - interactive transaction 없음 → P2028 (트랜잭션 타임아웃) 제거
 * - memberKey unique constraint로 중복 대화방 방지 (advisory lock 불필요)
 * - AI 채팅: 항상 새 대화방 → 순차 create
 * - 1:1 / 단체: findOrCreateConversation → insertMessage 순차 실행
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

    // ── AI 채팅: 항상 새 대화방 → 순차 create (트랜잭션 불필요) ─────────────
    if (aiAgentType) {
      const conv = await prisma.conversation.create({
        data: {
          isAIChat: true,
          aiAgentType,
          userIds: [user.id],
          users: { connect: [{ id: user.id }] },
        },
        include: convInclude,
      });
      const msg = await insertMessage(msgId, message, image, inferredType, conv.id, user.id);
      fireUpdateLastMessage(conv.id, msg.createdAt, msg.id);
      return buildResponse(conv, msg, false);
    }

    // ── 1:1 채팅 ──────────────────────────────────────────────────────────
    if (!isGroup) {
      if (!userId) return new NextResponse("상대 유저 ID가 필요합니다.", { status: 400 });
      if (userId === user.id) return new NextResponse("본인과는 대화를 시작할 수 없습니다.", { status: 400 });

      const userIdsSorted = toSortedIds([user.id, userId]);
      const memberKey = `dm:${userIdsSorted.join(",")}`;

      // 상대방 존재 확인
      const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!targetUser) return new NextResponse("해당 회원을 찾을 수 없습니다.", { status: 404 });

      const { conv, existing } = await findOrCreateConversation(memberKey, {
        isGroup: false,
        userIdsSorted,
      });
      const msg = await insertMessage(msgId, message, image, inferredType, conv.id, user.id);
      fireUpdateLastMessage(conv.id, msg.createdAt, msg.id);
      return buildResponse(conv, msg, existing);
    }

    // ── 단체 채팅 ──────────────────────────────────────────────────────────
    const memberIds = Array.isArray(members)
      ? members.map((m: MemberInput) => (typeof m === "string" ? m : m?.value)).filter(Boolean)
      : [];
    const memberIdsSorted = toSortedIds([user.id, ...memberIds]);
    if (memberIdsSorted.length < 2) {
      return new NextResponse("대화방에 참여한 멤버가 없습니다.", { status: 400 });
    }

    const memberKey = `grp:${memberIdsSorted.join(",")}`;
    const { conv, existing } = await findOrCreateConversation(memberKey, {
      isGroup: true,
      name,
      userIdsSorted: memberIdsSorted,
    });
    const msg = await insertMessage(msgId, message, image, inferredType, conv.id, user.id);
    fireUpdateLastMessage(conv.id, msg.createdAt, msg.id);
    return buildResponse(conv, msg, existing);
  } catch (err) {
    console.error("[POST /api/conversations/first-message] error:", err);
    return new NextResponse("서버 오류", { status: 500 });
  }
}
