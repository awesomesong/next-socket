import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface UseCreateAIConversationOptions {
    onSettled?: () => void;
}

export const useCreateAIConversation = (options?: UseCreateAIConversationOptions) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    // 공유 upsert 유틸: 대화 하나를 conversationList 캐시에 낙관적으로 반영
    const upsertConversation = (payload: any) => {
        if (!payload) return;
        queryClient.setQueryData(['conversationList'], (old: any) => {
            const lastMessageAt = payload?.lastMessageAt ? new Date(payload.lastMessageAt) : new Date();
            const normalized = {
                id: payload.id,
                lastMessageAt,
                isAIChat: payload.isAIChat ?? true,
                aiAgentType: payload.aiAgentType ?? 'assistant',
                userIds: payload.userIds ?? [session?.user?.id],
                users: payload.users ?? [],
                messages: Array.isArray(payload.messages) ? payload.messages : [],
                unReadCount: 0,
                name: payload.name ?? '',
            };
            if (!old?.conversations) return { conversations: [normalized] };
            const exists = old.conversations.some((c: any) => c.id === payload.id);
            const conversations = exists
                ? old.conversations.map((c: any) => (c.id === payload.id ? { ...c, ...normalized } : c))
                : [normalized, ...old.conversations];
            conversations.sort(
                (a: any, b: any) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
            );
            return { conversations };
        });
    };

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
            // 인플라이트를 취소하지 않고 낙관적 갱신 → 이후 서버 데이터로 전체 목록 동기화
            upsertConversation(data);

            // AI 채팅방으로 이동
            router.push(`/conversations/${data.id}`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'AI 채팅방 생성 중 오류가 발생했습니다.');
        },
        onSettled: async (data) => {
            // 재-upsert로 레이스 방지
            if (data) upsertConversation(data);
            // 최종적으로 서버 원본으로 전체 목록 동기화 (기존 대화방 포함)
            await queryClient.invalidateQueries({ queryKey: ['conversationList'], exact: true });
            options?.onSettled?.();
        },
    });
}; 