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

    const { 
        data
    } = useQuery({
        queryKey: ['unReadCount', conversationId],
        queryFn: () => getTotalUnreadCount(conversationId), // ✅ 현재 대화방을 제외한 전체 unReadCount
        staleTime: 30000, // 30초 동안 캐시 유지 (불필요한 API 호출 방지)
        gcTime: 300000, // 5분 동안 가비지 컬렉션 지연
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    // 초기 1회 하이드레이션만 허용 (라우트 변경마다 서버값으로 덮어쓰는 레이스 방지)
    const hydratedOnceRef = useRef(false);
    useEffect(() => {
        if (hydratedOnceRef.current) return;
        if (typeof data?.unReadCount === 'number') {
            setUnreadCount(data.unReadCount);
            hydratedOnceRef.current = true;
        }
    }, [data?.unReadCount, setUnreadCount]);

    useEffect(() => {
        if(!socket) return;

        const handleReceiveConversation = (message: any, targetEmail: string) => {
            const messageConversationId = message?.conversationId;
            const isMyMessage = message.sender.email === targetEmail;
            const isSeenByMe = Array.isArray(message.seen)
                ? message.seen.some((user: any) => user.email === targetEmail)
                : false;
            if (isMyMessage || isSeenByMe || messageConversationId === conversationId) return;

            // 내가 보낸 것도 아니고, 내가 본 메시지도 아니고, 현재 보고 있는 대화방도 아니면 업데이트
            // 전역 뱃지 증가
            incrementUnread();

            // SocketState.tsx - handleReceiveConversation 내부 갱신 로직 (upsert 최소 필드만)
            queryClient.setQueryData(['conversationList'], (old: any) => {
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
            });
        };

        const handleExit = (data: { conversationId: string; userIds: string[] }) => {
            const { conversationId, userIds } = data;
            set({ conversationId, userIds });
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId], exact: true });
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId], exact: true });
        };
      
        socket.on("receive:conversation", handleReceiveConversation);
        socket.on("exit:user", handleExit);
        return() => {
            socket.off("receive:conversation", handleReceiveConversation);
            socket.off("exit:user", handleExit);
        }
    }, [socket, conversationId, queryClient, set]);

    return null;
}

export default SocketState;