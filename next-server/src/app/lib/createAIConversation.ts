import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface UseCreateAIConversationOptions {
    onSettled?: () => void;
}

export const useCreateAIConversation = (options?: UseCreateAIConversationOptions) => {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ aiAgentType }: { aiAgentType: string }) => {
            const response = await fetch('/api/conversations/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ aiAgentType }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'AI 채팅방 생성 중 오류가 발생했습니다.');
            }

            return response.json();
        },
        onSuccess: (data) => {
            // 대화방 목록 업데이트 (기존 대화방이든 새로 생성된 대화방이든)
            queryClient.invalidateQueries({ queryKey: ['conversationList'] });
            
            // AI 채팅방으로 이동
            router.push(`/conversations/${data.id}`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'AI 채팅방 생성 중 오류가 발생했습니다.');
        },
        onSettled: options?.onSettled,
    });
}; 