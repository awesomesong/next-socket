"use client";
import { useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';
import TextareaAutosize from 'react-textarea-autosize';
import { useCallback, startTransition, useLayoutEffect } from 'react';
import { useSocket } from '@/src/app/context/socketContext';
import { useQueryClient } from '@tanstack/react-query';
import { createConversationWithFirstMessage } from '@/src/app/lib/createConversationWithFirstMessage';
import { SOCKET_EVENTS } from '@/src/app/lib/react-query/utils';
import { conversationKey, messagesKey, normalizeMessage, upsertConversationWithFirstMessage } from '@/src/app/lib/react-query/chatCache';
import type { FullConversationType, ConversationMessagePreview } from '@/src/app/types/conversation';
import toast from 'react-hot-toast';
import { validateUserMessage } from '@/src/app/utils/aiPolicy';
import { validatePrompt as validateAIPrompt } from '@/src/app/utils/aiPolicy';
import useComposition from '@/src/app/hooks/useComposition';
import { useFocusInput } from '@/src/app/hooks/useFocusInput';
import ChatSubmitButton from './ChatSubmitButton';
import ImageUploadButton from '@/src/app/components/ImageUploadButton';
import { CloudinaryUploadWidgetResults } from 'next-cloudinary';

type Form = { message: string };

interface DraftFormProps {
    targetUserId?: string;
    isGroup?: boolean;
    memberIds?: string[];
    groupName?: string;
    aiAgentType?: string;
    isSending: boolean;
    setIsSending: (value: boolean) => void;
}

const DraftForm: React.FC<DraftFormProps> = ({
    targetUserId,
    isGroup,
    memberIds,
    groupName,
    aiAgentType,
    isSending,
    setIsSending,
}) => {
    const router = useRouter();
    const socket = useSocket();
    const queryClient = useQueryClient();
    const isAI = !!aiAgentType;

    const { register, handleSubmit, setValue, getValues } = useForm<Form>({
        defaultValues: { message: '' },
    });

    const { focusAndHold, cancelFocus } = useFocusInput('message');

    useLayoutEffect(() => {
        focusAndHold(1500);
        return () => cancelFocus();
    }, [focusAndHold, cancelFocus]);

    const sendFirstMessage = useCallback(async (messageText?: string, imageUrl?: string) => {
        if (isSending) return;
        setIsSending(true);

        const messageId = crypto.randomUUID();

        try {
            // 대화방 생성 + 첫 메시지 저장을 1번의 요청으로 처리
            const { conversation: conv, newMessage } = await createConversationWithFirstMessage({
                userId: !isAI && !isGroup ? targetUserId : undefined,
                isGroup: isGroup && memberIds?.length ? true : undefined,
                members: isGroup ? memberIds : undefined,
                groupName: isGroup ? groupName : undefined,
                aiAgentType: isAI ? aiAgentType : undefined,
                message: messageText,
                image: imageUrl,
                messageId,
            });

            if (!conv?.id) throw new Error('대화방 생성 실패');

            // 캐시 미리 채워서 전환 시 스피너 없애기
            const convForCache = {
                id: conv.id,
                name: conv.name ?? null,
                isGroup: conv.isGroup ?? false,
                isAIChat: conv.isAIChat ?? false,
                aiAgentType: conv.aiAgentType ?? null,
                userIds: conv.userIds ?? [],
                users: conv.users ?? [],
                lastMessageAt: conv.lastMessageAt ?? undefined,
            };
            queryClient.setQueryData(conversationKey(conv.id), { conversation: convForCache });
            queryClient.setQueryData(messagesKey(conv.id), {
                pages: [{
                    messages: [normalizeMessage(newMessage)],
                    nextCursor: null,
                    seenUsersForLastMessage: [],
                }],
                pageParams: [null],
            });

            // conversationList 캐시에 한 번만 반영 (리렌더 1회)
            upsertConversationWithFirstMessage(queryClient, convForCache as Partial<FullConversationType> & { id: string }, newMessage as unknown as ConversationMessagePreview);

            // 먼저 화면 전환해 체감 속도 개선
            startTransition(() => {
                router.replace(`/conversations/${conv.id}`);
            });

            // 소켓/스토리지는 전환 후 비동기로 처리해 페인트 블로킹 최소화
            if (typeof window !== 'undefined') {
                const doDeferred = () => {
                    if (isAI && messageText) {
                        sessionStorage.setItem('scent:pendingAI', JSON.stringify({
                            conversationId: conv.id,
                            userMessage: messageText,
                            userMessageId: messageId,
                        }));
                    }
                    if (socket) {
                        if (!conv.existingConversation) {
                            socket.emit(SOCKET_EVENTS.CONVERSATION_NEW, { ...conv, firstMessage: newMessage });
                        }
                        socket.emit('send:message', { newMessage });
                    }
                    sessionStorage.setItem('scent:focusMessage', '1');
                };
                setTimeout(doDeferred, 0);
            }
        } catch {
            toast.error('메시지 전송에 실패했습니다.');
            setIsSending(false);
        }
    }, [isSending, aiAgentType, isAI, isGroup, memberIds, groupName, targetUserId, queryClient, socket, router, setIsSending]);

    const onSubmit = useCallback<SubmitHandler<Form>>(async ({ message }) => {
        // AI 채팅은 AI 프롬프트 검증, 일반 채팅은 일반 검증
        const check = isAI
            ? validateAIPrompt(String(message || ''))
            : validateUserMessage(String(message || ''));
        if (!check.isValid) {
            toast.error(check.error || '입력값을 확인해주세요.');
            return;
        }
        setValue('message', '', { shouldValidate: true });
        await sendFirstMessage(message);
    }, [isAI, setValue, sendFirstMessage]);

    const handleUpload = async (result: CloudinaryUploadWidgetResults) => {
        if (typeof result.info === 'string' || !result.info || !('secure_url' in result.info)) return;
        await sendFirstMessage(undefined, result.info.secure_url);
    };

    const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposition();

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isComposing()) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (getValues('message').trim().length === 0) return;
            handleSubmit(onSubmit)();
        }
    };

    const submit = useCallback(() => handleSubmit(onSubmit)(), [handleSubmit, onSubmit]);

    return (
        <div className="flex items-start gap-2 w-full px-4 py-2 border-t-default">
            {/* AI 채팅은 이미지 업로드 미지원 */}
            {!isAI && <ImageUploadButton onUploadSuccess={handleUpload} variant="compact" />}
            <form onSubmit={submit} className="flex items-center gap-2 w-full">
                <TextareaAutosize
                    id="message"
                    minRows={2}
                    maxRows={4}
                    {...register('message', { required: true })}
                    placeholder={isAI
                        ? '향수 AI 어시스턴트에게 궁금한 점을 물어보세요.'
                        : '메시지를 작성해주세요.'
                    }
                    onKeyDown={handleKeyPress}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    disabled={isSending}
                    className="w-full bg-default border-default rounded-lg p-2 font-light resize-none focus:outline-none"
                />
                <ChatSubmitButton type="button" onClick={submit} disabled={isSending} />
            </form>
        </div>
    );
};

export default DraftForm;
