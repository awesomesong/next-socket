import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { ObjectId } from "bson";

// OPTIONS 요청 처리
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { message, conversationId, aiAgentType = "assistant" } = body;

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { message: "로그인이 되지 않았습니다. 로그인 후에 이용해주세요." },
        { status: 401 },
      );
    }

    if (!message || !conversationId) {
      return NextResponse.json(
        { message: "메시지와 대화방 ID가 필요합니다." },
        { status: 400 },
      );
    }

    // 사용자 메시지 저장
    const userMessageId = new ObjectId().toHexString();
    const userMessage = await prisma.message.create({
      data: {
        id: userMessageId,
        body: message,
        type: "text",
        conversation: { connect: { id: conversationId } },
        sender: { connect: { id: user.id } },
        isAIResponse: false,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        conversationId: true,
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        conversation: { select: { isGroup: true, userIds: true } },
      },
    });

    // AI 응답 생성 (실제로는 OpenAI API 등을 호출)
    const aiResponse = await generateAIResponse(
      message,
      aiAgentType,
      conversationId,
    );

    // AI 메시지 저장
    const aiMessageId = new ObjectId().toHexString();
    const aiMessage = await prisma.message.create({
      data: {
        id: aiMessageId,
        body: aiResponse,
        type: "text",
        conversation: { connect: { id: conversationId } },
        sender: { connect: { id: user.id } }, // AI는 사용자 ID를 사용
        isAIResponse: true,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        conversationId: true,
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        conversation: { select: { isGroup: true, userIds: true } },
      },
    });

    // conversation 업데이트
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json(
      {
        userMessage,
        aiMessage,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cross-Origin-Embedder-Policy": "unsafe-none",
          "Cross-Origin-Opener-Policy": "same-origin",
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
      },
    );
  } catch (error) {
    console.log("ERROR_AI_CHAT", error);
    return NextResponse.json(
      { message: "AI 채팅 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// AI 응답 생성 함수 (실제로는 OpenAI API 등을 사용)
async function generateAIResponse(
  userMessage: string,
  aiAgentType: string,
  conversationId: string,
): Promise<string> {
  // 여기서 실제 AI API 호출을 구현
  // 예시로 간단한 응답 생성

  const responses = {
    assistant: [
      "안녕하세요! 무엇을 도와드릴까요?",
      "좋은 질문이네요. 더 자세히 설명해드릴게요.",
      "그것에 대해 알아보겠습니다. 잠시만요.",
      "흥미로운 주제네요! 더 구체적으로 말씀해주세요.",
    ],
    bartender: [
      "안녕하세요! 오늘 어떤 칵테일을 만들어드릴까요?",
      "좋은 선택이네요! 그 칵테일의 레시피를 알려드릴게요.",
      "술에 대해 궁금한 점이 있으시면 언제든 물어보세요!",
      "새로운 칵테일을 추천해드릴까요?",
    ],
    sommelier: [
      "안녕하세요! 와인에 대해 궁금한 점이 있으시군요.",
      "좋은 와인을 선택하는 방법을 알려드릴게요.",
      "음식과 어울리는 와인을 추천해드릴까요?",
      "와인에 대한 질문이 있으시면 언제든 물어보세요!",
    ],
  };

  const possibleResponses =
    responses[aiAgentType as keyof typeof responses] || responses.assistant;

  // 간단한 키워드 기반 응답
  if (userMessage.includes("안녕") || userMessage.includes("hello")) {
    return possibleResponses[0];
  } else if (userMessage.includes("추천") || userMessage.includes("추천해")) {
    return possibleResponses[3];
  } else if (userMessage.includes("레시피") || userMessage.includes("방법")) {
    return possibleResponses[1];
  } else {
    return possibleResponses[
      Math.floor(Math.random() * possibleResponses.length)
    ];
  }
}
