'use client';
import useConversation from "@/src/app/hooks/useConversation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane } from "react-icons/hi2";
import MessageTextarea from "./MessageTextarea";
import TextareaAutosize from 'react-textarea-autosize';
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/src/app/lib/sendMessage";
import toast from "react-hot-toast";
import { RefObject, useEffect, useState } from "react";
import ImageUploadButton from "@/src/app/components/ImageUploadButton";
import { useSocket } from "../../context/socketContext";
import useComposition from "@/src/app/hooks/useComposition";
import useConversationUserList from "../../hooks/useConversationUserList";
import { FullMessageType } from "../../types/conversation";
import { useSession } from "next-auth/react";

interface Props  {
    scrollRef: RefObject<HTMLDivElement>;
    bottomRef: RefObject<HTMLDivElement>;
}

const Form = ({ scrollRef, bottomRef }: Props) => {
    const socket = useSocket();
    const [ isDisabled, setIsDisabled ] = useState(false);
    const { conversationId } = useConversation();
    const { conversationUsers } = useConversationUserList();
    const queryClient = useQueryClient();
    const { data: session } =useSession();

    const { 
        mutate, 
        data,
        isSuccess
    }  = useMutation({
        mutationFn: sendMessage,
        onMutate: (newMessage) => {
            const conversationId = newMessage.conversationId;
            const clientGeneratedId = newMessage.clientGeneratedId; 

            const body = newMessage.data?.message?.trim() || null;
            const image = newMessage.image || null;

            const previousData = queryClient.getQueryData<
                InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }>
            >(['messages', conversationId]);

            const user = session?.user;
            const userIds = conversationUsers .find((item) => item.conversationId === conversationId)?.userIds ?? [];

            const isGroupChat = userIds.length > 2;

            const optimisticMessage = {
                id: clientGeneratedId,
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

            queryClient.setQueryData(['messages', conversationId], (old: any) => {
                if (!old) {
                  return {
                    pageParams: [null],
                    pages: [{ messages: [optimisticMessage], nextCursor: null }],
                  };
                }
            
                return {
                  ...old,
                  pages: [
                    {
                      ...old.pages[0],
                      messages: [optimisticMessage, ...old.pages[0].messages],
                    },
                    ...old.pages.slice(1),
                  ],
                };
            });

            return { previousData };
        },
        onSuccess: (data) => {
            if(socket) socket.emit('send:message', data);
        },
        onError: (error, _variables, context) => {
            // 이전 optimistic 캐시로 롤백
            if (context?.previousData) {
              queryClient.setQueryData(["messages", _variables.conversationId], context.previousData);
            }

            toast.error(`${error.message || '대화 내용이 입력되지 못했습니다.'}`);
        },
        onSettled: (_data, _error, variables) => {
            requestAnimationFrame(() => {
                if (bottomRef.current) {
                    bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
                }

                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            });

            queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
        }
    });

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
        if(!data || isDisabled) return;

        // setIsDisabled(true);

        const clientGeneratedId = `optimistic-${Date.now()}`;
        mutate({conversationId, data, clientGeneratedId});
        setIsDisabled(false);
        setValue('message', '', { shouldValidate : true});
        setFocus("message");
        if(socket) socket.emit('join:room', conversationId);
    };

    const handleUpload = async (result: any) => {
        if(!result?.info?.secure_url) return;

        const clientGeneratedId = `optimistic-${Date.now()}`;
        mutate({conversationId, image: result?.info?.secure_url, clientGeneratedId});
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
            if (isDisabled) return;
            // trigger(); // execute react-hook-form submit programmatically 
            
            const value = getValues('message'); // get user input value
            if (value.trim().length === 0) return; // 빈 메시지 방지

            setIsDisabled(true);
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
