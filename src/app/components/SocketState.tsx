'use client';
import { useSession } from "next-auth/react";
import getUnReadCount from "@/src/app/lib/getUnReadCount";
import { useQuery } from "@tanstack/react-query";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { useEffect } from "react";
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
    } = useQuery({
        queryKey: ['unReadCount'],
        queryFn: getUnReadCount,
        enabled: !!session?.user?.email,
        staleTime: 0,
        gcTime: 0,
    });

    useEffect(() => {
        setUnreadCount(data?.unReadCount);
    }, [data, setUnreadCount]);

    useEffect(() => {
        if(!socket) return;

        socket.on("receive:conversation", () => {
            queryClient.invalidateQueries({queryKey: ['unReadCount']});
        });
        
        socket.on("read:message", () => {
            queryClient.invalidateQueries({queryKey: ['unReadCount']});
            queryClient.invalidateQueries({queryKey: ['conversationList']});
        });

        socket.on("exit:user", (data) => {
            const { conversationId, userId } = data;
            set({ conversationId, userIds: userId });
            queryClient.invalidateQueries({queryKey: ['unReadCount']});
            queryClient.invalidateQueries({queryKey: ['conversationList']});
            queryClient.invalidateQueries({queryKey: ['messages', conversationId]});
            queryClient.invalidateQueries({queryKey: ['conversation', conversationId]});
        });
    
        return() => {
          socket.off("receive:conversation");
          socket.off("read:message");
          socket.off("exit:user");
        }
    }, [socket]);

    return null;
}

export default SocketState;