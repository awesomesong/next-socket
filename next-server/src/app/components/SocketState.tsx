'use client';
import { useSession } from "next-auth/react";
import getUnReadCount from "@/src/app/lib/getUnReadCount";
import { useQuery } from "@tanstack/react-query";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { useCallback, useEffect } from "react";
import { useSocket } from "../context/socketContext";
import { useQueryClient } from "@tanstack/react-query";
import useConversationUserList from "@/src/app/hooks/useConversationUserList";

const SocketState = () => {
    const socket = useSocket();
    const { set, conversationUsers, remove } = useConversationUserList();
    const { data: session } = useSession();
    const { setUnreadCount, unreadCount } = useUnreadStore();
    const queryClient = useQueryClient();

    const { 
        data, 
        status,
        refetch
    } = useQuery({
        queryKey: ['unReadCount'],
        queryFn: getUnReadCount,
        staleTime: 0,
        gcTime: 0,
    });

    useEffect(() => {
        setUnreadCount(data?.unReadCount);
    }, [data, setUnreadCount]);

    const handleReceive = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['unReadCount'] });
    }, [queryClient]);

    useEffect(() => {
        if(!socket) return;

        const handleReconnect = () => {
            refetch(); // 메시지 다시 불러오기 ✅
        };
      
        socket.on('connect', handleReconnect);
        
        socket.on("receive:conversation", handleReceive);

        return() => {
            socket.off('connect', handleReconnect);
            socket.off("receive:conversation");
        }
    }, [socket, set, queryClient]);

    return null;
}

export default SocketState;