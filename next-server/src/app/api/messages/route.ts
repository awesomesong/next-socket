import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";
import prisma from "@/prisma/db";
import { ObjectId as BSONObjectId } from "bson";
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

    // ObjectId 형식 검증
    if (!BSONObjectId.isValid(conversationId)) {
      return new NextResponse("conversationId 형식이 올바르지 않습니다.", { status: 400 });
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

    // (선택) 대화방 존재/참여자 확인 — userIds만 필요
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userIds: true },
    });
    if (!conv) {
      return new NextResponse("대화방을 찾을 수 없습니다.", { status: 404 });
    }
    // (선택) 권한: 요청자가 참여자인지 확인
    if (!conv.userIds.includes(user.id)) {
      return new NextResponse("대화방 참여자가 아닙니다.", { status: 403 });
    }

    // === 메시지 생성 (AI 응답이면 트랜잭션 분리) ===
    const msgId = messageId || new BSONObjectId().toHexString();
    const inferredType = image ? "image" : "text";

    let result;
    if (isAIResponse) {
      // AI 응답은 트랜잭션 없이 단순 생성 (AI 스트림에서 처리)
      result = await prisma.message.create({
        data: {
          id: msgId,
          body: body || message,
          image,
          type: type || inferredType,
          conversation: { connect: { id: conversationId } },
          sender: { connect: { id: user.id } },
          isAIResponse: true,
          isError: !!isError,
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
      
      // ✅ AI 응답도 대화방 최신시각 갱신 (일반 메시지와 동일)
      await prisma.conversation.updateMany({
        where: { id: conversationId, lastMessageAt: { lt: result.createdAt } },
        data: { 
          lastMessageAt: result.createdAt,
          lastMessageId: result.id,
        },
      });
    } else {
      // 일반 메시지는 트랜잭션으로 처리
      result = await prisma.$transaction(async (tx) => {
        // 1) 메시지 생성 (멱등: P2002면 회수)
        let newMessage;
        try {
          newMessage = await tx.message.create({
            data: {
              id: msgId,
              body: body || message,
              image,
              type: type || inferredType,
              conversation: { connect: { id: conversationId } },
              sender: { connect: { id: user.id } },
              isAIResponse: false,
              isError: !!isError,
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
        } catch (e: any) {
          if (e?.code === "P2002") {
            newMessage = await tx.message.findUniqueOrThrow({
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

        // 2) 대화방 최신시각 갱신 (조건부, 충돌 없음)
        await tx.conversation.updateMany({
          where: { id: conversationId, lastMessageAt: { lt: newMessage.createdAt } },
          data: { 
            lastMessageAt: newMessage.createdAt,
            lastMessageId: newMessage.id,
          },
        });

        return newMessage;
      }, {
        maxWait: 5000, // 5초 대기
        timeout: 10000, // 10초 타임아웃
      });
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