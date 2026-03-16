import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";
import prisma from "@/prisma/db";
import { containsProhibited } from "@/src/app/utils/aiPolicy";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id || !user?.email) {
      return new NextResponse("로그인이 필요합니다.", { status: 401 });
    }

    const {
      conversationId,
      body,
      message,
      type,
      isAIResponse,
      messageId,
      image,
      isError,
    } = await req.json();

    // 간단 유효성
    if (!conversationId || typeof conversationId !== "string") {
      return new NextResponse("conversationId가 유효하지 않습니다.", { status: 400 });
    }

    // 빈 메시지 방지 (텍스트/이미지 둘 다 없음)
    const hasContent = !!(image || (body ?? message)?.trim());
    if (!hasContent && !isAIResponse && !isError) {
      return new NextResponse("메시지 내용이 없습니다.", { status: 400 });
    }

    // 금칙어(일반 채팅)
    const text = (body || message || "").toString();
    if (text && containsProhibited(text)) {
      return new NextResponse("부적절한 내용은 허용되지 않습니다.", { status: 400 });
    }

    // 대화방 존재 + 참여자 확인을 한 쿼리로
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userIds: { has: user.id } },
      select: { id: true, userIds: true },
    });
    if (!conv) {
      return new NextResponse("대화방을 찾을 수 없거나 참여자가 아닙니다.", { status: 403 });
    }

    // now를 미리 생성 → create + updateMany 간 데이터 의존성 제거
    const msgId = messageId || crypto.randomUUID();
    const now = new Date();
    const inferredType = image ? "image" : "text";

    const msgSelect = {
      id: true,
      body: true,
      image: true,
      type: true,
      createdAt: true,
      conversationId: true,
      sender: { select: { id: true, name: true, email: true, image: true } },
    } as const;

    // 배치 트랜잭션: create + updateMany를 한 번에 전송
    let result;
    try {
      [result] = await prisma.$transaction([
        prisma.message.create({
          data: {
            id: msgId,
            createdAt: now,
            body: body || message,
            image,
            type: type || inferredType,
            conversation: { connect: { id: conversationId } },
            sender: { connect: { id: user.id } },
            isAIResponse: !!isAIResponse,
            isError: !!isError,
          },
          select: msgSelect,
        }),
        prisma.conversation.updateMany({
          where: { id: conversationId, lastMessageAt: { lt: now } },
          data: { lastMessageAt: now, lastMessageId: msgId },
        }),
      ]);
    } catch (e) {
      if ((e as { code?: string })?.code === "P2002") {
        // 멱등: 이미 존재하는 메시지 반환
        result = await prisma.message.findUniqueOrThrow({
          where: { id: msgId },
          select: msgSelect,
        });
      } else {
        throw e;
      }
    }

    // 응답
    return NextResponse.json({
      newMessage: {
        ...result,
        serverCreatedAtMs: new Date(result.createdAt).getTime(),
        // ✅ conversation 정보 포함
        conversation: {
          isGroup: conv.userIds.length > 2,
          userIds: conv.userIds,
        },
      },
    });
  } catch (err) {
    console.error("[POST /api/messages] error:", err);
    return new NextResponse("서버 오류", { status: 500 });
  }
}