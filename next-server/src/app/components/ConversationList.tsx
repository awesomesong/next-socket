'use client';
import { useSession } from "next-auth/react";
import { ConversationProps, FullConversationType, FullMessageType } from "@/src/app/types/conversation";
import { useEffect, useState, useMemo } from 'react';
import ConversationBox from "./ConversationBox";
import getConversations from "@/src/app/lib/getConversations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";
import ChatConversationSkeleton from "./skeleton/ChatConversationSkeleton";
import clsx from "clsx";
import useConversation from "@/src/app/hooks/useConversation";
import GroupChatModal from "./chat/GroupChatModal";
import { useSocket } from "../context/socketContext";
import { IoBeerOutline } from "react-icons/io5";
import { useCallback } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { useTheme } from 'next-themes';
import { PiDotsThreeVerticalBold } from "react-icons/pi";
import { useCreateAIConversation } from '@/src/app/lib/createAIConversation';
import useUnreadStore from '@/src/app/hooks/useUnReadStore';

const ConversationList = () => {
    const socket = useSocket();
    const { data: session } = useSession();
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const { isOpen, conversationId } = useConversation();
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    const { setUnreadCount } = useUnreadStore();

    // ✅ 안정적인 정렬: 최근 메시지 시간 내림차순, 동시간대는 마지막 메시지 id → 대화방 id로 보조 정렬
    const compareConversationsDesc = useCallback((a: FullConversationType, b: FullConversationType) => {
        const aTime = new Date(a.lastMessageAt || a.messages?.[0]?.createdAt || 0).getTime();
        const bTime = new Date(b.lastMessageAt || b.messages?.[0]?.createdAt || 0).getTime();
        if (aTime !== bTime) return bTime - aTime;

        const aMsgId = a.messages?.[0]?.id ? String(a.messages[0].id) : '';
        const bMsgId = b.messages?.[0]?.id ? String(b.messages[0].id) : '';
        if (aMsgId && bMsgId && aMsgId !== bMsgId) return bMsgId.localeCompare(aMsgId);

        return String(b.id).localeCompare(String(a.id));
    }, []);

    // AI 채팅방 생성 mutation
    const aiConversationMutation = useCreateAIConversation();

    // 다크모드 토글 함수
    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setTheme]);

    // AI 채팅방 생성 함수
    const createAIChat = useCallback((aiAgentType: string) => {
        aiConversationMutation.mutate({ aiAgentType });
    }, [aiConversationMutation]);

    const { data: conversations = [], status } = useQuery<
        { conversations: FullConversationType[] },
        Error,
        FullConversationType[]
    >({
        queryKey: [ 'conversationList' ],
        queryFn: getConversations,
        select: (d) => d.conversations,
        staleTime: 1000 * 60 * 5, 
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        placeholderData: (prev) => prev,
    });

    useEffect(() => {
        if(!socket) return;

        const handleNewConversation = (conversation: FullConversationType) => {
            queryClient.setQueryData(['conversationList'], (oldData: ConversationProps | undefined) => {
                const prev = oldData?.conversations ?? [];
                // 중복 방지: 같은 id가 이미 있으면 교체/병합, 없으면 추가
                const existsIdx = prev.findIndex((c: any) => c.id === conversation.id);
                const next = existsIdx !== -1
                    ? prev.map((c: any, i: number) => i === existsIdx ? { ...c, ...conversation } : c)
                    : [conversation, ...prev];

                // ✅ 안정적인 정렬
                const reorderedConversations = [...next].sort(compareConversationsDesc);
                return { conversations: reorderedConversations };
            });
        };
      
        socket.on("conversation:new", handleNewConversation);

        return () => {
            socket.off("conversation:new", handleNewConversation);
        };
    }, [ socket, queryClient, conversationId, setUnreadCount ]);

    const memoizedConversations = useMemo(() => {
        if (!conversations || conversations.length === 0) {
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
            );
        }
        const ordered = [...conversations].sort(compareConversationsDesc);
        return ordered.map((conversation: FullConversationType) => (
            <ConversationBox
                key={conversation.id}
                data={conversation}
                selected={conversationId === conversation.id}
                currentUser={session?.user}
            />
        ));
    }, [conversations, conversationId, session, compareConversationsDesc]);

    return (
        <>
            <GroupChatModal
                isOpen={isModalOpen}
                onCloseModal={() => setIsModalOpen(false)}
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
                        inline-flex 
                        items-end 
                        gap-2
                        leading-none
                        text-2xl
                        font-bold
                    ">
                        <IoBeerOutline size={26} />
                        대화방
                    </div>
                    { status === 'success'  
                        ? <Dropdown>
                            <DropdownTrigger>
                                <Button 
                                    type='button'
                                    variant='shadow'
                                    radius='sm'
                                    className='
                                        min-w-6 
                                        h-6 
                                        p-0 
                                        bg-gray-100 
                                        dark:bg-neutral-800 
                                        dark:border-neutral-600

                                '>
                                    <PiDotsThreeVerticalBold size={21} />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem 
                                    key="group-chat"
                                    onPress={() => setIsModalOpen(true)}
                                >
                                    단체 채팅
                                </DropdownItem>
                                <DropdownItem 
                                    key="ai-chat"
                                    onPress={() => createAIChat("assistant")}
                                >
                                    AI 채팅
                                </DropdownItem>
                                <DropdownItem 
                                    key="theme-toggle"
                                    onPress={toggleTheme}
                                >
                                    {theme === 'dark' ? '라이트 모드' : '다크 모드'}
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
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
