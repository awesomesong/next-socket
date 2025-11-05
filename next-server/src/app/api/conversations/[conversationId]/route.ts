import prisma from "@/prisma/db";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";

interface ParamsProp {
  params: Promise<{
    conversationId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: ParamsProp) {
  try {
    const { conversationId } = await params;
    const user = await getCurrentUser();

    if (!user?.email)
      return NextResponse.json(
        { message: "로그인이 되지 않았습니다. 로그인 후에 이용해주세요." },
        { status: 401 },
      );

    // ✅ 중복 DB 조회 정리: 왕복 1회로 줄이기
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        name: true,
        isGroup: true,
        isAIChat: true,
        aiAgentType: true,
        userIds: true,
        lastMessageAt: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { conversation: null, message: "대화방이 존재하지 않습니다." },
        { status: 404 },
      );
    }

    if (!conversation.userIds.includes(user.id)) {
      return NextResponse.json(
        { conversation: null, message: "해당 대화방에 접근할 수 없습니다." },
        { status: 403 },
      );
    }

    return NextResponse.json({ conversation }, { status: 200 });
  } catch {
    return NextResponse.json({
      conversation: null,
      message: "해당 대화방을 불러오지 못했습니다.",
    }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: ParamsProp) {
  try {
    const { conversationId } = await params;
    const user = await getCurrentUser();

    if (!user?.id)
      return NextResponse.json(
        { message: "로그인이 되지 않았습니다. 로그인 후에 이용해주세요." },
        { status: 401 },
      );

    const existingConversation = await prisma?.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        userIds: true,
        users: {
          select: {
            id: true,
            email: true,
          },
        },
        isGroup: true,
        _count: {
          select: {
            messages: true, // ✅ 카운트만 사용
          },
        },
      },
    });

    if (!existingConversation)
      return NextResponse.json(
        { message: "대화방이 존재하지 않습니다." },
        { status: 403 },
      );

    // ✅ 1) 멤버십 재검증
    if (!existingConversation.userIds.includes(user.id)) {
      return NextResponse.json({ message: "해당 대화방에 접근할 수 없습니다." }, { status: 403 });
    }
    // ✅ 2) 트랜잭션으로 원자화 + 이벤트 타입 결정
    const result = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.findUnique({
        where: { id: conversationId },
        select: {
          id: true,
          isGroup: true,
          isAIChat: true,
          userIds: true,
          _count: { select: { messages: true } },
        },
      });
      if (!conv) throw new Error("NOT_FOUND");

      // 1) 접근 권한
      if (!conv.userIds.includes(user.id)) throw new Error("FORBIDDEN");

      // 2) 나간 유저 제외한 다음 멤버 구성
      const nextUserIds = conv.userIds.filter((id) => id !== user.id);

      // 3) 대화방 삭제 조건:
      //    - AI 방이거나
      //    - 마지막 1명이 나간 경우 또는
      //    - 메시지가 없는 1:1 대화방에서 한 명이 나간 경우
      const shouldDeleteRoom = conv.isAIChat || 
                              nextUserIds.length === 0 || 
                              conv._count.messages === 0;
      
      if (shouldDeleteRoom) {
        // ✅ orphan 정리: ConversationRead도 함께 삭제
        await tx.conversationRead.deleteMany({ where: { conversationId } });
        await tx.message.deleteMany({ where: { conversationId } });
        await tx.conversation.delete({ where: { id: conversationId } });
        return { event: "room.deleted" as const, recipients: nextUserIds };
      }

      // 4) ConversationRead에서 나간 유저 제거
      await tx.conversationRead.deleteMany({
        where: { 
          conversationId,
          userId: user.id 
        },
      });

      // 5) 멤버 업데이트
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          userIds: { set: nextUserIds },
        },
      });

      // 6) 그룹방이면 시스템 메시지 남기고 lastMessageAt/lastMessageId 갱신 (조건부 updateMany)
      let systemMessage = null;
      if (conv.isGroup && conv._count.messages > 0) {
        systemMessage = await tx.message.create({
          data: {
            body: `${user.name ?? "알 수 없음"}님이 채팅방을 나갔습니다.`,
            type: "system",
            conversation: { connect: { id: conversationId } },
            sender: { connect: { id: user.id } },
          },
          select: { 
            id: true, 
            createdAt: true,
            body: true,
            type: true,
            senderId: true,
            conversationId: true,
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });

        // ✅ 시스템 메시지도 lastMessageId로 업데이트 (읽음 상태 기준점 역할)
        // 시스템 메시지 이후에 들어온 사용자는 이 시점까지만 읽었다고 처리되어야 함
        await tx.conversation.updateMany({
          where: { id: conversationId, lastMessageAt: { lt: systemMessage.createdAt } },
          data: { 
            lastMessageAt: systemMessage.createdAt, 
            lastMessageId: systemMessage.id 
          },
        });
      }

      return { 
        event: "member.left" as const, 
        userId: user.id, 
        recipients: nextUserIds,
        systemMessage // ✅ 시스템 메시지도 함께 반환
      };
    });

    // ✅ 3) 응답 페이로드에 이벤트 정보 포함 (클라이언트에서 소켓 발송용)
    const response = { 
      ok: true, 
      event: {
        type: result.event,
        conversationId,
        ts: Date.now(),
        rev: Date.now(),
        recipients: result.recipients ?? [],
        ...(result.event === "member.left" && { 
          userId: result.userId,
          systemMessage: result.systemMessage
        })
      }
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    if ((error as {message?: string})?.message === "NOT_FOUND") {
      return NextResponse.json({ message: "대화방이 존재하지 않습니다." }, { status: 404 });
    }
    if ((error as {message?: string})?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "해당 대화방에 접근할 수 없습니다." }, { status: 403 });
    }
    console.log("ERROR_CONVERSATION_DELETE", error);
    return NextResponse.json(
      { message: "알 수 없는 오류로 대화방을 나가지 못했습니다." },
      { status: 500 },
    );
  }
}
