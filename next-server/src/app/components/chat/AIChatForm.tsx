'use client';
import { useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { RefObject, useEffect, useState, useCallback, useRef } from 'react';
import useComposition from '@/src/app/hooks/useComposition';
import { HiPaperAirplane } from 'react-icons/hi2';
import TextareaAutosize from 'react-textarea-autosize';
import { isAtBottomForAI } from '@/src/app/utils/isAtBottom';
import { useSession } from 'next-auth/react';
import { ObjectId } from 'bson';
import { FullMessageType } from '@/src/app/types/conversation';

interface Props {
    scrollRef: RefObject<HTMLDivElement | null>;
    bottomRef: RefObject<HTMLDivElement | null>;
    conversationId: string;
    aiAgentType?: 'assistant';
}

const AIChatForm = ({ scrollRef, bottomRef, conversationId, aiAgentType = 'assistant' }: Props) => {
    const [isDisabled, setIsDisabled] = useState(false);
    const [retryMessage, setRetryMessage] = useState<string | null>(null); // ✅ 재시도 메시지 저장
    const autoScrollEnabled = useRef(true);
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    const scrollToBottom = useCallback(() => {
        if (!autoScrollEnabled.current) return; // 자동 스크롤이 비활성화되어 있으면 스크롤하지 않음
        
        requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }, [bottomRef]);

    // ✅ 스크롤 상태 감지 (throttle 적용)
    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;

        
        const handleScroll = () => {
            const isAtBottom = isAtBottomForAI(scrollElement, 8);
            autoScrollEnabled.current = isAtBottom;
        };

        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // 초기 상태 설정

        return () => {
            scrollElement.removeEventListener('scroll', handleScroll);
        };
    }, [scrollRef]);

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        setFocus,
        formState: { errors }
    } = useForm<FieldValues>({
        defaultValues: { message: '' }
    });

    useEffect(() => {
        setFocus('message');
    }, [setFocus]);

    const sendAIRequest = async (message: string, aiWaitingMessageId: string) => {
        // AbortController를 사용하여 요청 취소 가능하게 만들기
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60초 타임아웃

        try {
            const response = await fetch('/api/ai/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message, 
                    conversationId, 
                    aiAgentType,
                    messageId: aiWaitingMessageId,
                    autoSave: true
                }),
                signal: abortController.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI 응답 생성 중 오류가 발생했습니다. (${response.status}: ${errorText})`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let isStreamingComplete = false;

            if (!reader) {
                throw new Error('스트리밍 응답을 읽을 수 없습니다.');
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
                                const content = parsed.content;
                                
                                if (content && typeof content === 'string') {
                                    fullResponse += content;

                                    // AI 메시지 실시간 업데이트
                                    queryClient.setQueryData(['messages', conversationId], (old: any) => {
                                        if (!old) return old;
                                        
                                        const updatedPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
                                            ...page,
                                            messages: page.messages.map((msg: FullMessageType) =>
                                                msg.id === aiWaitingMessageId
                                                    ? { 
                                                        ...msg, 
                                                        body: fullResponse, 
                                                        isWaiting: false, 
                                                        isTyping: true,
                                                        updatedAt: new Date()
                                                    }
                                                    : msg
                                            )
                                        }));
                                        
                                        return { ...old, pages: updatedPages };
                                    });

                                    // 실시간 스크롤
                                    if (autoScrollEnabled.current) {
                                        requestAnimationFrame(() => scrollToBottom());
                                    }
                                }
                            } catch (parseError) {
                                // JSON 파싱 오류는 스트리밍 중 정상적인 상황이므로 무시
                                console.debug('스트리밍 데이터 파싱 오류:', parseError);
                            }
                        }
                    }

                    if (isStreamingComplete) break;
                }
            } finally {
                reader.releaseLock();
            }

            // 스트리밍 완료 후 최종 상태 업데이트
            queryClient.setQueryData(['messages', conversationId], (old: any) => {
                if (!old) return old;
                
                const updatedPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
                    ...page,
                    messages: page.messages.map((msg: FullMessageType) =>
                        msg.id === aiWaitingMessageId 
                            ? { 
                                ...msg, 
                                isTyping: false,
                                isWaiting: false,
                                updatedAt: new Date()
                            } 
                            : msg
                    )
                }));
                
                return { ...old, pages: updatedPages };
            });

            // ConversationList 즉시 업데이트 (AI 응답 완료 시)
            queryClient.setQueryData(['conversationList'], (old: any) => {
                if (!old) return old;
                
                const updatedConversations = old.conversations.map((conversation: any) => {
                    if (conversation.id === conversationId) {
                        return {
                            ...conversation,
                            messages: [
                                {
                                    id: aiWaitingMessageId,
                                    body: fullResponse,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    isAIResponse: true
                                },
                                ...(conversation.messages || [])
                            ],
                            lastMessageAt: new Date() // ✅ lastMessageAt 업데이트
                        };
                    }
                    return conversation;
                });

                // 최신 메시지가 있는 대화를 맨 위로 이동
                const reorderedConversations = updatedConversations.sort((a: any, b: any) => 
                    a.id === conversationId ? -1 : b.id === conversationId ? 1 : 0
                );

                return { ...old, conversations: reorderedConversations };
            });

            // ✅ 최종 스크롤
            if (autoScrollEnabled.current) {
                requestAnimationFrame(() => scrollToBottom());
            }

            setIsDisabled(false);
            setRetryMessage(null);

        } catch (error) {
            console.error('AI 스트리밍 오류:', error);
            
            // 타임아웃 오류 처리
            if (error instanceof Error && error.name === 'AbortError') {
                toast.error('AI 응답 시간이 초과되었습니다. 다시 시도해주세요.');
            } else {
                toast.error('AI 응답 생성 중 오류가 발생했습니다.');
            }
            
            setRetryMessage(message);

            // ✅ 에러 메시지만 데이터베이스에 저장 (사용자 메시지는 이미 저장됨)
            try {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conversationId,
                        body: 'AI 응답 실패. 아래 버튼을 눌러 재시도하세요.',
                        type: 'text',
                        isAIResponse: true,
                        isError: true,
                        messageId: aiWaitingMessageId
                    }),
                });
                console.log('AI 에러 메시지가 성공적으로 저장되었습니다.');
            } catch (saveError) {
                console.error('에러 메시지 저장 실패:', saveError);
            }

            // 에러 상태로 메시지 업데이트
            queryClient.setQueryData(['messages', conversationId], (old: any) => {
                if (!old) return old;
                
                const updatedPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
                    ...page,
                    messages: page.messages.map((msg: FullMessageType) =>
                        msg.id === aiWaitingMessageId
                            ? { 
                                ...msg, 
                                body: 'AI 응답 실패. 아래 버튼을 눌러 재시도하세요.', 
                                isError: true,
                                isTyping: false,
                                isWaiting: false,
                                updatedAt: new Date()
                            }
                            : msg
                    )
                }));
                
                return { ...old, pages: updatedPages };
            });

            setIsDisabled(false);
        } finally {
            clearTimeout(timeoutId);
        }
    };

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {
        if (!data || isDisabled) return;

        setIsDisabled(true);
        const user = session?.user;

        // ✅ 입력 필드 초기화
        setValue('message', '', { shouldValidate: true });
        setFocus('message');

        const userMessageId = new ObjectId().toHexString();
        const aiWaitingMessageId = new ObjectId().toHexString();

        // ✅ 사용자 메시지
        const optimisticUserMessage: FullMessageType = {
            id: userMessageId,
            body: data.message,
            image: null,
            createdAt: new Date(),
            type: 'text',
            conversationId,
            senderId: user?.id!,
            sender: {
                id: user?.id!,
                name: user?.name!,
                nickname: null,
                email: user?.email!,
                emailVerified: null,
                image: user?.image ?? null,
                profileImage: null,
                hashedPassword: null,
                role: null,
                provider: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                conversationsIds: [],
                seenMesssageIds: []
            },
            seen: [{ 
                id: user?.id!, 
                name: user?.name!, 
                nickname: null,
                email: user?.email!, 
                emailVerified: null,
                image: user?.image ?? null,
                profileImage: null,
                hashedPassword: null,
                role: null,
                provider: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                conversationsIds: [],
                seenMesssageIds: []
            }],
            seenId: [],
            conversation: { isGroup: false, userIds: [user?.id!] },
            readStatuses: [],
            isAIResponse: false,
            isError: false
        };

        // ✅ AI 대기 메시지
        const optimisticAIMessage: FullMessageType = {
            id: aiWaitingMessageId,
            body: 'AI가 응답을 준비 중입니다...',
            image: null,
            createdAt: new Date(),
            type: 'text',
            conversationId,
            senderId: user?.id!,
            sender: {
                id: user?.id!,
                name: user?.name!,
                nickname: null,
                email: user?.email!,
                emailVerified: null,
                image: user?.image ?? null,
                profileImage: null,
                hashedPassword: null,
                role: null,
                provider: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                conversationsIds: [],
                seenMesssageIds: []
            },
            seen: [{ 
                id: user?.id!, 
                name: user?.name!, 
                nickname: null,
                email: user?.email!, 
                emailVerified: null,
                image: user?.image ?? null,
                profileImage: null,
                hashedPassword: null,
                role: null,
                provider: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                conversationsIds: [],
                seenMesssageIds: []
            }],
            seenId: [],
            conversation: { isGroup: false, userIds: [user?.id!] },
            readStatuses: [],
            isAIResponse: true,
            isError: false,
            isWaiting: true,
            isTyping: true
        };

        // ✅ 메시지 목록에 추가
        queryClient.setQueryData(['messages', conversationId], (old: any) => {
            if (!old) {
                return {
                    pageParams: [null],
                    pages: [{ messages: [optimisticUserMessage, optimisticAIMessage], nextCursor: null }]
                };
            }
            const updatedPages = old.pages.map((page: { messages: FullMessageType[] }, index: number) =>
                index === 0
                    ? { ...page, messages: [optimisticUserMessage, optimisticAIMessage, ...page.messages] }
                    : page
            );
            return { ...old, pages: updatedPages };
        });

        // ✅ ConversationList 즉시 업데이트 (사용자 메시지 전송 시)
        queryClient.setQueryData(['conversationList'], (old: any) => {
            if (!old) return old;
            
            const updatedConversations = old.conversations.map((conversation: any) => {
                if (conversation.id === conversationId) {
                    return {
                        ...conversation,
                        messages: [
                            {
                                id: userMessageId,
                                body: data.message,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                isAIResponse: false
                            },
                            ...(conversation.messages || [])
                        ],
                        lastMessageAt: new Date() // ✅ lastMessageAt 즉시 업데이트
                    };
                }
                return conversation;
            });

            // 최신 메시지가 있는 대화를 맨 위로 이동
            const reorderedConversations = updatedConversations.sort((a: any, b: any) => 
                a.id === conversationId ? -1 : b.id === conversationId ? 1 : 0
            );

            return { ...old, conversations: reorderedConversations };
        });

        // ✅ 사용자 메시지 추가 후 스크롤
        requestAnimationFrame(() => {
            if (autoScrollEnabled.current) {
                scrollToBottom();
            }
        });

        // ✅ 사용자 메시지를 먼저 DB에 저장
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    body: data.message,
                    type: 'text',
                    isAIResponse: false,
                    isError: false,
                    messageId: userMessageId
                }),
            });
            console.log('사용자 메시지가 성공적으로 저장되었습니다.');
        } catch (saveError) {
            console.error('사용자 메시지 저장 실패:', saveError);
            // 사용자 메시지 저장 실패 시에도 AI 요청은 계속 진행
        }

        // ✅ AI 요청 실행
        await sendAIRequest(data.message, aiWaitingMessageId);
    };

    const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposition();

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isComposing()) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (isDisabled) return;
            const value = getValues('message');
            if (value.trim().length === 0) return;
            await onSubmit({ message: value });
        }
    };

    return (
        <div
            className="
                flex
                items-start
                gap-2
                w-full
                px-4
                py-2
                bg-default
                border-t-default
            "
        >
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex items-center gap-2 w-full"
            >
                <TextareaAutosize
                    id="message"
                    minRows={2}
                    maxRows={4}
                    {...register('message', { required: true })}
                    placeholder={retryMessage ? '실패한 메시지를 재시도 버튼을 눌러 다시 시도하세요.' : isDisabled ? 'AI 응답이 완료될 때까지 기다려주세요.' : '하이트진로 AI 어시스턴트에게 궁금한 점을 물어보세요.'}
                    onKeyDown={handleKeyPress}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    disabled={isDisabled}
                    className='
                        w-full 
                        bg-default
                        border-default
                        rounded-lg
                        p-2
                        font-light
                        resize-none
                        focus:outline-none
                    '
                />
                {retryMessage ? (
                    // 재시도 버튼이 있을 때는 재시도 버튼 표시
                    <button
                        type="button"
                        onClick={() => {
                            setRetryMessage(null);
                            setIsDisabled(true);
                            const aiWaitingMessageId = new ObjectId().toHexString();
                            sendAIRequest(retryMessage, aiWaitingMessageId);
                        }}
                        className="
                            rounded-full
                            p-2
                            bg-red-500
                            cursor-pointer
                            hover:bg-red-600
                            transition
                        "
                    >
                        <HiPaperAirplane 
                            size={20}
                            className="text-white"
                        />
                    </button>
                ) : (
                    // 재시도 버튼이 없을 때는 일반 submit 버튼 표시
                    <button 
                        type="submit"
                        disabled={isDisabled}
                        className="
                            rounded-full
                            p-2
                            bg-sky-500
                            cursor-pointer
                            hover:bg-sky-600
                            transition
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                    >
                        <HiPaperAirplane 
                            size={20}
                            className="text-white"
                        />
                    </button>
                )}
            </form>
        </div>
    );
};

export default AIChatForm;
