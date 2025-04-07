'use client';
import useConversation from '@/src/app/hooks/useConversation';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MessageView from './MessageView';
import { FullMessageType } from '@/src/app/types/conversation';
import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import getMessages from '@/src/app/lib/getMessages';
import { readMessages } from '@/src/app/lib/readMessages';
import ChatSkeleton from '@/src/app/components/skeleton/ChatSkeleton';
import { PiArrowFatDownFill } from "react-icons/pi";
import CircularProgress from '@/src/app/components/CircularProgress';
import { useSocket } from '../../context/socketContext';
import useConversationUserList from '../../hooks/useConversationUserList';

interface PageData {
    messages: FullMessageType[];  // 각 페이지에서 메시지 배열
    nextCursor: string | null;    // 다음 페이지의 커서 (있다면)
}

const Body = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { conversationId } = useConversation();
    const [isFirstLoad, setIsFirstLoad] = useState(true); // 처음 로딩 여부
    const [isScrolledUp, setIsScrolledUp] = useState(false); // 스크롤이 위에 있을 때 true
    const { set, conversationUsers, remove } = useConversationUserList();
    const isAndroid = /Android/i.test(navigator.userAgent);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            if (bottomRef.current) {
                bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
            }
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });
    };

    const getIsAtBottom = () => {
        const el = scrollRef.current;
        if (!el) return false;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const visualViewportHeight = window.visualViewport?.height || window.innerHeight;
        const keyboardGap = isAndroid ? window.innerHeight - visualViewportHeight : 0;
        const threshold = isAndroid ? Math.max(180, keyboardGap) : 100;
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        return distanceFromBottom <= threshold;
    };


    // ✅ 메시지 데이터 불러오기 (무한 스크롤 적용)
    const {
        data,
        status,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['messages', conversationId],
        queryFn: ({ pageParam = null }) => getMessages({ conversationId, pageParam }),
        initialPageParam: null, // 최신 메시지부터 로드
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
        select: (data) => ({
            // 데이터 역순으로 정렬
            pages: [...data.pages].reverse(),
            pageParams: [...data.pageParams].reverse(),
        }),
    });    

    const { mutate: readMessageMutaion } = useMutation({
        mutationFn: readMessages,
        onSuccess: () => {
            if (socket) socket.emit('read:messages', { conversationId });
        },
    });

    useEffect(() => {
        // 처음 채팅 입장
        if (status === 'success' && data?.pages?.length && isFirstLoad) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollToBottom();
                }, 50);
            });
            setIsFirstLoad(false);
            readMessageMutaion(conversationId);
        }
    }, [status, data]);

    const handleRead = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['unReadCount'] });
        queryClient.invalidateQueries({ queryKey: ['conversationList'] });
    }, [queryClient]);
    
    const handleExit = useCallback((data: { conversationId: string; userId: string[] }) => {
        const { conversationId, userId } = data;
        set({ conversationId, userIds: userId });
        queryClient.invalidateQueries({ queryKey: ['unReadCount'] });
        queryClient.invalidateQueries({ queryKey: ['conversationList'] });
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    }, [queryClient, set]);

    // ✅ 소켓 메시지 수신 시 최신 메시지를 리스트의 가장 아래에 추가
    useEffect(() => {
        if (!socket) return;

        const handleReconnect = () => {
            socket.emit('join:room', conversationId); // 방 재입장
            refetch(); // 메시지 다시 불러오기 ✅
        };

        socket.emit('join:room', conversationId);
        socket.on('connect', handleReconnect);
        socket.on("receive:message", (message: FullMessageType) => {

            queryClient.setQueriesData(
                { queryKey: ['messages', conversationId] },
                (oldData: InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }> | undefined) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: [
                            {
                                messages: [message, ...oldData.pages[0].messages], // 최신 메시지를 첫 번째 페이지에 추가
                                nextCursor: oldData.pages[0].nextCursor
                            },
                            ...oldData.pages.slice(1), // 나머지 페이지 유지
                        ]
                    };
                }
            );

            readMessageMutaion(conversationId);

            requestAnimationFrame(() => {
                const atBottom = getIsAtBottom();

                if (atBottom) {
                    scrollToBottom();
                    setIsScrolledUp(false);
                } else {
                    setIsScrolledUp(true);
                }
            });
        });
        socket.on("read:message", handleRead);
        socket.on("exit:user", handleExit);

        return () => {
            socket.off("join:room");
            socket.off('connect', handleReconnect);
            socket.off("receive:message");
            socket.off("read:message");
            socket.off("exit:user");
        };
    }, [socket, conversationId]);

    // 채팅방 참여 & 미참여
    useEffect(() => {
        const handleBeforeUnload = () => {
          // 페이지를 떠나기 전에 채팅방 나가기 이벤트 전송
          if(socket) socket.emit("leave:room", conversationId);
        };
    
        window.addEventListener("beforeunload", handleBeforeUnload);
    
        // 컴포넌트 언마운트 시 cleanup
        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
          // 혹은 필요시 여기서도 leaveRoom 이벤트 전송
          if(socket) socket.emit("leave:room", conversationId);
        };
    }, [conversationId]);

    // ✅ 스크롤 이벤트 리스너
    useEffect(() => {
        const handleScroll = async () => {
            if (!scrollRef.current) return;
            const el = scrollRef.current;

            const atTop = el.scrollTop === 0;
            const isAtBottom = getIsAtBottom();
            setIsScrolledUp(!isAtBottom);

            const previousScrollHeight = el.scrollHeight;

            if (atTop && hasNextPage && !isFetchingNextPage) {
                await fetchNextPage();
                requestAnimationFrame(() => {
                    if (scrollRef.current) {
                        const newScrollHeight = scrollRef.current.scrollHeight;
                        scrollRef.current.scrollTop = newScrollHeight - previousScrollHeight;
                    }
                });
            }
        };

        const container = scrollRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // ✅ 클릭맨 아래로 스크롤하는 함수
    const clickToBottom = useCallback(() => {
        setIsScrolledUp(false);
        scrollToBottom();
    },[]);

    return (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            {isFetchingNextPage && (
                <CircularProgress aria-label="로딩중"/>
            )}
            {status === 'success' 
                ? data?.pages.map((page: PageData, i) => {
                    if (!page) return null;

                    const messages = page.messages.slice().reverse();

                    return (<Fragment key={i}>
                        {messages.map((message: FullMessageType, idx: number) => {
                            // 날짜 구분선 계산
                            const prevMessageInPage = idx > 0 ? messages[idx - 1] : null;
                            const prevMessageInPrevPage =
                                idx === 0 && i > 0
                                    ? data.pages[i - 1].messages.slice().reverse().at(-1)
                                    : null;

                            const prevMessage = prevMessageInPage ?? prevMessageInPrevPage;

                            const currentDate = new Date(message.createdAt).toDateString();
                            const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
                            const showDateDivider = currentDate !== prevDate;

                            return (<MessageView
                                key={message.id}
                                data={message}
                                isLast={idx === Object.keys(page.messages).length - 1}
                                currentUser={session?.user}
                                conversationId={conversationId}
                                showDateDivider={showDateDivider}
                            />)
                        })}
                    </Fragment>)
                })
                : (<ChatSkeleton />)
            }

            {/* ✅ 아래로 이동 버튼 */}
            {isScrolledUp && (
                <button
                    type='button'
                    className="
                        absolute 
                        md:bottom-24 
                        bottom-28
                        right-1/2
                        p-2 
                        bg-default-reverse 
                        text-default-reverse
                        rounded-full 
                        shadow-lg 
                        opacity-70
                        translate-x-[50%]
                    "
                    onClick={clickToBottom}
                >
                    <PiArrowFatDownFill size="20" />
                </button>
            )}

            <div ref={bottomRef} />
        </div>
    );
};

export default Body;

