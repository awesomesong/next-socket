'use client';
import useConversation from '@/src/app/hooks/useConversation';
import { Fragment, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { isAtBottom } from '../../utils/isAtBottom';

interface PageData {
    messages: FullMessageType[];  // 각 페이지에서 메시지 배열
    nextCursor: string | null;    // 다음 페이지의 커서 (있다면)
}

interface Props  {
    scrollRef: RefObject<HTMLDivElement | null>;
    bottomRef: RefObject<HTMLDivElement | null>;
}

const Body = ({ scrollRef, bottomRef }: Props) => {
    const socket = useSocket();
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const { conversationId } = useConversation();
    const [isFirstLoad, setIsFirstLoad] = useState(true); // 처음 로딩 여부
    const [isScrolledUp, setIsScrolledUp] = useState(false); // 스크롤이 위에 있을 때 true
    const wasAtBottomRef = useRef(false);
    const isAndroid = /Android/i.test(navigator.userAgent);

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            if (bottomRef.current) {
                bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            // if (scrollRef.current) {
            //     scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            // }
        });
    }, [bottomRef]);

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
        getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    });

    const { mutate: readMessageMutaion } = useMutation({
        mutationFn: readMessages,
        onSuccess: () => {
            if (socket) socket.emit('read:messages', { conversationId });
            // 'conversationList' 쿼리를 무효화하여 읽지 않은 메시지 카운트 등을 업데이트
            queryClient.invalidateQueries({ queryKey: ['conversationList'] });
        },
    });

    // 컴포넌트 마운트 시 및 conversationId 변경 시, 첫 로드 처리 및 메시지 읽음 처리
    useEffect(() => {
        if (status === 'success' && data?.pages?.length && isFirstLoad) {
            // 처음 로드될 때만 스크롤 맨 아래로
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollToBottom();
                }, 50); // 약간의 지연으로 렌더링 완료 후 스크롤
            });
            setIsFirstLoad(false);

            // 항상 메시지를 읽음 처리 (대화방 진입 시)
            readMessageMutaion(conversationId);
        }
    }, [status, data?.pages]);


    // ✅ 소켓 메시지 수신 시 최신 메시지를 리스트에 추가 또는 업데이트
    useEffect(() => {
        if (!socket) return;

        const handleReconnect = () => {
            socket.emit('join:room', conversationId); // 방 재입장
            // refetch(); // 메시지 다시 불러오기는 setQueriesData에서 처리하므로 여기서 호출하지 않아도 됨
        };

        const handleReceiveMessage = (message: FullMessageType) => {
            // **핵심 로직 변경:** 옵티미스틱 메시지를 서버 메시지로 "교체"하거나 새 메시지를 "추가"
            queryClient.setQueriesData(
                { queryKey: ['messages', conversationId] },
                (oldData: InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }> | undefined) => {
                    if (!oldData || !oldData.pages.length) {
                        // 데이터가 없거나 페이지가 없으면 새 메시지로 새 페이지를 만듭니다.
                        return {
                            pageParams: [null], // 초기 페이지 파라미터는 null로 유지
                            pages: [{ messages: [message], nextCursor: null }],
                        };
                    }

                    // 기존 페이지 배열을 복사합니다.
                    const updatedPages = [...oldData.pages];

                    // 가장 최신 메시지가 있는 첫 번째 페이지를 가져옵니다. (oldData.pages[0]가 가장 최신 메시지 페이지라고 가정)
                    const firstPage = { ...updatedPages[0] };
                    let messagesInFirstPage = [...firstPage.messages];

                    // 서버 ID (message.id)로 기존 메시지를 찾습니다.
                    const existingMessageIndex = messagesInFirstPage.findIndex(
                        (msg) => msg.id === message.id
                    );

                    if (existingMessageIndex !== -1) {
                        // ✅ 이미 해당 ID를 가진 메시지가 있다면 부드럽게 업데이트 (낙관적 → 서버 데이터)
                        messagesInFirstPage[existingMessageIndex] = {
                            ...messagesInFirstPage[existingMessageIndex],
                            ...message,
                            // 낙관적 업데이트의 일부 속성은 유지 (UX 흔들림 방지)
                            createdAt: messagesInFirstPage[existingMessageIndex].createdAt,
                        };
                    } else {
                        // 첫 페이지에 없는 새로운 메시지라면 추가합니다.
                        // 이 메시지는 소켓으로 수신된 메시지이므로, 가장 최신 메시지일 가능성이 높습니다.
                        // createdAt 기준으로 정렬될 것이므로 일단 추가합니다.
                        messagesInFirstPage.push(message); 
                    }

                    // 첫 페이지 내에서 메시지를 createdAt 기준으로 정렬합니다. (최신 메시지 순서 유지)
                    // 오래된 -> 최신 순으로 정렬되어야 스크롤 상단에 오래된 메시지가 나타납니다.
                    messagesInFirstPage.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                    // 업데이트된 첫 페이지를 기존 페이지 배열에 다시 할당합니다.
                    updatedPages[0] = {
                        ...firstPage,
                        messages: messagesInFirstPage,
                    };

                    return {
                        ...oldData,
                        pages: updatedPages, // 이전 페이지들은 그대로 유지
                    };
                }
            );

            if (isAtBottom(scrollRef.current)) {
                requestAnimationFrame(() => {
                    scrollToBottom();
                    setIsScrolledUp(false);
                });
            } else {
                setIsScrolledUp(true);
            }

            // 내가 보낸 메시지가 아닐 경우에만 읽음 처리
            if (message.sender.id !== session?.user?.id) {
                readMessageMutaion(conversationId);
            }
        };


        const handleReadMessages = (payload: { conversationId: string; seenUser: FullMessageType['seen'] }) => {
            // 'seen:user' 이벤트가 MessageView에서 처리되므로, 여기서 직접 메시지의 seen 상태를 업데이트할 필요는 없을 수 있습니다.
            // 하지만 전체 대화방 목록의 '읽지 않은 메시지 수' 업데이트를 위해 'conversationList' 쿼리를 무효화합니다.
            if (payload?.conversationId === conversationId) {
                queryClient.invalidateQueries({ queryKey: ['conversationList'] });
            }
        };

        socket.emit('join:room', conversationId);
        socket.on('connect', handleReconnect);
        socket.on("receive:message", handleReceiveMessage);
        socket.on("read:message", handleReadMessages);

        return () => {
            socket.off('connect', handleReconnect);
            socket.off("receive:message", handleReceiveMessage);
            socket.off("read:message", handleReadMessages);
        };
    }, [socket, conversationId, queryClient, session?.user?.id, readMessageMutaion, scrollToBottom, scrollRef]); 

    // 채팅방 참여 & 미참여 (beforeunload 이벤트)
    // 이 useEffect는 window 레벨 이벤트를 다루므로, conversationId의 변화보다는 컴포넌트 마운트/언마운트에 집중합니다.
    useEffect(() => {
        const handleBeforeUnload = () => {
          if(socket) socket.emit("leave:room", conversationId);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
          // 컴포넌트 언마운트 시 명시적으로 leave:room 전송
          if(socket) socket.emit("leave:room", conversationId);
        };
    }, [socket, conversationId]);


    // ✅ 스크롤 이벤트 리스너 (이전 메시지 로드)
    useEffect(() => {
        const handleScroll = async () => {
            if (!scrollRef.current) return;
            const el = scrollRef.current;

            const atTop = el.scrollTop === 0;
            const isBottom = isAtBottom(scrollRef.current, isAndroid);
            setIsScrolledUp(!isBottom);

            if (atTop && hasNextPage && !isFetchingNextPage) {
                const previousScrollHeight = el.scrollHeight;
                await fetchNextPage(); // 다음 페이지 로드
                requestAnimationFrame(() => { // 로드 후 스크롤 위치 유지
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
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, isAndroid, scrollRef]);

    // ✅ 클릭 맨 아래로 스크롤하는 함수
    const clickToBottom = useCallback(() => {
        setIsScrolledUp(false);
        scrollToBottom();
    }, [scrollToBottom]); 


    // 모든 페이지의 메시지를 FlatMap으로 합친 후 정렬하여 반환 (UI 렌더링용)
    const allMessages = useMemo(() => {
        return (
            data?.pages
              .flatMap(page => page.messages)
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // 오래된 → 최신
            || []
        );
    }, [data?.pages]);
      
    const lastMessageId = allMessages.at(-1)?.id;

    return (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            {isFetchingNextPage && (
                <CircularProgress aria-label="메시지 로딩중"/>
            )}
            {status === 'success'
                ? allMessages.map((message: FullMessageType, idx: number) => {
                    const prevMessage = idx > 0 ? allMessages[idx - 1] : null;
    
                    const currentDate = new Date(message.createdAt).toDateString();
                    const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
                    const showDateDivider = currentDate !== prevDate;
    
                    return (
                        <MessageView
                            key={message.id}
                            data={message}
                            isLast={message.id === lastMessageId}
                            currentUser={session?.user}
                            conversationId={conversationId}
                            showDateDivider={showDateDivider}
                        />
                    );
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