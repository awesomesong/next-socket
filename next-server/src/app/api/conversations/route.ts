import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from "../../../../prisma/db";


export async function GET() {
  const user = await getCurrentUser();

  if (!user?.email)
    return new NextResponse("로그인이 되지 않았습니다.", { status: 401 });

  try {
    // ✅ 스냅샷 시점 먼저 고정 (모든 쿼리가 이 시점 이전 데이터만 조회)
    const now = new Date();
    const nowMs = now.getTime();

    // 1) 내가 속한 대화방들
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      where: {
        userIds: {
          has: user.id,
        },
      },
      select: {
        id: true,
        userIds: true,
        isGroup: true,
        isAIChat: true,
        aiAgentType: true,
        name: true,
        lastMessageAt: true,
        lastMessageId: true,
        users: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    if (conversations.length === 0) {
      return NextResponse.json({ conversations: [] }, { status: 200 });
    }

    const conversationIds = conversations.map((c) => c.id);

    // 2) 워터마크 계산: 기본값 먼저 채우고(읽음 레코드 없을 때 0), 읽음 레코드로 덮어쓰기
    const seenMsByConv = new Map<string, number>(
      conversations.map(c => [c.id, 0]) // ✅ 읽음 레코드 없으면 0으로 초기화 → 과거 메시지가 안읽음으로 집계됨
    );

    // 읽음 레코드 조회
    const reads = await prisma.conversationRead.findMany({
      where: { userId: user.id, conversationId: { in: conversationIds } },
      select: { conversationId: true, lastSeenAt: true, lastSeenMsgId: true },
    });

    // lastSeenMsgId가 가리키는 메시지의 createdAt (system은 워터마크에 반영하지 않음)
    const seenMsgIds = reads.map(r => r.lastSeenMsgId).filter(Boolean) as string[];
    const seenMsgs = seenMsgIds.length
      ? await prisma.message.findMany({
          where: { 
            id: { in: seenMsgIds },
            OR: [{ type: null }, { type: { not: "system" } }],
          },
          select: { id: true, createdAt: true },
        })
      : [];
    const seenMsgMap = new Map(seenMsgs.map(m => [m.id, m.createdAt]));

    for (const r of reads) {
      const base = seenMsByConv.get(r.conversationId) ?? nowMs;
      const a = r.lastSeenAt?.getTime?.() ?? 0;
      const b = r.lastSeenMsgId ? (seenMsgMap.get(r.lastSeenMsgId)?.getTime?.() ?? 0) : 0;
      seenMsByConv.set(r.conversationId, Math.max(base, a, b));
    }

    // 3) ✅ 미리보기 + 안읽음 수 + lastMessageAtMs를 하나의 시점에서 일관되게 조회
    const lastMessageMap = new Map<string, {
      id: string; body: string | null; type: string | null; createdAt: Date;
      senderId?: string | null; isAIResponse?: boolean | null;
    }>();
    const unreadMap = new Map<string, number>();
    const lastMessageAtMsMap = new Map<string, number>();

    const BATCH_SIZE = 10;
    for (let i = 0; i < conversations.length; i += BATCH_SIZE) {
      const batch = conversations.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (conv) => {
          // ✅ 1단계: 최신 비-시스템 메시지 조회 (미리보기용 + lastMessageAtMs용)
          const latestMsg = await prisma.message.findFirst({
            where: {
              conversationId: conv.id,
              createdAt: { lte: now },
              OR: [{ type: null }, { type: { not: "system" } }],
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, body: true, type: true, createdAt: true, senderId: true, isAIResponse: true },
          });

          if (latestMsg) {
            // ✅ lastMessageAtMs 저장 (모든 방)
            lastMessageAtMsMap.set(conv.id, latestMsg.createdAt.getTime());
          }

          // ✅ 2단계: AI 방은 미리보기만 설정하고 unread는 0
          if (conv.isAIChat) {
            if (latestMsg) {
              lastMessageMap.set(conv.id, {
                id: latestMsg.id,
                body: latestMsg.body,
                type: latestMsg.type ?? null,
                createdAt: latestMsg.createdAt,
                senderId: latestMsg.senderId ?? null,
                isAIResponse: latestMsg.isAIResponse ?? null,
              });
            }
            unreadMap.set(conv.id, 0);
            return;
          }

          // ✅ 3단계: 비-AI 방 처리
          const seenMs = seenMsByConv.get(conv.id) ?? 0;

          // 3-1) 안읽음 메시지 조회 (상대방이 보낸 것만)
          const unreadMessages = await prisma.message.findMany({
            where: {
              conversationId: conv.id,
              createdAt: { gt: new Date(seenMs), lte: now },
              senderId: { not: user.id },
              isAIResponse: { not: true },
              OR: [{ type: null }, { type: { not: "system" } }],
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, body: true, type: true, createdAt: true, senderId: true, isAIResponse: true },
          });

          // 3-2) 안읽음 수 저장
          unreadMap.set(conv.id, unreadMessages.length);

          // 3-3) 미리보기: 안읽음 중 최신 or 전체 최신
          const preview = unreadMessages.length > 0 ? unreadMessages[0] : latestMsg;
          if (preview) {
            lastMessageMap.set(conv.id, {
              id: preview.id,
              body: preview.body,
              type: preview.type ?? null,
              createdAt: preview.createdAt,
              senderId: preview.senderId ?? null,
              isAIResponse: preview.isAIResponse ?? null,
            });
          }
        })
      );
    }

    // 4) ✅ 응답 조립 - 동일 시점의 데이터로 일관성 보장
    const conversationsWithDetails = conversations.map((conversation) => {
      const lastMessage = lastMessageMap.get(conversation.id) || null;
      const unReadCount = unreadMap.get(conversation.id) ?? 0;
      const lastMessageAtMs = lastMessageAtMsMap.get(conversation.id) ?? null;

      return {
        ...conversation,
        messages: lastMessage ? [lastMessage] : [],
        unReadCount,
        lastMessageAtMs, // ✅ 미리보기 메시지의 createdAt과 동일한 시점
        lastMessageId: lastMessage?.id ?? conversation.lastMessageId,
      };
    });

    return NextResponse.json(
      { conversations: conversationsWithDetails },
      { status: 200 }
    );
  } catch (e) {
    console.error('[GET /api/conversations] error:', e);
    return new NextResponse("대화방을 불러오는 중 오류가 발생하였습니다.", {
      status: 500,
    });
  }
}

