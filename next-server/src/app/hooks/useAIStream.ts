import { useRef, useCallback } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ObjectId } from "bson";
import { aiStream } from "@/src/app/lib/aiStream";
import { formatErrorMessage } from "@/src/app/lib/react-query/utils";
import {
  updateMessagePartialById,
  bumpConversationOnNewMessage,
  upsertMessageSortedInCache,
  replaceOptimisticMessage,
  messagesKey,
} from "@/src/app/lib/react-query/chatCache";
import type { FullMessageType } from "@/src/app/types/conversation";
import { normalizePreviewType } from "@/src/app/types/conversation";
import { useFailedMessages } from "@/src/app/hooks/useFailedMessages";

interface UseAIStreamOptions {
  conversationId: string;
  aiAgentType?: "assistant";
  onNewContent?: () => void;
}

interface RequestAIOptions {
  userMessage: string;
  userMessageId: string; // 서버가 이 ID로 사용자 메시지 조회 → +1ms 계산
  userCreatedAt?: Date | string; // ✅ 재시도 시 서버에서 받은 사용자 메시지 시간 (클라이언트 정렬용)
  isRetry?: boolean;
  existingAIMessageId?: string; // 재시도 시 기존 AI 메시지 제거용
  currentUser?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  conversation?: {
    isGroup: boolean | null;
    userIds: string[];
  };
}

