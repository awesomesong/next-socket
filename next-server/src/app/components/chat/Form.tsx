'use client';
import useConversation from "@/src/app/hooks/useConversation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane } from "react-icons/hi2";
import MessageTextarea from "./MessageTextarea";
import TextareaAutosize from 'react-textarea-autosize';
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/src/app/lib/sendMessage";
import toast from "react-hot-toast";
import { RefObject, useCallback, useEffect, useRef } from "react";
import ImageUploadButton from "@/src/app/components/ImageUploadButton";
import { useSocket } from "../../context/socketContext";
import useComposition from "@/src/app/hooks/useComposition";
import useConversationUserList from "../../hooks/useConversationUserList";
import { FullMessageType } from "../../types/conversation";
import { useSession } from "next-auth/react";
import { isAtBottom } from "../../utils/isAtBottom";
import { ObjectId } from 'bson'; 

interface Props  {
    scrollRef: RefObject<HTMLDivElement | null>;
    bottomRef: RefObject<HTMLDivElement | null>;
}

const Form = ({ scrollRef, bottomRef }: Props) => {
    const socket = useSocket();
    const { conversationId } = useConversation();
    const { conversationUsers } = useConversationUserList();
    const queryClient = useQueryClient();
    const { data: session } =useSession();

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            if (bottomRef.current) {
                // 현재 스크롤이 맨 아래에 있을 때만 자동으로 스크롤
                bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        });
    }, [bottomRef]);

    const { 
        mutateAsync, 
        isSuccess
    }  = useMutation({
        mutationFn: sendMessage,
        onMutate: async (newMessage) => {
            if (isAtBottom(scrollRef.current)) {
                requestAnimationFrame(() => {
                    scrollToBottom();
                });
            }

            const conversationId = newMessage.conversationId;
            const messageId = newMessage.messageId; 

            const body = newMessage.data?.message?.trim() || null;
            const image = newMessage.image || null;

            const previousData = queryClient.getQueryData<
                InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }>
            >(['messages', conversationId]);

            const user = session?.user;
            const userIds = conversationUsers.find((item) => item.conversationId === conversationId)?.userIds ?? [];

            const isGroupChat = userIds.length > 2;

            const optimisticMessage = {
                id: messageId,
                body,
                image,
                createdAt: new Date().toISOString(),
                type: 'text',
                conversationId,
                senderId: user?.id!,
                sender: {
                  id: user?.id!,
                  name: user?.name!,
                  email: user?.email!,
                  image: user?.image ?? null,
                },
                seen: [
                  {
                    name: user?.name!,
                    email: user?.email!,
                  },
                ],
                seenId: [],
                conversation: {
                  isGroup: isGroupChat,
                  userIds,
                },
                readStatuses: [],
            };

            // ✅ 메시지 목록에 낙관적 업데이트 (고유 ID로 구분)
            queryClient.setQueryData(['messages', conversationId], (old: any) => {
                if (!old) {
                    return {
                        pageParams: [null],
                        pages: [{ messages: [optimisticMessage], nextCursor: null }],
                    };
                }

                const updatedPages = old.pages.map((page: { messages: FullMessageType[] }, index: number) => {
                    if (index === 0) { // 가장 최신 메시지가 있는 첫 페이지에 추가
                        return {
                            ...page,
                            messages: [optimisticMessage, ...page.messages],
                        };
                    }
                    return page;
                });
            
                return {
                    ...old,
                    pages: updatedPages,
                };
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
                                    id: messageId,
                                    body: body || '이미지를 보냈습니다.',
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

            return { previousData, messageId };
        },
        onSuccess: (data) => {
            if(socket) socket.emit('send:message', data);
        },
        onError: (error, _variables, context) => {
            // 실패한 메시지를 목록에서 제거하지 말고 오류 상태로 표시하여 재전송 가능하게 유지
            if (context?.messageId) {
                queryClient.setQueriesData(
                    { queryKey: ['messages', _variables.conversationId] },
                    (old: InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }> | undefined) => {
                        if (!old) return old;
                        const newPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
                            ...page,
                            messages: page.messages.map((msg: any) =>
                                msg.id === context.messageId
                                    ? { ...msg, isError: true }
                                    : msg
                            )
                        }));
                        return { ...old, pages: newPages };
                    }
                );
            }

            toast.error(`${(error as any)?.message || '메시지 전송에 실패했습니다. 다시 시도해주세요.'}`);
        },
        onSettled: (_data, _error, variables) => {
        }
    });

    // ✅ 전송 직렬화를 위한 큐
    type SendVariables = { conversationId: string; data?: FieldValues; image?: string; messageId: string };
    const queueRef = useRef<SendVariables[]>([]);
    const sendingRef = useRef(false);

    const processQueue = useCallback(async () => {
        if (sendingRef.current) return;
        sendingRef.current = true;
        try {
            while (queueRef.current.length > 0) {
                const vars = queueRef.current[0];
                // 직렬 전송: 이전 요청 완료까지 대기
                await mutateAsync(vars as any);
                queueRef.current.shift();
            }
        } finally {
            sendingRef.current = false;
        }
    }, [mutateAsync]);

    const enqueueSend = useCallback((vars: SendVariables) => {
        queueRef.current.push(vars);
        // 즉시 처리 시도 (진행 중이면 반환)
        void processQueue();
    }, [processQueue]);

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        trigger,
        setFocus,
        formState: {
            errors
        }
    } = useForm<FieldValues>({
        defaultValues: {
            message: ''
        }
    });

    useEffect(() => {
        setFocus("message");
    }, [isSuccess]);

    const { ref: inputRef, ...rest } = register('message', { required: true });

    const onSubmit:SubmitHandler<FieldValues> = async (data) => {
        if(!data) return;

        const messageId = new ObjectId().toHexString(); 
        enqueueSend({ conversationId, data, messageId });
        setValue('message', '', { shouldValidate : true});
        setFocus("message");
        if(socket) socket.emit('join:room', conversationId);
    };

    const handleUpload = async (result: any) => {
        if(!result?.info?.secure_url) return;

        const messageId = new ObjectId().toHexString(); 
        enqueueSend({ conversationId, image: result?.info?.secure_url, messageId });
    };

    // ✅ 조합 입력 훅 적용
    const {
        isComposing,
        handleCompositionStart,
        handleCompositionEnd
    } = useComposition();

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isComposing()) return;
        if (e.key === 'Enter' && !e.shiftKey ) {
            e.preventDefault(); 
            // trigger(); // execute react-hook-form submit programmatically 
            
            const value = getValues('message'); // get user input value
            if (value.trim().length === 0) return; // 빈 메시지 방지

            await onSubmit({ message: value }, e);
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
            <ImageUploadButton 
                onUploadSuccess={handleUpload}
                variant="compact"
            />
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex items-center gap-2 w-full"
            >
                {/* <MessageTextarea
                    id="message"
                    register={register}
                    errors={errors}
                    required
                    placeholder="메시지를 작성해주세요."
                    onKeyDown={handleKeyPress}
                /> */}
                <TextareaAutosize
                    id="message"
                    minRows={2}
                    maxRows={4}
                    {...register('message', { required: true })}
                    placeholder="메시지를 작성해주세요."
                    onKeyDown={handleKeyPress}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
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
                <button 
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    className="
                        rounded-full
                        p-2
                        bg-sky-500
                        cursor-pointer
                        hover:bg-sky-600
                        transition
                    "
                >
                    <HiPaperAirplane 
                        size={20}
                        className="text-white"
                    />
                </button>
            </form>
        </div>
    )
}

export default Form;
