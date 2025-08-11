import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/app/lib/session';
import prisma from '@/prisma/db';
import { ObjectId } from 'bson';

// OPTIONS 요청 처리
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'cross-origin',
        },
    });
}

// 상수 정의
const CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_HISTORY_MESSAGES: 8,
  STREAM_TIMEOUT: 30000, // 30초
  RATE_LIMIT_WINDOW: 60000, // 1분
  RATE_LIMIT_MAX_REQUESTS: 10,
} as const;

// AI Agent별 시스템 프롬프트 정의
const AI_AGENT_PROMPTS = {
  assistant: `당신은 친근하고 도움이 되는 하이트진로 AI 어시스턴트입니다. 사용자의 질문에 대해 정확하고 유용한 답변을 제공하세요. 한국어로 대화하세요. 이전 대화 내용을 참고하여 맥락을 유지하면서 대화를 이어가세요.`
} as const;

// 입력 검증 함수
function validateInput(message: string, conversationId: string): { isValid: boolean; error?: string } {
  if (!message?.trim()) {
    return { isValid: false, error: '메시지가 비어있습니다.' };
  }
  
  if (message.length > CONSTANTS.MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: `메시지가 너무 깁니다. (최대 ${CONSTANTS.MAX_MESSAGE_LENGTH}자)` };
  }
  
  if (!conversationId?.trim()) {
    return { isValid: false, error: '대화 ID가 필요합니다.' };
  }
  
  return { isValid: true };
}

// 대화 기록을 가져오는 함수 (최적화)
async function getConversationHistory(conversationId: string, limit: number = CONSTANTS.MAX_HISTORY_MESSAGES) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
        type: 'text'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        body: true,
        isAIResponse: true,
        createdAt: true,
        sender: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return messages.reverse();
  } catch (error) {
    console.error('대화 기록 가져오기 오류:', error);
    return [];
  }
}

// 대화 컨텍스트를 포함한 메시지 배열 생성 (최적화)
function buildConversationContext(messages: any[], currentMessage: string) {
  const contextMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: AI_AGENT_PROMPTS.assistant
    }
  ];
  
  // 이전 대화 기록 추가 (최대 8개 메시지)
  const recentMessages = messages.slice(-CONSTANTS.MAX_HISTORY_MESSAGES);
  
  for (const msg of recentMessages) {
    contextMessages.push({
      role: msg.isAIResponse ? 'assistant' : 'user',
      content: msg.body
    });
  }

  // 현재 메시지 추가
  contextMessages.push({
    role: 'user',
    content: currentMessage
  });

  return contextMessages;
}

// 스트리밍 응답 처리 함수
async function handleStreamingResponse(response: Response, controller: ReadableStreamDefaultController, conversationId: string, userId: string) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let isStreamingComplete = false;

  if (!reader) {
    controller.close();
    return;
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            isStreamingComplete = true;
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              fullResponse += content;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          } catch (e) {
            // JSON 파싱 오류는 스트리밍 중 정상적인 상황이므로 무시
            console.debug('스트리밍 데이터 파싱 오류:', e);
          }
        }
      }

      if (isStreamingComplete) break;
    }

    // 스트리밍 완료 후 AI 메시지를 데이터베이스에 저장
    if (fullResponse.trim()) {
      try {
        await prisma.message.create({
          data: {
            id: new ObjectId().toHexString(),
            body: fullResponse.trim(),
            type: 'text',
            conversation: { connect: { id: conversationId } },
            sender: { connect: { id: userId } },
            seen: { connect: { id: userId } },
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
            seen: { select: { name: true, email: true } },
            conversation: { select: { isGroup: true, userIds: true } },
          }
        });
        console.log('AI 메시지가 성공적으로 저장되었습니다.');
      } catch (error) {
        console.error('AI 메시지 저장 오류:', error);
        // AI 메시지 저장 실패는 스트리밍을 중단하지 않음
      }
    }

  } catch (error) {
    console.error('스트리밍 처리 오류:', error);
    controller.error(error);
  } finally {
    reader.releaseLock();
    controller.close();
  }
}

// OpenAI API 호출 함수
async function callOpenAI(apiKey: string, contextMessages: any[]) {
  const requestBody = {
    model: 'gpt-4',
    messages: contextMessages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONSTANTS.STREAM_TIMEOUT);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'hitejinro-ai-assistant/1.0',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      // CORS 및 CSP 관련 설정 추가
      mode: 'cors',
      credentials: 'omit',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API 오류:', response.status, errorText);
      throw new Error(`AI 서비스 오류: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI 응답 시간 초과');
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const user = await getCurrentUser();
    
    if (!user?.id || !user?.email) {
      return new NextResponse('로그인이 필요합니다.', { status: 401 });
    }

    // 2. 요청 데이터 파싱 및 검증
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return new NextResponse('잘못된 요청 형식입니다.', { status: 400 });
    }

    const { message, conversationId, aiAgentType, messageId, autoSave } = requestData;

    // 3. 입력 검증
    const validation = validateInput(message, conversationId);
    if (!validation.isValid) {
      return new NextResponse(validation.error, { status: 400 });
    }

    // 4. API 키 확인
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API 키가 설정되지 않았습니다.');
      return new NextResponse('AI 서비스를 사용할 수 없습니다.', { status: 500 });
    }

    // 5. 사용자 메시지 저장 (트랜잭션 사용)
    let userMessage;
    try {
      userMessage = await prisma.message.create({
        data: {
          id: new ObjectId().toHexString(),
          body: message.trim(),
          type: 'text',
          conversation: { connect: { id: conversationId } },
          sender: { connect: { id: user.id } },
          seen: { connect: { id: user.id } },
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
          seen: { select: { name: true, email: true } },
          conversation: { select: { isGroup: true, userIds: true } },
        }
      });
    } catch (error) {
      console.error('메시지 저장 오류:', error);
      return new NextResponse('메시지 저장에 실패했습니다.', { status: 500 });
    }

    // 6. 대화 컨텍스트 준비
    const conversationHistory = await getConversationHistory(conversationId);
    const contextMessages = buildConversationContext(conversationHistory, message);

    // 7. OpenAI API 호출
    const response = await callOpenAI(apiKey, contextMessages);

    // 8. 스트리밍 응답 생성
    const stream = new ReadableStream({
      async start(controller) {
        await handleStreamingResponse(response, controller, conversationId, user.id);
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx 프록시에서 버퍼링 비활성화
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });

  } catch (error) {
    console.error('스트리밍 API 오류:', error);
    
    // 에러 타입에 따른 적절한 응답
    if (error instanceof Error) {
      if (error.message.includes('AI 응답 시간 초과')) {
        return new NextResponse('AI 응답 시간이 초과되었습니다. 다시 시도해주세요.', { status: 408 });
      }
      if (error.message.includes('AI 서비스 오류')) {
        return new NextResponse(error.message, { status: 503 });
      }
    }
    
    return new NextResponse('서버 오류가 발생했습니다.', { status: 500 });
  }
} 