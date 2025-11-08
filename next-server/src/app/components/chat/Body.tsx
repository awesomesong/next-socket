"use client";
import useConversation from "@/src/app/hooks/useConversation";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  memo,
} from "react";
import MessageView from "./MessageView";
import { FullMessageType, getUnreadCountFromList, getMessageSenderId } from "@/src/app/types/conversation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import getMessages from "@/src/app/lib/getMessages";
import { readState } from "@/src/app/lib/readState";
import ChatSkeleton from "@/src/app/components/skeleton/ChatSkeleton";
import { PiArrowFatDownFill } from "react-icons/pi";
import CircularProgress from "@/src/app/components/CircularProgress";
import { useSocket } from "../../context/socketContext";
import { useChatScroller } from "@/src/app/hooks/useChatScroller";
import { useInitialScroll } from "@/src/app/hooks/useInitialScroll";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import {
  conversationListKey,
  messagesKey,
  markConversationRead,
  setTotalUnreadFromList,
  ConversationListData,
} from "@/src/app/lib/react-query/chatCache";
import { resetSeenUsersForLastMessage, setSeenUsersForLastMessage } from "@/src/app/lib/react-query/chatCache";

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>;
  bottomRef: RefObject<HTMLDivElement | null>;
  isAIChat?: boolean;
}

interface seenUser { 
  id: string; 
  name: string | null; 
  email: string | null; 
  image: string | null 
}

// ✅ 빈 배열 상수 - 참조 안정화를 위해
const EMPTY_SEEN_USERS: Array<seenUser> = [];

