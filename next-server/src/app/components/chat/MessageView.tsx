"use client";
import { useEffect, useRef, useState, memo, useMemo, useCallback } from "react";
import Avatar from "@/src/app/components/Avatar";
import ImageModal from "@/src/app/components/ImageModal";
import { FullMessageType, normalizePreviewType } from "@/src/app/types/conversation";
import { IUserList } from "@/src/app/types/common";
import clsx from "clsx";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { sendMessage } from "@/src/app/lib/sendMessage";
import FallbackNextImage from "@/src/app/components/FallbackNextImage";
import { useSocket } from "../../context/socketContext";
import { HiExclamationTriangle, HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import {
  messagesKey,
  updateMessagePartialById,
  bumpConversationOnNewMessage,
  replaceOptimisticMessage,
  type MessagesPage,
  normalizeMessage,
} from "@/src/app/lib/react-query/chatCache";
import { useFailedMessages } from "@/src/app/hooks/useFailedMessages";
import { useAIStream } from "@/src/app/hooks/useAIStream";
import { useConversationLoading } from "@/src/app/hooks/useConversationLoading";
import DOMPurify from 'dompurify';

type SeenUser = { 
  id: string; 
  name: string | null; 
  image: string | null 
};

interface MessageBoxProps {
  data: FullMessageType;
  currentUser: IUserList | null | undefined;
  conversationId: string;
  showDateDivider?: boolean;
  isAIChat?: boolean;
  isLastOwnForThisMessage: boolean;
  liveUsersKey: string;        // 참여자 id 집합 (문자열 "id1,id2,…")
  seenUsersForLastMessage?: Array<{ id: string; name: string | null; image: string | null }>;
}

const noUserType = {
  image: "None",
  id: null,
  email: null,
  name: null,
} as const;

const areEqual = (prev: MessageBoxProps, next: MessageBoxProps) => {
  const p = prev.data;
  const n = next.data;

  // 1) 가장 흔한 동일성 빠른 탈출 (참조 비교 우선)
  if (p === n &&
      prev.isLastOwnForThisMessage === next.isLastOwnForThisMessage &&
      prev.liveUsersKey === next.liveUsersKey &&
      prev.showDateDivider === next.showDateDivider &&
      prev.isAIChat === next.isAIChat &&
      prev.conversationId === next.conversationId &&
      prev.currentUser?.email === next.currentUser?.email &&
      prev.seenUsersForLastMessage === next.seenUsersForLastMessage // ✅ 참조 비교로 빠른 탈출
  ) {
    return true;
  }

  // 2) 메시지 ID가 다르면 무조건 리렌더링 필요
  if (p.id !== n.id) return false;
  
  // ✅ AI 응답 완료 후에는 완전히 리렌더링 차단 (가장 먼저 체크)
  const prevIsActive = Boolean(p.isWaiting || p.isTyping);
  const nextIsActive = Boolean(n.isWaiting || n.isTyping);
  const isStreamingComplete = !prevIsActive && !nextIsActive;
  const isAIComplete = p.isAIResponse && n.isAIResponse && isStreamingComplete;
  
  if (isAIComplete) {
    // AI 응답이 완료된 경우 모든 변경을 무시하고 리렌더링 차단
    return true;
  }

  // 3) 데이터의 핵심 스칼라만 비교
  // ✅ 스트리밍 완료 후에는 핵심 필드만 비교 (참조 변경 무시)
  if (isStreamingComplete) {
    // 스트리밍 완료 후에는 body, type, image, error만 확인
    // sender와 conversation은 변경되지 않으므로 비교 불필요
    if (
      p.type !== n.type ||
      p.body !== n.body ||
      p.image !== n.image ||
      p.isError !== n.isError
    ) {
      return false;
    }
    // 나머지 필드는 무시 (참조 변경으로 인한 불필요한 리렌더링 방지)
  } else {
    // 스트리밍 진행 중에는 모든 필드 비교
    if (
      p.type !== n.type ||
      p.body !== n.body ||
      p.image !== n.image ||
      +new Date(p.createdAt) !== +new Date(n.createdAt) ||
      p.isAIResponse !== n.isAIResponse ||
      p.isWaiting !== n.isWaiting ||
      p.isTyping !== n.isTyping ||
      p.isError !== n.isError ||
      p.sender?.email !== n.sender?.email ||
      p.sender?.name !== n.sender?.name ||
      p.sender?.image !== n.sender?.image ||
      p.conversation?.isGroup !== n.conversation?.isGroup
    ) return false;
  }

  // 4) 부모에서 계산한 키/불린 비교
  if (
    prev.isLastOwnForThisMessage !== next.isLastOwnForThisMessage ||
    prev.liveUsersKey !== next.liveUsersKey ||
    prev.showDateDivider !== next.showDateDivider ||
    prev.isAIChat !== next.isAIChat ||
    prev.conversationId !== next.conversationId ||
    prev.currentUser?.email !== next.currentUser?.email
  ) return false;

  // 5) seenUsersForLastMessage 배열 내용 비교 (참조가 다를 때만)
  const prevSeen = prev.seenUsersForLastMessage ?? [];
  const nextSeen = next.seenUsersForLastMessage ?? [];
  if (prevSeen.length !== nextSeen.length) return false;
  // ✅ 빈 배열이면 바로 true 반환 (메모리 할당 방지)
  if (prevSeen.length === 0) return true;
  // ✅ 내용 비교는 필요할 때만 (Set 사용으로 더 효율적)
  const prevIdSet = new Set(prevSeen.map(u => String(u.id)));
  const nextIdSet = new Set(nextSeen.map(u => String(u.id)));
  if (prevIdSet.size !== nextIdSet.size) return false;
  for (const id of prevIdSet) {
    if (!nextIdSet.has(id)) return false;
  }

  return true;
};

const MessageView: React.FC<MessageBoxProps> = ({
  data,
  currentUser,
  conversationId,
  showDateDivider,
  isAIChat = false,
  seenUsersForLastMessage = [],
  isLastOwnForThisMessage,
  liveUsersKey,
}) => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { removeFailedMessage } = useFailedMessages(conversationId);
  const { isLoading: isConversationLoading } = useConversationLoading();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [seenUsers, setSeenUsers] = useState<SeenUser[]>([]);

  const sanitizedMessageBody = useMemo(() => {
    if (typeof window === 'undefined') {
      // SSR에서는 원본 텍스트 반환
      return data.body || '';
    }
    
    try {
      return DOMPurify.sanitize(data.body || '');
    } catch (error) {
      console.warn('DOMPurify 로드 실패:', error);
      return data.body || '';
    }
  }, [data.body]);
  
  const seenIdSetRef = useRef<Set<string>>(new Set());
  const [dots, setDots] = useState("");
  
  // 1) 멤버 Set을 문자열로 보관
  const liveIdSet = useMemo(() => {
    const ids = (liveUsersKey || "").split(",").filter(Boolean);
    return new Set(ids);
  }, [liveUsersKey]);

  // 2) 현재 사용자/발신자 id도 문자열화
  const currentUserId = useMemo(() => String(currentUser?.id ?? ""), [currentUser]);
  const senderId = useMemo(() => String(data?.sender?.id ?? ""), [data?.sender?.id]);
  const isAIMessage = useMemo(() => data.isAIResponse, [data.isAIResponse]);
  const isOwn = useMemo(() => !isAIMessage && currentUser?.email === data?.sender?.email,
    [isAIMessage, currentUser?.email, data?.sender?.email],
  );
  const isLastOwn = isLastOwnForThisMessage;

  const filteredSeenUsers = useMemo(() => {
    // ✅ 핵심: isLastOwnForThisMessage가 false면 무조건 빈 배열 반환
    if (!isLastOwnForThisMessage) {
      return [];
    }

    const server = (seenUsersForLastMessage ?? []).map(u => ({ ...u, id: String(u.id) }));
    const realtime = (seenUsers ?? []).map(u => ({ ...u, id: String(u.id) }));

    // ✅ 성능 개선: Set을 사용한 O(n) 병합 (some() 대신 Set.has 사용)
    const merged = [...server];
    const mergedIds = new Set(merged.map(u => u.id));
    
    for (const u of realtime) {
      if (!mergedIds.has(u.id)) {
        merged.push(u);
        mergedIds.add(u.id);
      }
    }

    // ✅ 성능 개선: Set을 사용한 필터링 (excludeSet 사용)
    const excludeSet = new Set([currentUserId, senderId].filter(Boolean));
    return merged.filter(u => !excludeSet.has(u.id));
  }, [isLastOwnForThisMessage, seenUsersForLastMessage, seenUsers, currentUserId, senderId]);


  // 3) 대화 참여자인지 여부 판정도 문자열 Set.has로
  const isConversationUser = useMemo(() => {
    const senderIdStr = String(data?.sender?.id ?? "");
    return liveIdSet.has(senderIdStr);
  }, [liveIdSet, data?.sender?.id]);

  const isWaiting = useMemo(() => data.isWaiting, [data.isWaiting]);
  const isError = useMemo(() => data.isError, [data.isError]);
  const isTyping = useMemo(() => data.isTyping, [data.isTyping]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const seenNames = useMemo(() => {
    const nameSet = new Set<string>();
    
    for (const u of filteredSeenUsers) {
      if (u.name) {  // Boolean 체크와 동시에 추가
        nameSet.add(u.name);
      }
    }
    
    return [...nameSet].join(", ");
  }, [filteredSeenUsers]);

  const showSeenTag = useMemo(() => {
    return isOwn && isLastOwn && filteredSeenUsers.length > 0;
  }, [isOwn, isLastOwn, filteredSeenUsers.length]);


  // 초기화: seenUsersForLastMessage를 seenUsers에 반영 (내 마지막 메시지일 때만)
  useEffect(() => {
    if (!isLastOwn || !seenUsersForLastMessage?.length) {
      setSeenUsers([]);
      seenIdSetRef.current.clear();
      return;
    }

    // ✅ 성능 개선: Set을 사용한 필터링 (excludeSet 사용)
    const excludeSet = new Set([currentUserId, senderId].filter(Boolean));
    const initial = seenUsersForLastMessage
      .map(u => ({ ...u, id: String(u.id) }))
      .filter(u => !excludeSet.has(u.id));

    if (initial.length === 0) {
      setSeenUsers([]);
      seenIdSetRef.current.clear();
      return;
    }

    // ✅ 새 집합과 기존 집합이 같은지 비교
    const nextSet = new Set(initial.map(u => u.id));
    const currSet = seenIdSetRef.current;
    if (nextSet.size === currSet.size && [...nextSet].every(id => currSet.has(id))) {
      return; // 동일 → 불필요한 setSeenUsers 방지
    }

    setSeenUsers(initial);
    seenIdSetRef.current = nextSet;
  }, [isLastOwn, currentUserId, senderId, liveIdSet, seenUsersForLastMessage, data.id]);
  
  // 새 컨텐츠 알림 (스크롤 트리거)
  const notifyNewContent = useCallback(() => {
    window.dispatchEvent(new CustomEvent("chat:new-content"));
  }, []);
  
  // AI 스트림 요청 훅
  const { requestAI } = useAIStream({ 
    conversationId, 
    aiAgentType: "assistant",
    onNewContent: notifyNewContent,
  });

  const { mutateAsync: resendMessage } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (responseData) => {
      // ✅ 서버 응답으로 메시지 교체 (createdAt 등 서버 데이터로 업데이트)
      replaceOptimisticMessage(
        queryClient,
        conversationId,
        data.id,
        responseData.newMessage,
        true // ✅ 재시도 시 재정렬 (시간 변경 반영)
      );
      
      // 재전송 성공 시 localStorage에서 제거
      removeFailedMessage(conversationId, data.id);
      
      // ✅ 성공 시에만 conversationList 업데이트 (로딩 상태 확인)
      if (!isConversationLoading) {
        bumpConversationOnNewMessage(queryClient, conversationId, {
          id: responseData.newMessage.id,
          clientMessageId: data.id, // ✅ 재전송 시 원본 ID로 중복 체크
          body: data.type === "image" ? null : (data.body || ""),
          type: normalizePreviewType(data.type),
          image: data.image || undefined,
          createdAt: responseData.newMessage.createdAt,
          isAIResponse: false,
        });
        
        // ✅ 재전송 성공 시 자동 스크롤 트리거
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent("chat:new-content"));
        });
      }
      
      // 소켓으로 메시지 브로드캐스트 (소켓 서버가 기대하는 구조로 전송)
      if (socket && responseData.newMessage) {
        // ✅ responseData.newMessage.conversation에서 참여자 정보 가져오기
        const conversation = responseData.newMessage.conversation;
        const userIds = conversation?.userIds || [];
        
        // 소켓 전송용 메시지 정규화 (FullMessageType 구조 보장)
        const socketMessage = normalizeMessage({
          ...responseData.newMessage,
          conversation: {
            isGroup: userIds.length > 2,
            userIds: userIds,
          }
        });
        socket.emit("send:message", {
          newMessage: socketMessage,
        });
      }
    },
    onError: () => {
      // 실패 시 다시 에러 상태로 표시
      updateMessagePartialById(queryClient, conversationId, data.id, {
        isError: true,
        isWaiting: false,
      });
    },
  });

  const handleRetry = useCallback(async () => {
    // 캐시에서 메시지 목록 조회
    const cache = queryClient.getQueryData(messagesKey(conversationId)) as | InfiniteData<MessagesPage> | undefined;
    const allMessages: FullMessageType[] = cache?.pages?.flatMap((p) => p.messages) ?? [];
    
    if (isAIMessage) {
      // AI 응답 재시도: 직전 사용자 메시지 찾기
      const idx = allMessages.findIndex((m) => m.id === data.id);
      let userMsg: FullMessageType | null = null;
      
      for (let i = idx - 1; i >= 0; i--) {
        if (!allMessages[i].isAIResponse && allMessages[i].body?.trim()) {
          userMsg = allMessages[i];
          break;
        }
      }
      
      if (!userMsg) {
        toast.error("재시도할 사용자 메시지를 찾을 수 없습니다.");
        return;
      }

      // ✅ 서버에 메시지를 재전송하지 않고 기존 메시지 기준으로 AI만 재요청
      const userCreatedAtToPass = userMsg.createdAt
        ? new Date(userMsg.createdAt)
        : new Date();
      
      await requestAI({
        userMessage: userMsg.body || "",
        userMessageId: userMsg.id,
        userCreatedAt: userCreatedAtToPass, // ✅ 기존 사용자 메시지 시간 전달
        isRetry: true,
        existingAIMessageId: data.id,
        currentUser: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
        } : undefined,
        conversation: data.conversation,
      });
    } else {
      // 일반 메시지 재전송
      updateMessagePartialById(queryClient, conversationId, data.id, {
        isError: false,
      });

      const result = await resendMessage({
        conversationId,
        data: data.body ? { message: data.body, type: "text" } : undefined,
        image: data.image || undefined,
        messageId: data.id,
      });
      
      // AI 채팅방이면 AI 응답도 요청
      if (isAIChat && data.body && currentUser) {
        // ✅ 현재 사용자 메시지 바로 다음의 AI 응답 찾기 (같은 쌍)
        const currentIndex = allMessages.findIndex((m) => m.id === data.id);
        let nextAIMessage: FullMessageType | undefined;
        
        // 바로 다음 메시지만 확인 (다른 사용자 메시지 전까지)
        if (currentIndex !== -1 && currentIndex + 1 < allMessages.length) {
          const nextMsg = allMessages[currentIndex + 1];
          if (nextMsg.isAIResponse) {
            nextAIMessage = nextMsg;
          }
        }
        
        requestAI({
          userMessage: data.body,
          userMessageId: data.id,
          userCreatedAt: result.newMessage.createdAt, // ✅ 서버 시간 전달
          isRetry: true,
          existingAIMessageId: nextAIMessage?.id, // ✅ 바로 다음 AI만
          currentUser: {
            id: currentUser?.id || data.sender.id,
            name: currentUser?.name,
            email: currentUser?.email,
            image: currentUser?.image,
          },
          conversation: data.conversation,
        });
      }
    }
  }, [
    isAIMessage,
    isAIChat,
    queryClient,
    conversationId,
    currentUser,
    data.id,
    data.body,
    data.image,
    data.conversation,
    data.sender,
    resendMessage,
    requestAI,
  ]);

  // read:state 핸들러
  const handleReadState = useCallback((payload: {
    conversationId: string;
    readerId: string;
    lastMessageId?: string;
    seenUsers?: Array<{ id: string; name: string | null; image: string | null }>;
  }) => {
    if (payload.conversationId !== conversationId) return;
    if (!isLastOwn) return;
    if (payload.lastMessageId && String(payload.lastMessageId) !== String(data.id)) return;

    const readerIdStr = String(payload.readerId);
    if (readerIdStr === currentUserId || readerIdStr === senderId) return;

    if (payload.seenUsers?.length) {
      const excludeSet = new Set([currentUserId, senderId].filter(Boolean));
      const filtered = payload.seenUsers
        .map(u => ({ id: String(u.id), name: u.name ?? "사용자", image: u.image ?? null }))
        .filter(u => !excludeSet.has(u.id));

      if (filtered.length) {
        setSeenUsers(prev => {
          const map = new Map(prev.map(u => [u.id, u]));
          for (const u of filtered) map.set(u.id, u);
          seenIdSetRef.current = new Set(map.keys());
          return Array.from(map.values());
        });
      }
    } else {
      // 단일 사용자 추가
      const base = seenUsersForLastMessage.find(u => String(u.id) === readerIdStr);
      const newUser = { id: readerIdStr, name: base?.name ?? "사용자", image: base?.image ?? null };
      
      if (seenIdSetRef.current.has(readerIdStr)) return;
      
      setSeenUsers(prev => {
        seenIdSetRef.current.add(readerIdStr);
        return [...prev, newUser];
      });
    }
  }, [conversationId, isLastOwn, data.id, currentUserId, senderId, seenUsersForLastMessage]);

  useEffect(() => {
    if (!socket) return;

    socket.off("read:state", handleReadState);
    socket.on("read:state", handleReadState);
    return () => {
      socket.off("read:state", handleReadState);
    };
  }, [socket, handleReadState]);

  // 대기 상태 애니메이션
  useEffect(() => {
    if (!isWaiting && !isTyping) {
      // ✅ 스트리밍이 끝나면 dots 초기화하여 불필요한 상태 변경 방지
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isWaiting, isTyping]);

  // ✅ 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);
  
  return data?.type === "system" ? (
    <div
      data-message-id={data.id}
      className="
        flex 
        justify-center
      "
    >
      <span
        className="
          px-6
          py-2
          mb-4
          bg-amber-400
          text-neutral-950
          text-sm
          rounded-full
        "
      >
        {data.body}
      </span>
    </div>
  ) : (
    <>
      {showDateDivider && (
        <div className="flex justify-center items-center my-4">
          <div className="px-4 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 rounded-full">
            {new Date(data.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </div>
        </div>
      )}
      <div
        data-message-id={data.id}
        className={clsx(
          "flex gap-3 p-4",
          isOwn && "justify-end",
        )}
      >
        <div className={clsx(isOwn && "order-2")}>
          <Avatar
            user={isConversationUser ? data.sender : noUserType}
            isOwn={isOwn}
            isAIChat={isAIMessage}
          />
        </div>
        <div
          className={clsx(
            "flex flex-col flex-1",
            isOwn && "items-end",
            data.type === "image" && "max-[360px]:w-full",
          )}
        >
          <div
            className={clsx(
              "text-sm w-fit overflow-hidden mb-2",
              isError
                ? "bg-red-100 border-l-4 border-red-400"
                : isAIMessage
                  ? "bg-gray-100"
                  : isOwn
                    ? "bg-sky-300"
                    : "bg-sky-100",
              data.type === "image"
                ? "max-[360px]:w-full rounded-md p-0"
                : "py-2 px-3 rounded-2xl",
            )}
          >
            {data.type === "image" && data.image && (
              <ImageModal
                src={data.image}
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
              />
            )}
            {data.type === "image" ? (
              <div className="max-[360px]:w-full w-[288px] h-[288px] relative">
                <FallbackNextImage
                  onClick={() => setImageModalOpen(true)}
                  src={data.image || ""}
                  alt="메시지 이미지"
                  fill
                  sizes="(max-width: 360px) 100vw, 288px"
                  priority={isLastOwn}
                  loading={isLastOwn ? "eager" : "lazy"}
                  className="
                    object-cover
                    cursor-pointer
                    hover:scale-110
                    transition
                    translate
                  "
                />
              </div>
            ) : (
              <div className="flex items-start gap-2">
                {isWaiting && isTyping && (
                  <div className="flex items-center gap-1">
                    <HiSparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span className="text-amber-500 font-medium">{dots}</span>
                  </div>
                )}
                <pre
                  className="whitespace-pre-wrap dark:text-neutral-950"
                  dangerouslySetInnerHTML={{
                    __html: sanitizedMessageBody,
                  }}
                />
              </div>
            )}
          </div>
          <div
            className={clsx(
              "flex items-baseline gap-1",
              isOwn && "justify-end",
            )}
          >
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              {isAIMessage
                ? "하이트진로 AI 어시스턴트"
                : isConversationUser
                  ? data.sender.name
                  : "(알 수 없음)"}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {new Date(data.createdAt).toLocaleString("ko-KR", {
                hour: "numeric",
                minute: "numeric",
              })}
            </div>
          </div>
          {showSeenTag && (
            <>
              <div
                className="
                  text-sm
                  font-light
                  text-neutral-500 dark:text-neutral-400
                "
              >
                읽음{(data.conversation?.isGroup && !!seenNames) && ` : ${seenNames}`}
              </div>
            </>
          )}
          {isError && (
            <div className="flex flex-row items-center mb-1">
              <HiExclamationTriangle className="w-4 h-4 text-red-500" />
              {(isOwn || isAIMessage) && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="text-sm text-red-600 underline ml-1"
                  aria-label="메시지 재전송"
                  title="메시지 재전송"
                >
                  재시도
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(MessageView, areEqual);
