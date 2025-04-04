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
import { useKeyboardOrInputVisible } from '../../hooks/useKeyboardOrInputVisible';
import useIsMobile from '../../hooks/useIsMobile';

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
    const [prevScrollHeight, setPrevScrollHeight] = useState(0); // 기존의 스크롤 높이 저장
    const { set, conversationUsers, remove } = useConversationUserList();
    const { keyboardVisible, inputFocused } = useKeyboardOrInputVisible();
    const isOnMobile = useIsMobile();

    const shouldShowScrollButton = useMemo(() => {
        if (isOnMobile) {
          // 모바일 조건
          return isScrolledUp && !keyboardVisible && !inputFocused;
        } else {
          // 데스크탑 조건
          return isScrolledUp;
        }
    }, [isScrolledUp, keyboardVisible, inputFocused, isOnMobile]);

    // ✅ 메시지 데이터 불러오기 (무한 스크롤 적용)
    const {
        data,
        status,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
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
                bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
                setPrevScrollHeight(() => scrollRef?.current?.scrollHeight || 0); // 스크롤 높이 저장
            });
            setIsFirstLoad(false);
            readMessageMutaion(conversationId);
        }

        // 새로운 채팅 입력된 후에, 스크롤 위치 변화 감지
        const chatBox = scrollRef.current;
        if (chatBox) {
            const { scrollTop, scrollHeight, clientHeight } = chatBox;
            // const isAtBottom = scrollHeight - clientHeight <= scrollTop + 5;

            const isAtBottom = prevScrollHeight <= clientHeight + scrollTop + 20; 

            if (isAtBottom) {
                requestAnimationFrame(() => {
                    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                    setPrevScrollHeight(() => scrollRef?.current?.scrollHeight || 0); // 스크롤 높이 저장
                });
            } else {
                setIsScrolledUp(true);
            }
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

        socket.emit('join:room', conversationId);
        socket.on("receive:message", (message: FullMessageType) => {
            // 기존의 채팅 높이 저장
            const prevHeight = scrollRef?.current?.scrollHeight; 
            if(prevHeight) setPrevScrollHeight(() => prevHeight || 0);

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
        });
        socket.on("read:message", handleRead);
        socket.on("exit:user", handleExit);

        return () => {
            socket.off("join:room");
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

            if(isScrolledUp)  setIsScrolledUp((prevState) => (prevState ? false : prevState));

            const { scrollTop, scrollHeight } = scrollRef.current;

            // ✅ 스크롤 위치 저장
            const previousScrollHeight = scrollHeight;

            if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
                await fetchNextPage();

                // ✅ 데이터 로드 후 스크롤 위치를 기존 자리로 유지
                requestAnimationFrame(() => {
                    if (scrollRef.current) {
                        const newScrollHeight = scrollRef.current.scrollHeight;
                        scrollRef.current.scrollTop = newScrollHeight - previousScrollHeight;
                    }
                });
            }
        };

        const scrollContainer = scrollRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (scrollContainer) scrollRef.current?.removeEventListener('scroll', handleScroll);
        }
    }, [isScrolledUp, fetchNextPage, hasNextPage, isFetchingNextPage]);

    // ✅ 클릭맨 아래로 스크롤하는 함수
    const clickToBottom = useCallback(() => {
        setIsScrolledUp(() => false);
        setPrevScrollHeight(() => scrollRef?.current?.scrollHeight || 0); // 스크롤 높이 저장
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    },[]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
            {shouldShowScrollButton && (
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