export const useAIStream = ({ conversationId, aiAgentType = "assistant", onNewContent }: UseAIStreamOptions) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { addFailedMessage, removeFailedMessage } = useFailedMessages(conversationId);

  const requestAI = useCallback(
    async ({ 
      userMessage, 
      userMessageId,
      userCreatedAt: providedUserCreatedAt,
      isRetry = false,
      existingAIMessageId,
      currentUser, 
      conversation 
    }: RequestAIOptions) => {
        // 재시도 시: 기존 실패한 AI 메시지 제거
        if (isRetry && existingAIMessageId) {
            queryClient.setQueryData(messagesKey(conversationId),
                (old: InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }> | undefined) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page, idx) =>
                            idx === 0
                            ? { ...page, messages: page.messages.filter((m) => String(m.id) !== String(existingAIMessageId)) }
                            : page
                        ),
                    };
                }
            );
            // localStorage에서도 제거
            removeFailedMessage(conversationId, existingAIMessageId);
        }

        // ✅ AI 대기 메시지 생성 (재시도 시에도 항상 새 ID 생성)
        const aiWaitingMessageId = new ObjectId().toHexString();
        const userId = currentUser?.id || userMessageId;
        
        // ✅ AI 대기 메시지의 createdAt 계산
        let aiCreatedAt: Date;
        
        if (providedUserCreatedAt) {
          // 재시도: 서버에서 받은 사용자 메시지 시간 +1ms
          const userTime = new Date(providedUserCreatedAt);
          aiCreatedAt = new Date(userTime.getTime() + 1);
        } else {
          // 일반: 캐시에서 사용자 메시지 조회
          const cache = queryClient.getQueryData(messagesKey(conversationId)) as InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }> | undefined;
          const userMsg = cache?.pages?.flatMap(p => p.messages).find(m => String(m.id) === String(userMessageId));
          const userTime = userMsg?.createdAt ? new Date(userMsg.createdAt) : new Date();
          aiCreatedAt = new Date(userTime.getTime() + 1);
        }
      
        const aiWaitingMessage: FullMessageType = {
            id: aiWaitingMessageId,
            body: "AI가 응답을 준비 중입니다.",
            image: null,
            createdAt: aiCreatedAt, // ✅ 사용자 메시지 + 1ms
            type: "text",
            conversationId,
            senderId: userId,
            sender: {
                id: userId,
                name: currentUser?.name || "Unknown",
                email: currentUser?.email || "",
                image: currentUser?.image ?? null,
            },
            conversation: {
                isGroup: conversation?.isGroup ?? false,
                userIds: conversation?.userIds || [userId],
            },
            isAIResponse: true,
            isError: false,
            isWaiting: true,
            isTyping: true,
        };

        upsertMessageSortedInCache(queryClient, conversationId, aiWaitingMessage);
      
        // ✅ AI 대기 메시지 추가 후 스크롤 이벤트 발생 (재시도 시에도 동작)
        onNewContent?.();

        // AI 스트림 요청
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const timeoutId = setTimeout(() => abortController.abort(), 60000);

        try {
            let fullResponse = "";
            const streamResult = await aiStream({
            endpoint: "/api/ai/stream",
            payload: {
                message: userMessage,
                conversationId,
                aiAgentType,
                messageId: aiWaitingMessageId, // ✅ 항상 새 ID
                existingAIMessageId: isRetry ? existingAIMessageId : undefined, // ✅ 재시도 시 기존 메시지 ID 전달 (서버에서 삭제)
                autoSave: true,
                userMessageId, // 서버가 이 ID로 사용자 메시지 조회 → +1ms 계산
            },
            signal: abortController.signal,
            onDelta: (chunk) => {
                fullResponse += chunk;
                updateMessagePartialById(queryClient, conversationId, aiWaitingMessageId, {
                    body: fullResponse,
                    isWaiting: false,
                    isTyping: true,
                });
                onNewContent?.();
            },
            });

            // ✅ 서버에서 받은 메타데이터로 메시지 업데이트
            if (streamResult?.createdAt) {
                // 캐시에서 현재 메시지 조회
                const cache = queryClient.getQueryData(messagesKey(conversationId)) as InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }> | undefined;
                const currentMsg = cache?.pages?.flatMap(p => p.messages).find(m => String(m.id) === String(aiWaitingMessageId));
                
                if (currentMsg) {
                    // ✅ 서버 createdAt으로 메시지 재생성하여 정렬 보장
                    const updatedMessage: FullMessageType = {
                        ...currentMsg,
                        body: fullResponse,
                        createdAt: new Date(streamResult.createdAt),
                        isTyping: false,
                        isWaiting: false,
                        isError: false,
                    };
                    
                    // 기존 메시지 제거 후 정렬 삽입 (createdAt 변경 반영)
                    replaceOptimisticMessage(queryClient, conversationId, aiWaitingMessageId, updatedMessage);
                }
            } else {
                // 메타데이터가 없으면 기존 방식대로
                updateMessagePartialById(queryClient, conversationId, aiWaitingMessageId, {
                    isTyping: false,
                    isWaiting: false,
                });
            }
            
            // 성공 시 localStorage에서 제거 (실패했다가 재시도 성공한 경우)
            removeFailedMessage(conversationId, aiWaitingMessageId);

            // ConversationList 업데이트 (미리보기용 50자만)
            bumpConversationOnNewMessage(queryClient, conversationId, {
                id: aiWaitingMessageId,
                body: fullResponse.length > 50 ? fullResponse.substring(0, 50) : fullResponse,
                type: normalizePreviewType("text"),
                createdAt: streamResult?.createdAt ? new Date(streamResult.createdAt) : new Date(),
                isAIResponse: true,
            });

            onNewContent?.();
        } catch (error) {
            const msg = error instanceof Error && error.name === "AbortError"
                ? "AI 응답 시간이 초과되었습니다. 다시 시도해주세요."
                : formatErrorMessage(error, "AI 응답 생성 중 오류가 발생했습니다.");
            
            toast.error(msg);
            
            // 실패한 AI 메시지 생성 (캐시 + localStorage)
            const failedAIMessage: FullMessageType = {
                ...aiWaitingMessage,
                body: "AI 응답 실패. 위의 버튼을 눌러 재시도하세요.",
                isError: true,
                isTyping: false,
                isWaiting: false,
            };
            
            // 캐시에서 에러 상태 업데이트
            updateMessagePartialById(queryClient, conversationId, aiWaitingMessageId, {
                body: failedAIMessage.body,
                isError: true,
                isTyping: false,
                isWaiting: false,
            });
            
            // localStorage에 실패 메시지 저장 (완전한 메시지 객체 사용)
            addFailedMessage(conversationId, failedAIMessage);
        } finally {
            clearTimeout(timeoutId);
            if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null;
            }
        }
    },[queryClient, conversationId, aiAgentType, onNewContent, addFailedMessage, removeFailedMessage]);

    const abort = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
    }, []);

    return { requestAI, abort };
};

