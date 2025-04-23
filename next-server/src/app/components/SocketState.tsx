'use client';
import getUnReadCount from "@/src/app/lib/getUnReadCount";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { useEffect } from "react";
import { useSocket } from "../context/socketContext";
import useConversation from "../hooks/useConversation";
import useConversationUserList from "../hooks/useConversationUserList";

const SocketState = () => {
    const socket = useSocket();
    const { setUnreadCount } = useUnreadStore();
    const { conversationId } = useConversation();
    const { set } = useConversationUserList();
    const queryClient = useQueryClient();

    const { 
        data, 
        refetch
    } = useQuery({
        queryKey: ['unReadCount', conversationId],
        queryFn: () => getUnReadCount(conversationId),
        staleTime: 0,
        gcTime: 0,
    });

    useEffect(() => {
        if (typeof data?.unReadCount === 'number') {
            setUnreadCount(data.unReadCount);
        }
    }, [data, setUnreadCount]);

    useEffect(() => {
        if(!socket) return;

        const handleReconnect = () => {
            refetch();
        };

        const handleReceiveConversation = (message: any, targetEmail: string) => {
            const messageConversationId = message?.conversationId;
            const isMyMessage = message.sender.email === targetEmail;

            const isSeenByMe = Array.isArray(message.seen)
                ? message.seen.some((user: any) => user.email === targetEmail)
                : false;

            // 내가 보낸 것도 아니고, 내가 본 메시지도 아니고, 현재 보고 있는 대화방도 아니면 refetch
            if (!isMyMessage && !isSeenByMe && messageConversationId !== conversationId) {
                refetch();
            }
        };

        const handleExit = (data: { conversationId: string; userIds: string[] }) => {
            const { conversationId, userIds } = data;
            set({ conversationId, userIds });
            queryClient.invalidateQueries({ queryKey: ['conversationList'] });
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
        };

        const handleSeenUser = (payload: { conversationId: string }) => {
            if (payload.conversationId !== conversationId) {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['conversationList'] });
            }
        };
      
        socket.on('connect', handleReconnect);
        socket.on("receive:conversation", handleReceiveConversation);
        socket.on("exit:user", handleExit);
        socket.on("seen:user", handleSeenUser);
        return() => {
            socket.off('connect', handleReconnect);
            socket.off("receive:conversation", handleReceiveConversation);
            socket.off("exit:user", handleExit);
            socket.off("seen:user", handleSeenUser);
        }
    }, [socket, refetch, conversationId, queryClient, set]);

    return null;
}

export default SocketState;