const Body = ({ scrollRef, bottomRef, isAIChat }: Props) => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { conversationId } = useConversation();
  const { setUnreadCount } = useUnreadStore();
  const getEl = useCallback(() => scrollRef.current, [scrollRef]);
  const isScrollingInitialRef = useRef(true); // 초기값 true
  const pendingJoinReadRef = useRef(false);

  // ✅ 스크롤 관리 훅 (여기서 모든 판정/버튼 노출/자동 스크롤 처리)
  const {
    showArrow,
    wasAtBottomRef,
    onUserScroll,
    onNewContent,
    scrollToBottom,
    refreshFlags,
  } = useChatScroller(getEl);

  // ✅ 대화방 변경 시 초기 스크롤 플래그 리셋
  // ✅ 메시지 데이터 불러오기 (무한 스크롤 적용)
  const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage, dataUpdatedAt } = useInfiniteQuery({
    queryKey: messagesKey(conversationId),
    queryFn: ({ pageParam = null }) =>
      getMessages({ conversationId, pageParam }),
    initialPageParam: null, // 최신 메시지부터 로드
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // ✅ seenUsersForLastMessage 데이터 추출 (항상 계산되지만, 실제 전달은 메시지별로 필터링)
  const seenUsersForLastMessageRaw = useMemo(() => {
    if (!data?.pages?.[0]?.seenUsersForLastMessage) return [];
    return data.pages[0].seenUsersForLastMessage;
  }, [data?.pages]);

  // ✅ 안정적인 메시지 정렬 함수 (createdAt 1차, 동시간대는 id로 보조 정렬)
  const compareMessages = useCallback((a: FullMessageType, b: FullMessageType) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    if (aTime !== bTime) return aTime - bTime; // ✅ 오래된 → 최신 (올바름)

    // 동시간대에는 ObjectId(혹은 문자열 id) 순으로 보조 정렬
    const aId = (a.id ?? "").toString();
    const bId = (b.id ?? "").toString();
    if (aId && bId) return aId.localeCompare(bId); // ✅ 순서대로
    return 0;
  },[]);

  // === 1) readStateMutation: onMutate에서 낙관적 워터마크 반영 유지 ===
  const { mutate: readStateMutation } = useMutation({
    mutationFn: readState,
    onMutate: async (vars: { conversationId: string; seenUntilMs: number; lastMessageId?: string; includeSeenUsers?: boolean }) => {
      const { conversationId: targetConversationId } = vars;

      const prevList = queryClient.getQueryData(conversationListKey) as ConversationListData | undefined;
      const prevTotal = useUnreadStore.getState().unReadCount;
      const prevUnRead = getUnreadCountFromList(prevList, targetConversationId);
      markConversationRead(queryClient, targetConversationId);
      setUnreadCount(Math.max(0, prevTotal - prevUnRead));

      return { prevList, prevTotal };
    },
    onSuccess: (data, vars) => {
      const { conversationId: targetConversationId, includeSeenUsers, lastMessageId } = vars;

      // 총합 갱신 / 소켓 통지 등 기존 코드 유지
      const totalUnread = setTotalUnreadFromList(queryClient);
      if (totalUnread !== undefined) setUnreadCount(totalUnread);
      
      // ✅ 서버가 includeSeenUsers로 계산해준 최신 읽은 사용자 목록 반영
      if (includeSeenUsers && lastMessageId && Array.isArray(data.seenUsers)) {
        setSeenUsersForLastMessage(
          queryClient,
          targetConversationId,
          lastMessageId,
          data.seenUsers
        );
      }
      
      if (socket) {
        // ✅ API에서 전달받은 메시지 발신자 ID 사용 (효율적)
        const messageSenderId = data.messageSenderId;
        
        socket?.emit("read:state", {
          conversationId: targetConversationId,
          lastMessageId: vars.lastMessageId, // ✅ lastMessageId 포함
          readerId: session?.user?.id, // ✅ readerId 추가
          seenUsers: includeSeenUsers ? data.seenUsers : undefined, // ✅ 읽은 사용자 정보 포함
          messageSenderId, // ✅ API에서 전달받은 메시지 발신자 ID
        });
      }
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(conversationListKey, context.prevList);
      setUnreadCount(context.prevTotal);
    },
  });

  // ✅ 방 입장/퇴장: 대화방 들어올 때 1회 join, 나갈 때 leave
  useEffect(() => {
    if (!socket || !conversationId) return;
    
    const join = () => {
      socket.emit("join:room", conversationId);
    };

    socket.off("connect", join);
    socket.on("connect", join);
    if (socket.connected) join();
    
    return () => {
      socket.emit("leave:room", conversationId);
      socket.off("connect", join);
    };
  }, [socket, conversationId]);

  // 모든 페이지의 메시지를 FlatMap으로 합친 후 정렬하여 반환 (UI 렌더링용)
  const allMessages = useMemo(() => {
    const serverMessages = data?.pages.flatMap((page) => page.messages) || [];
    
    // ✅ undefined 메시지 필터링
    const validServerMessages = serverMessages.filter((m) => m && m.id);
    
    // 서버 메시지만 정렬
    return validServerMessages.sort(compareMessages);
  }, [data?.pages, compareMessages]);

  // ✅ 전체 마지막 메시지 ID - 읽음 UI 표시 여부 결정에 사용
  const lastMessageId = useMemo(() => {
    return allMessages[allMessages.length - 1]?.id;
  }, [allMessages]);
  
  const myId = String(session?.user?.id ?? "");

  // 2) liveUsersKey 계산 (참여자 키) - 실제 대화방 참여자 목록 사용
  const liveUsersKey = useMemo(() => {
    // ✅ 최신 메시지의 conversation.userIds 사용 (소켓 이벤트로 항상 최신 상태 유지됨)
    // SocketState.tsx에서 member.left 이벤트 시 messagesKey가 업데이트되면
    // allMessages가 자동으로 재계산되어 liveUsersKey도 재계산됨
    const latestMessage = allMessages[allMessages.length - 1];
    if (latestMessage?.conversation?.userIds?.length) {
      return latestMessage.conversation.userIds
        .map((id: string) => String(id))
        .sort()
        .join(",");
    }
    
    // 메시지가 없는 경우 (빈 대화방) - 현재 사용자만 포함
    // 메시지가 생기면 자동으로 동기화됨
    return myId ? myId : "";
  }, [allMessages, myId]);

  const lastOwnMessageId = useMemo(() => {
    const me = String(session?.user?.id ?? "");
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const m = allMessages[i];
      const senderId = getMessageSenderId(m);
      if (!m.isAIResponse && senderId && me && senderId === me) {
        const result = String(m.id);
        return result;
      }
    }
    return undefined;
  }, [allMessages, session?.user?.id]);


  // === 2) allMessagesRef 최신화 (초기/수신 공용) ===
  const allMessagesRef = useRef<FullMessageType[]>([]);
  const lastMessageCountRef = useRef(0);
  const processedConversationRef = useRef<string | null>(null);
  
  useEffect(() => {
    allMessagesRef.current = allMessages;
    const currentCount = allMessages.length;
    
    // ✅ 메시지 추가됐을 때만 스크롤 (업데이트는 스크롤 안 함)
    if (currentCount > 0 && currentCount > lastMessageCountRef.current) {
      lastMessageCountRef.current = currentCount;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // ✅ 초기 로딩: 무조건 하단으로 (낙관적 메시지 포함)
          if (isScrollingInitialRef.current) {
            scrollToBottom({ force: true });
          } else {
            // ✅ 실시간: 하단이면 자동 스크롤, 위에 있으면 화살표만
            onNewContent({ isScrollingInitial: false });
          }
        });
      });
    } else {
      lastMessageCountRef.current = currentCount;
    }
  }, [allMessages, scrollToBottom, onNewContent]);
  
  // === 3) 통합된 읽음 처리 로직 ===
  const hasProcessedReadRef = useRef<Set<string>>(new Set()); // read-state api 중복 처리 방지
  const readThrottleRef = useRef<number | null>(null); // 재호출 방지

  const processReadState = useCallback((messageId: string, reason: string, messageData?: FullMessageType) => {
    // ✅ conversationId가 없으면 읽음 처리 스킵
    if (!conversationId) return;

    // ✅ 경량 스로틀로 과호출 방지 (120ms)
    if (readThrottleRef.current && Date.now() - readThrottleRef.current < 120) return;
    readThrottleRef.current = Date.now();

    const key = `${conversationId}-${messageId}`;
    // 중복 처리 방지
    if (hasProcessedReadRef.current.has(key)) return;
    
    // ✅ 실시간 메시지인 경우 받은 데이터 직접 사용, 아니면 allMessagesRef에서 찾기
    const message = messageData || allMessagesRef.current.find(m => m.id === messageId);
    if (!message) return;

    const lastSenderId = getMessageSenderId(message);
    const myId = session?.user?.id;
    const isFromMe = lastSenderId && myId && String(lastSenderId) === String(myId);
    const isGroup = message.conversation?.isGroup;
    
    if (isFromMe || isAIChat) {
      hasProcessedReadRef.current.add(key);
      return;
    }

    hasProcessedReadRef.current.add(key); 
    readStateMutation({
      conversationId,
      seenUntilMs: Date.now(),
      lastMessageId: messageId,
      includeSeenUsers: !!isGroup,
    });
  }, [conversationId, isAIChat, session?.user?.id, readStateMutation]);

  const attemptJoinSuccessRead = useCallback(() => {
    if (!pendingJoinReadRef.current) return;
    if (!conversationId) return;
    if (processedConversationRef.current === conversationId) {
      pendingJoinReadRef.current = false;
      return;
    }

    const messages = allMessagesRef.current;
    if (!messages?.length) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.id) return;

    const myId = session?.user?.id;
    const myMail = session?.user?.email;
    const senderId = getMessageSenderId(lastMessage);
    const senderMail = lastMessage.sender?.email;
    const isFromMe =
      (senderId && myId && String(senderId) === String(myId)) ||
      (senderMail && myMail && String(senderMail) === String(myMail));
    const isHuman = !lastMessage.isAIResponse && lastMessage.type !== "system";

    if (!isHuman || isFromMe || isAIChat) {
      processedConversationRef.current = conversationId;
      pendingJoinReadRef.current = false;
      return;
    }

    pendingJoinReadRef.current = false;
    processedConversationRef.current = conversationId;
    processReadState(lastMessage.id, "join:success 후 초기 진입", lastMessage);
  }, [conversationId, isAIChat, processReadState, session?.user?.email, session?.user?.id]);

  // ✅ 대화방 변경 시 초기 스크롤 플래그 리셋
  useEffect(() => {
    isScrollingInitialRef.current = true;
    hasProcessedReadRef.current.clear(); // 읽음 처리 Set 초기화
    pendingJoinReadRef.current = false;
    processedConversationRef.current = null;

    return () => {
      if (pendingJoinReadRef.current) {
        attemptJoinSuccessRead();
      }
      pendingJoinReadRef.current = false;
    };
  }, [conversationId, attemptJoinSuccessRead]);

  // ✅ join:room 성공 이벤트 리스너
  useEffect(() => {
    if (!socket) return;

    const handleJoinSuccess = (roomId: string) => {
      if (roomId !== conversationId) return;
      pendingJoinReadRef.current = true;
      attemptJoinSuccessRead();
    };

    socket.on("join:success", handleJoinSuccess);
    return () => {
      socket.off("join:success", handleJoinSuccess);
    };
  }, [socket, conversationId, attemptJoinSuccessRead]);

  useEffect(() => {
    attemptJoinSuccessRead();
  }, [attemptJoinSuccessRead, dataUpdatedAt]);

  // === 4) "실시간 수신" : 새 메시지 수신 시 즉시 읽음 처리 ===
  const handleReceiveMessage = useCallback((m: FullMessageType) => {
    const cid = String(m.conversationId ?? "");
    if (cid && cid !== String(conversationId)) return;

    // ✅ conversationId가 없으면 읽음 처리 스킵
    if (!conversationId) return;

    const senderId   = getMessageSenderId(m);
    const senderMail = m.sender?.email;
    const myId       = session?.user?.id;
    const myMail     = session?.user?.email;
    const isFromMe = (senderId && myId && String(senderId) === String(myId))
                  || (senderMail && myMail && String(senderMail) === String(myMail));
    const isHuman  = !m.isAIResponse && m.type !== "system";

    // ✅ 내 메시지 / AI / 시스템은 early return
    if (!isHuman || isFromMe || isAIChat) return;

    // ✅ 여기서만 reset (상대방 새 메시지에 대해서만)
    resetSeenUsersForLastMessage(queryClient, conversationId, m.id);
    processReadState(m.id, "실시간 수신", m);
  }, [conversationId, queryClient, session?.user?.id, session?.user?.email, isAIChat, processReadState]);

  useEffect(() => {
    if (!socket) return undefined;

    socket.off("receive:message", handleReceiveMessage);
    socket.on("receive:message", handleReceiveMessage);
    return () => {
      socket.off("receive:message", handleReceiveMessage);
    };
  }, [socket, handleReceiveMessage, conversationId]);


  // 채팅방 참여 & 미참여 (beforeunload 이벤트)
  // 이 useEffect는 window 레벨 이벤트를 다루므로, conversationId의 변화보다는 컴포넌트 마운트/언마운트에 집중합니다.
  useEffect(() => {
    const leaveOnce = () => {
      if (!socket) return;
      socket.emit("leave:room", conversationId);
    };

    const handleBeforeUnload = () => leaveOnce();
    const handlePageHide = () => leaveOnce();

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [socket, conversationId]);

  // ✅ 스크롤 이벤트 리스너 (이전 메시지 로드)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = async () => {
      onUserScroll(); // ← 버튼 노출/하단 상태 동기화

      if (el.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        const prevH = el.scrollHeight;
        await fetchNextPage();
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const newH = scrollRef.current.scrollHeight;
            scrollRef.current.scrollTop = newH - prevH;
          }
        });
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, scrollRef, onUserScroll]);

  // ✅ 클릭 맨 아래로 스크롤하는 함수
  const handleClickToBottom = useCallback(() => {
    scrollToBottom({ force: true });
  }, [scrollToBottom]);

  useEffect(() => {
    const handleNewContent = () => onNewContent();
    window.addEventListener("chat:new-content", handleNewContent);
    return () => window.removeEventListener("chat:new-content", handleNewContent);
  }, [onNewContent]);

  // ✅ 리사이즈 이벤트 처리
  useEffect(() => {
    const onResize = () => refreshFlags();

    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, [refreshFlags]);

  const shouldShowArrow =
    !isScrollingInitialRef.current && 
    status === "success" && 
    !isFetchingNextPage && 
    showArrow; // ✅ 자동 스크롤 중일 때 화살표 숨김  

  // 안정적인 getLastMessageId 함수 (dependency 변경 없음)
  const getLastMessageId = useCallback(() => {
    return allMessagesRef.current[allMessagesRef.current.length - 1]?.id;
  }, []); // 빈 배열 - 함수 재생성 안됨!

  const scrollTrigger = useMemo(() => {
    return status === "success" && !!data?.pages?.length;
  }, [status, data?.pages?.length]);
  
  // ✅ 초기 진입 시 마지막 메시지 렌더링 완료 후 스크롤
  useInitialScroll({
    scrollRef,
    getLastMessageId,
    conversationId,
    triggerScroll: scrollTrigger,
    wasAtBottomRef,
    isScrollingInitialRef,
  });

  // ✅ 메시지 리스트 렌더링 - useMemo로 최적화 (의존성 변경 시에만 재계산)
  const messageListElements = useMemo(() => {
    return allMessages.map((message: FullMessageType, idx: number) => {
      const prevMessage = idx > 0 ? allMessages[idx - 1] : null;
      const currentDate = new Date(message.createdAt).toDateString();
      const prevDate = prevMessage
        ? new Date(prevMessage.createdAt).toDateString()
        : null;
      const showDateDivider = currentDate !== prevDate;
      
        const isLastOwnForThisMessage = String(message.id) === String(lastOwnMessageId);
        // ✅ 핵심: 내 마지막 메시지가 전체 대화의 마지막 메시지일 때만 읽음 UI 표시
        const isMyLastAndOverallLast = isLastOwnForThisMessage && String(lastOwnMessageId) === String(lastMessageId);
        
        // ✅ 핵심: 마지막 내 메시지일 때만 seenUsersForLastMessage 전달, 아니면 빈 배열 상수 사용
        const seenUsersForThisMessage = isMyLastAndOverallLast 
          ? seenUsersForLastMessageRaw 
          : EMPTY_SEEN_USERS;
      
        return (
          <MessageView
            key={message.id}
            data={message}
            currentUser={session?.user}
            conversationId={conversationId}
            showDateDivider={showDateDivider}
            isAIChat={isAIChat}
            seenUsersForLastMessage={seenUsersForThisMessage} // 읽은 사용자 목록 전달
            isLastOwnForThisMessage={isMyLastAndOverallLast} // 내 마지막 메시지 여부
            liveUsersKey={liveUsersKey} // 참여자 ID 문자열
          />
        );
    });
  }, [allMessages, lastOwnMessageId, lastMessageId, seenUsersForLastMessageRaw, session?.user, conversationId, isAIChat, liveUsersKey]);

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      {isFetchingNextPage && <CircularProgress aria-label="메시지 로딩중" />}
      {status === "success" ? messageListElements : <ChatSkeleton />}
      {shouldShowArrow && (
        <button
          type="button"
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
          onClick={handleClickToBottom}
          title="맨 아래로 스크롤"
        >
          <PiArrowFatDownFill size="20" />
        </button>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default memo(Body, (prevProps, nextProps) => {
  return (
    prevProps.scrollRef === nextProps.scrollRef &&
    prevProps.bottomRef === nextProps.bottomRef &&
    prevProps.isAIChat === nextProps.isAIChat
  );
});
