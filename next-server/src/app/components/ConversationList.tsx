'use client';
import { useSession } from "next-auth/react";
import { ConversationProps, FullConversationType, FullMessageType } from "@/src/app/types/conversation";
import { memo, useEffect, useState, useMemo } from 'react';
import { MdOutlineGroupAdd } from 'react-icons/md'
import ConversationBox from "./ConversationBox";
import getConversations from "@/src/app/lib/getConversations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";
import ChatConversationSkeleton from "./skeleton/ChatConversationSkeleton";
import clsx from "clsx";
import useConversation from "@/src/app/hooks/useConversation";
import GroupChatModal from "./chat/GroupChatModal";
import { useSocket } from "../context/socketContext";
import SocketState from "./SocketState";

const ConversationList = () => {
    const socket = useSocket();
    const { data: session } = useSession();
    const [ isModalOpen, setIsModaOpen ] = useState(false);
    const { isOpen, conversationId } = useConversation();
    const queryClient = useQueryClient();

    const { 
        data, 
        status,
        isSuccess,
        refetch
    } = useQuery({
        queryKey: [ 'conversationList' ],
        queryFn: getConversations,
        staleTime: 0, 
        gcTime: 0,
    });

    useEffect(() => {
        if(!socket) return;

        const handleReconnect = () => {
            refetch(); // 메시지 다시 불러오기 ✅
        };
      
        socket.on('connect', handleReconnect);

        socket.on("conversation:new", (conversation: FullConversationType) => {
            queryClient.setQueriesData({ queryKey: ['conversationList']}, (oldData: ConversationProps) => {
                return { conversations: [ conversation, ...oldData.conversations ] };
            });

            queryClient.invalidateQueries({queryKey: ['conversationList']});
        });

        socket.on("receive:conversation", (message: FullMessageType) => {
            queryClient.setQueriesData({ queryKey: ['conversationList'] }, (oldData: ConversationProps) => {
                if (!oldData) return { conversations: [] }; // 예외 처리
        
                // 메시지가 포함된 대화 업데이트
                const updatedConversations = oldData.conversations.map(conversation => {
                    if (conversation.id !== message.conversationId) return conversation;

                    const existingMessages = conversation.messages ?? [];
                    return {
                        ...conversation,
                        messages: [message, ...existingMessages], 
                        unreadCount: (conversation.unreadCount ?? 0) + 1,
                    };
                });
        
                // 대화를 정렬하여 최신 메시지가 포함된 대화를 맨 위로 이동
                const reorderedConversations = [...updatedConversations] // 원본을 복사한 후
                    .sort((a, b) => (a.id === message.conversationId ? -1 : b.id === message.conversationId ? 1 : 0));
        
                return { conversations: reorderedConversations };
            });
        });        


        return () => {
            socket.off('connect', handleReconnect);
            socket.off("conversation:new");
            socket.off("receive:conversation");
        };
    }, [ socket ]);

    const memoizedConversations = useMemo(() => {
        if (status !== 'success') return null;
        if (data.conversations && data.conversations.length === 0) {
            return (
                <div className="
                    flex
                    justify-center
                    h-full
                    text-neutral-500
                    dark:text-neutral-400
                    text-sm
                ">
                    대화방이 없습니다.
                </div>
            )
        }
        return data.conversations.map((conversation: FullConversationType) => (
            <ConversationBox
                key={conversation.id}
                data={conversation}
                selected={conversationId === conversation.id}
                currentUser={session?.user}
            />
        ));
    }, [data, conversationId, session, status]);

    return (
        <>
            <SocketState/>
            <GroupChatModal
                isOpen={isModalOpen}
                onCloseModal={() => setIsModaOpen(false)}
            />
            <aside className={clsx(`
                    shrink-0
                    overflow-y-auto
                    h-full
                    border-r-default
                    max-lg:flex-1
                    w-0
                    lg:w-80
                `,
                isOpen && 'hidden lg:block'
            )}>
                <div className="flex 
                                justify-between
                                items-center
                                h-16
                                px-3
                    ">
                    <div className="
                        text-2xl
                        font-bold
                    ">
                        대화방
                    </div>
                    { status === 'success'  
                        ? <div 
                            onClick={() => setIsModaOpen(true)}
                            className="
                                flex
                                justify-start
                                items-start
                                w-[40px]
                                h-[40px]
                                p-2
                                rounded-full
                                bg-neutral-200
                                dark:bg-neutral-700
                                hover:opacity-75
                                cursor-pointer
                                transition
                            "
                        >   
                            <MdOutlineGroupAdd size={24} />
                        </div>
                        :   
                        (<div className="
                                overflow-hidden
                                inline-block
                                relative
                                rounded-full
                                w-[40px]
                                h-[40px]
                            ">
                            <ShapesSkeleton width="100%" height="100%" radius="lg" />
                        </div>)
                    }
                </div>
                <div className="flex flex-col">
                    {status === 'success' ? 
                        memoizedConversations
                        : <ChatConversationSkeleton />
                    }
                    </div>
            </aside>
        </>
    )
}

export default ConversationList;
