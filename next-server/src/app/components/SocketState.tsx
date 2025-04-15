'use client';
import getUnReadCount from "@/src/app/lib/getUnReadCount";
import { useQuery } from "@tanstack/react-query";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { useEffect } from "react";
import { useSocket } from "../context/socketContext";
import useConversation from "../hooks/useConversation";

const SocketState = () => {
    const socket = useSocket();
    const { setUnreadCount } = useUnreadStore();
    const { conversationId } = useConversation();

    const { 
        data, 
        refetch
    } = useQuery({
        queryKey: ['unReadCount'],
        queryFn: getUnReadCount,
        staleTime: 0,
        gcTime: 0,
    });

    useEffect(() => {
        if (data?.unReadCount !== undefined) {
            setUnreadCount(data.unReadCount);
        }
    }, [data, setUnreadCount]);

    useEffect(() => {
        if(!socket) return;

        const handleReconnect = () => {
            refetch();
        };

        const handleReceiveConversation = (message: any, isMyMessage: boolean) => {
            const messageConversationId = message?.conversationId;

            // ✅ 내가 보낸 메시지가 아니고, 현재 보고 있는 채팅방이 아니면 refetch
            if (!isMyMessage && messageConversationId !== conversationId) {
                refetch();
            }
        };
      
        socket.on('connect', handleReconnect);
        socket.on("receive:conversation", handleReceiveConversation);
        

        return() => {
            socket.off('connect', handleReconnect);
            socket.off("receive:conversation", handleReceiveConversation);
        }
    }, [socket, refetch]);

    return null;
}

export default SocketState;