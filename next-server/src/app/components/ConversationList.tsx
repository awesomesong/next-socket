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
import SocketState from "./SocketState";
import { IoBeerOutline } from "react-icons/io5";
import { useCallback } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { useTheme } from 'next-themes';
import { PiDotsThreeVerticalBold } from "react-icons/pi";
import { useCreateAIConversation } from '@/src/app/lib/createAIConversation';
import { getTotalUnreadCount } from '@/src/app/lib/getUnReadCount';
import useUnreadStore from '@/src/app/hooks/useUnReadStore';

const ConversationList = () => {
    const socket = useSocket();
    const { data: session } = useSession();
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const { isOpen, conversationId } = useConversation();
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    const { setUnreadCount } = useUnreadStore();

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

    // ✅ 전체 unReadCount 실시간 업데이트
    useEffect(() => {
        const updateTotalUnreadCount = async () => {
            try {
                const { unReadCount } = await getTotalUnreadCount(conversationId);
                setUnreadCount(unReadCount);
            } catch (error) {
                console.error('Failed to update total unread count:', error);
            }
        };

        // ✅ 초기 로드 시에만 호출 (불필요한 호출 방지)
        if (data?.conversations && status === 'success') {
            updateTotalUnreadCount();
        }
    }, [status, conversationId, setUnreadCount]); // data?.conversations 제거

    useEffect(() => {
        if(!socket) return;

        const handleReconnect = () => {
            refetch(); // 메시지 다시 불러오기 ✅
        };

        const handleNewConversation = (conversation: FullConversationType) => {
            queryClient.setQueryData(['conversationList'], (oldData: ConversationProps | undefined) => {
                const updatedConversations = [conversation, ...(oldData?.conversations ?? [])];
                
                // ✅ lastMessageAt 기준으로 정렬 (최신 메시지가 있는 대화를 맨 위로)
                const reorderedConversations = [...updatedConversations]
                    .sort((a, b) => {
                        const aTime = new Date(a.lastMessageAt || 0).getTime();
                        const bTime = new Date(b.lastMessageAt || 0).getTime();
                        return bTime - aTime; // 내림차순 (최신이 위)
                    });
                
                return { conversations: reorderedConversations };
            });
        };

        const handleReceiveConversation = async (message: FullMessageType, targetEmail: string) => {
            const isMyMessage = message.sender.email === targetEmail;
            
            // ✅ 클라이언트 측에서 unReadCount 계산 (API 호출 최소화)
            queryClient.setQueryData(['conversationList'], (oldData: ConversationProps) => {
                if (!oldData) return { conversations: [] };
                
                const updatedConversations = oldData.conversations.map(conversation => {
                    if (conversation.id !== message.conversationId) return conversation;

                    const existingMessages = conversation.messages ?? [];
                    let newUnreadCount = conversation.unReadCount || 0;
                    
                    // 내가 보낸 메시지가 아니면 unReadCount 증가
                    if (!isMyMessage) {
                        newUnreadCount += 1;
                    }
                    
                    // ✅ 메시지의 실제 createdAt 시간 사용 (순서 일관성 보장)
                    const messageCreatedAt = new Date(message.createdAt);
                    
                    // ✅ 메시지 배열도 시간순으로 정렬 (최신이 맨 위)
                    const updatedMessages = [message, ...existingMessages].sort((a, b) => {
                        const aTime = new Date(a.createdAt).getTime();
                        const bTime = new Date(b.createdAt).getTime();
                        return bTime - aTime; // 내림차순 (최신이 위)
                    });
                    
                    return {
                        ...conversation,
                        messages: updatedMessages,
                        unReadCount: newUnreadCount, // ✅ 클라이언트 측 계산
                        lastMessageAt: messageCreatedAt, // ✅ 메시지의 실제 시간 사용
                    };
                });
                
                // ✅ lastMessageAt 기준으로 정렬 (최신 메시지가 있는 대화를 맨 위로)
                const reorderedConversations = [...updatedConversations]
                    .sort((a, b) => {
                        const aTime = new Date(a.lastMessageAt || 0).getTime();
                        const bTime = new Date(b.lastMessageAt || 0).getTime();
                        return bTime - aTime; // 내림차순 (최신이 위)
                    });
                
                return { conversations: reorderedConversations };
            });

            // ✅ 전체 unReadCount도 클라이언트 측에서 계산
            if (!isMyMessage) {
                queryClient.setQueryData(['conversationList'], (oldData: ConversationProps) => {
                    if (!oldData) return oldData;
                    
                    const totalUnreadCount = oldData.conversations.reduce((total, conversation) => {
                        return total + (conversation.unReadCount || 0);
                    }, 0);
                    
                    setUnreadCount(totalUnreadCount);
                    return oldData;
                });
            }
        };

        const handleSeenMessage = async (payload: { conversationId: string; seenUser: any }) => {
            // ✅ 클라이언트 측에서 unReadCount 계산 (API 호출 최소화)
            queryClient.setQueryData(['conversationList'], (oldData: ConversationProps) => {
                if (!oldData) return { conversations: [] };
                
                const updatedConversations = oldData.conversations.map(conversation => {
                    if (conversation.id !== payload.conversationId) return conversation;
                    
                    // 현재 대화방의 unReadCount를 0으로 설정
                    return {
                        ...conversation,
                        unReadCount: 0,
                    };
                });
                
                // ✅ 전체 unReadCount도 클라이언트 측에서 계산
                const totalUnreadCount = updatedConversations.reduce((total, conversation) => {
                    return total + (conversation.unReadCount || 0);
                }, 0);
                
                setUnreadCount(totalUnreadCount);
                
                return { conversations: updatedConversations };
            });
        };
      
        socket.on('connect', handleReconnect);
        socket.on("conversation:new", handleNewConversation);
        socket.on("receive:conversation", handleReceiveConversation);
        socket.on("seen:message", handleSeenMessage);

        return () => {
            socket.off('connect', handleReconnect);
            socket.off("conversation:new", handleNewConversation);
            socket.off("receive:conversation", handleReceiveConversation);
            socket.off("seen:message", handleSeenMessage);
        };
    }, [ socket, queryClient, refetch, conversationId, setUnreadCount ]);

    const memoizedConversations = useMemo(() => {
        if (status !== 'success') return null;
        if (status === 'success' && data.conversations && data.conversations.length === 0) {
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