// 공통 헬퍼
const toSortedIds = (ids: string[]) => [...new Set(ids)].sort();

type MemberType = string | { value: string };

const userSelectFields = { id: true, name: true, nickname: true, email: true, image: true } as const;

/**
 * memberKey를 이용해 대화방을 찾거나 생성 (트랜잭션 없이 P2002 catch로 중복 방지)
 *
 * memberKey로 찾은 대화방의 userIds가 요청과 다르면 (멤버 탈퇴 등)
 * stale memberKey를 해제하고 새 대화방을 생성한다.
 */
async function findOrCreateConversation(
  memberKey: string,
  data: { isGroup: boolean; name?: string | null; userIdsSorted: string[] },
) {
  const existing = await prisma.conversation.findUnique({
    where: { memberKey },
    include: { users: { select: userSelectFields } },
  });

  if (existing) {
    const isMemberMatch =
      JSON.stringify([...existing.userIds].sort()) ===
      JSON.stringify([...data.userIdsSorted].sort());

    if (isMemberMatch) return { ...existing, existingConversation: true as const };

    // stale memberKey 해제 (탈퇴한 유저가 있는 옛 대화방)
    await prisma.conversation.update({
      where: { id: existing.id },
      data: { memberKey: null },
    });
  }

  try {
    const created = await prisma.conversation.create({
      data: {
        isGroup: data.isGroup,
        name: data.name ?? null,
        memberKey,
        userIds: data.userIdsSorted,
        users: { connect: data.userIdsSorted.map((id) => ({ id })) },
      },
      include: { users: { select: userSelectFields } },
    });
    return { ...created, existingConversation: false as const };
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      const conv = await prisma.conversation.findUnique({
        where: { memberKey },
        include: { users: { select: userSelectFields } },
      });
      if (conv) return { ...conv, existingConversation: true as const };
    }
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { userId, isGroup, members, name } = body;

    if (!user?.email)
      return new NextResponse("로그인이 되지 않았습니다.", { status: 401 });

    // 그룹 채팅방 생성
    if (isGroup) {
      const memberIds = Array.isArray(members)
        ? members.map((m: MemberType) => (typeof m === "string" ? m : m?.value)).filter(Boolean)
        : [];
      const memberIdsSorted = toSortedIds([user.id, ...memberIds]);

      if (memberIdsSorted.length < 2) {
        return new NextResponse("대화방에 참여한 멤버가 없습니다.", { status: 400 });
      }

      const memberKey = `grp:${memberIdsSorted.join(",")}`;
      const result = await findOrCreateConversation(memberKey, {
        isGroup: true,
        name,
        userIdsSorted: memberIdsSorted,
      });
      return NextResponse.json(result, { status: 200 });
    }

    // 1:1 대화방 생성
    if (!userId) {
      return NextResponse.json({ message: "상대 유저 ID가 필요합니다." }, { status: 400 });
    }
    if (userId === user.id) {
      return NextResponse.json({ message: "본인과는 1:1 대화를 시작할 수 없습니다." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!targetUser) {
      return NextResponse.json({ message: "해당 회원을 찾을 수 없습니다." }, { status: 404 });
    }

    const userIdsSorted = toSortedIds([user.id, userId]);
    const memberKey = `dm:${userIdsSorted.join(",")}`;
    const result = await findOrCreateConversation(memberKey, {
      isGroup: false,
      userIdsSorted,
    });
    return NextResponse.json(result, { status: 200 });
  } catch {
    return new NextResponse("대화방을 불러오는 중 오류가 발생하였습니다.", {
      status: 500,
    });
  }
}
