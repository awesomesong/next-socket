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
  } catch {
    return new NextResponse("대화방을 불러오는 중 오류가 발생하였습니다.", {
      status: 500,
    });
  }
}

// 공통 헬퍼
const toSortedIds = (ids: string[]) => [...new Set(ids)].sort();

type MemberType = string | { value: string };

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

      // 기존 그룹 방 확인: 멤버셋만으로 판정 (name 조건 제거)
      const foundGroup = await prisma.conversation.findFirst({
        where: { isGroup: true, userIds: { equals: memberIdsSorted } },
        include: { users: { select: { id: true, name: true, nickname: true, email: true, image: true } } },
      });
      
      if (foundGroup) {
        return NextResponse.json(
          { ...foundGroup, existingConversation: true },
          { status: 200 }
        );
      }

      // 생성 (동시성 문제 대비)
      try {
        const created = await prisma.conversation.create({
          data: {
            isGroup: true,
            name: name ?? null,
            userIds: memberIdsSorted,
            users: { connect: memberIdsSorted.map(id => ({ id })) },
          },
          include: { users: { select: { id: true, name: true, nickname: true, email: true, image: true } } },
        });
        return NextResponse.json(
          { ...created, existingConversation: false },
          { status: 200 }
        );
      } catch (e: unknown) {
        // 동시에 두 요청이 들어왔을 때를 대비해 한 번 더 조회
        const again = await prisma.conversation.findFirst({
          where: { isGroup: true, userIds: { equals: memberIdsSorted } },
          include: { users: { select: { id: true, name: true, nickname: true, email: true, image: true } } },
        });
        if (again) {
          return NextResponse.json(
            { ...again, existingConversation: true },
            { status: 200 }
          );
        }
        throw e;
      }
    }

    // 1:1 대화방 생성
    if (!userId || userId === user.id) {
      return new NextResponse("상대 유저 ID가 올바르지 않습니다.", { status: 400 });
    }

    const userIdsSorted = toSortedIds([user.id, userId]);
    
    const found = await prisma.conversation.findFirst({
      where: { isGroup: false, userIds: { equals: userIdsSorted } },
      include: { users: { select: { id: true, name: true, nickname: true, email: true, image: true } } },
    });
    
    if (found) {
      return NextResponse.json(
        { ...found, existingConversation: true },
        { status: 200 }
      );
    }

    const created = await prisma.conversation.create({
      data: {
        isGroup: false,
        userIds: userIdsSorted,
        users: { connect: userIdsSorted.map(id => ({ id })) },
      },
      include: { users: { select: { id: true, name: true, nickname: true, email: true, image: true } } },
    });
    return NextResponse.json(
      { ...created, existingConversation: false },
      { status: 200 }
    );
  } catch {
    return new NextResponse("대화방을 불러오는 중 오류가 발생하였습니다.", {
      status: 500,
    });
  }
}
