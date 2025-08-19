'use client';
import { getTotalUnreadCount } from "@/src/app/lib/getUnReadCount";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { useEffect, useRef } from "react";
import { useSocket } from "../context/socketContext";
import useConversation from "../hooks/useConversation";
import useConversationUserList from "../hooks/useConversationUserList";

const SocketState = () => {
    const socket = useSocket();
    const { conversationId } = useConversation();
    const { set } = useConversationUserList();
    const { incrementUnread, setUnreadCount } = useUnreadStore();
    const queryClient = useQueryClient();

    // 공통 유틸: 대화 리스트로부터 전역 미읽음 합계 계산 후 저장
    const computeTotalUnread = (list: any) => {
        const total = list?.conversations?.reduce((sum: number, c: any) => sum + (Number(c.unReadCount) || 0), 0) ?? 0;
        return Number.isFinite(total) ? total : 0;
    };

    const updateUnreadFromCache = () => {
        const list = queryClient.getQueryData(['conversationList']) as any;
        if (!list?.conversations) return;
        setUnreadCount(computeTotalUnread(list));
    };

    const { 
        data, 
        refetch,
    } = useQuery({
        queryKey: ['unReadCount', conversationId],
        queryFn: () => getTotalUnreadCount(conversationId), // ✅ 현재 대화방을 제외한 전체 unReadCount
        staleTime: 30000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: false, // 수동으로만 호출
    });

    // 초기 1회: 캐시 우선 → 없으면 서버에서 하이드레이션
    const hydratedOnceRef = useRef(false);
    useEffect(() => {
        if (hydratedOnceRef.current) return;
        hydratedOnceRef.current = true;
        const list = queryClient.getQueryData(['conversationList']) as any;
        if (list?.conversations?.length) {
            setUnreadCount(computeTotalUnread(list));
            return;
        }
        refetch();
    }, [queryClient, setUnreadCount, refetch]);

    // 쿼리 성공 시 전역 뱃지 업데이트
    useEffect(() => {
        if (typeof data?.unReadCount === 'number') {
            setUnreadCount(data.unReadCount);
        }
    }, [data?.unReadCount, setUnreadCount]);

    // 중복 이벤트 방지용: 최근 처리한 메시지 ID 캐시
    const processedMessageIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if(!socket) return;

        const handleReceiveConversation = (message: any, targetEmail: string) => {
            const messageConversationId = message?.conversationId;
            const isMyMessage = message.sender.email === targetEmail;
            // 현재 방이면 리스트/배지 갱신 불필요
            if (isMyMessage || messageConversationId === conversationId) return;

            // 동일 메시지 ID에 대한 중복 처리 방지 (서버/네트워크 중복 이벤트 대비)
            const mid = message?.id as string | undefined;
            if (mid) {
                if (processedMessageIdsRef.current.has(mid)) return;
                processedMessageIdsRef.current.add(mid);
                // 메모리 누수 방지: 일정 시간 후 자동 제거
                setTimeout(() => processedMessageIdsRef.current.delete(mid), 5 * 60 * 1000);
            }

            // SocketState.tsx - handleReceiveConversation 내부 갱신 로직 (upsert 최소 필드만)
            const next = queryClient.setQueryData(['conversationList'], (old: any) => {
                const lastAt = new Date(message.createdAt);
              
                if (!old?.conversations) {
                  return {
                    conversations: [
                      { id: messageConversationId, lastMessageAt: lastAt, unReadCount: 1, messages: [message] },
                    ],
                  };
                }
              
                const idx = old.conversations.findIndex((c: any) => c.id === messageConversationId);
              
                const conversations = 
                    idx === -1
                    ? [
                        { id: messageConversationId, lastMessageAt: lastAt, unReadCount: 1, messages: [message] },
                        ...old.conversations,
                      ]
                    : old.conversations.map((c: any) =>
                        c.id === messageConversationId
                          ? {
                              ...c,
                              lastMessageAt: lastAt,
                              unReadCount: (c.unReadCount || 0) + 1,
                              messages: [message, ...(c.messages || [])].slice(0, 15), 
                            }
                          : c
                      );
              
                conversations.sort(
                  (a: any, b: any) =>
                    new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
                );
              
                return { conversations };
            }) as any;

            // 최신 전역 뱃지 즉시 반영 (로컬 합계)
            if (next) setUnreadCount(computeTotalUnread(next));
        };

        // 다른 클라이언트의 읽음 처리 브로드캐스트에 맞춰 전역 합계 재계산
        const handleReadMessage = () => {
            updateUnreadFromCache();
        };

        const handleExit = (data: { conversationId: string; userIds: string[] }) => {
            const { conversationId, userIds } = data;
            set({ conversationId, userIds });
            
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId], exact: true });
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId], exact: true });
            queryClient.invalidateQueries({ queryKey: ['conversationList'], exact: true });

            // invalidate 직후, 캐시가 있다면 즉시 전역 unReadCount를 재계산하여 깜빡임/복원 방지
            updateUnreadFromCache();
        };
      
        socket.on("receive:conversation", handleReceiveConversation);
        socket.on("exit:user", handleExit);
        socket.on("read:message", handleReadMessage);
        return() => {
            socket.off("receive:conversation", handleReceiveConversation);
            socket.off("exit:user", handleExit);
            socket.off("read:message", handleReadMessage);
        }
    }, [socket, conversationId, queryClient, set]);

    return null;
}

export default SocketState;