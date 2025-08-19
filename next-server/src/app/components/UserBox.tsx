'use client';
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";
import Avatar from "./Avatar";
import { IUserList } from "@/src/app/types/common";
import { useSocket } from "../context/socketContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createChatConversation } from "@/src/app/lib/createChatConversation";

interface UserBoxProps {
    userInfo: IUserList;
}

const UserBox:React.FC<UserBoxProps> =  ({userInfo}) => {
    const socket = useSocket();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const { 
        mutate, 
        data 
    }  = useMutation({
        mutationFn: createChatConversation,
        onSuccess: (data) => {
            router.push(`/conversations/${data.id}`);
            router.refresh();
            // ✅ 리스트 캐시 즉시 동기화 (소켓 수신 전에도 UI 반영)
            queryClient.setQueryData(['conversationList'], (old: any) => {
                const normalize = (c: any) => ({
                    id: c.id,
                    userIds: c.userIds ?? [],
                    users: c.users ?? [],
                    isGroup: c.isGroup ?? false,
                    isAIChat: c.isAIChat ?? false,
                    aiAgentType: c.aiAgentType ?? null,
                    name: c.name ?? null,
                    lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(),
                    messages: [],
                    unReadCount: 0,
                });

                if (!old?.conversations) return { conversations: [normalize(data)] };
                const existsIdx = old.conversations.findIndex((c: any) => c.id === data.id);
                if (existsIdx !== -1) {
                    const merged = { ...old.conversations[existsIdx], ...normalize(data) };
                    const copy = old.conversations.slice();
                    copy[existsIdx] = merged;
                    return { conversations: copy };
                }
                return { conversations: [normalize(data), ...old.conversations] };
            });
            if(socket && !data.existingConversation) socket.emit("conversation:new", data);
        },
        onError: () => {
            toast.error('대화방을 생성하는 중 오류가 발생했습니다.');
        },
        onSettled: () => {
            setIsLoading(false);
        }
    });

    const handleClick = useCallback(async () => {
        setIsLoading(true);
        mutate({ userId: userInfo.id! });
    }, [userInfo.id, mutate]);

    const memoizedUserInfo = useMemo(() => userInfo, [userInfo]);

    return (
        <div 
            onClick={() => !isLoading && handleClick()}
            className="
                flex
                items-center
                space-x-3
                w-full
                relative
                p-3
                transition
                cursor-pointer
                hover:bg-neutral-100
                hover:dark:bg-neutral-800
                disabled
            "
        >
            <Avatar user={memoizedUserInfo} />
            <div 
                className="
                    flex
                    justify-between
                    items-center
                "
            >
                <p 
                    className="
                        text-sm
                        font-medium
                    "
                >
                    {memoizedUserInfo.name}
                </p>
            </div>
        </div>
    )
}

export default memo(UserBox);
