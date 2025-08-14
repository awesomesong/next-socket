'use client';
import { useEffect, useRef, useState } from "react";
import Avatar from "@/src/app/components/Avatar";
import ImageModal from "@/src/app/components/ImageModal";
import { FullMessageType } from "@/src/app/types/conversation";
import clsx from "clsx";
import { DefaultSession } from "next-auth";
import { arraysEqualUnordered } from "@/src/app/utils/arraysEqualUnordered";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seenMessages } from "@/src/app/lib/seenMessages";
import { sendMessage } from "@/src/app/lib/sendMessage";
import FallbackNextImage from "@/src/app/components/FallbackNextImage";
import DOMPurify from "dompurify";
import { useSocket } from "../../context/socketContext";
import { MessageSeenInfo } from "../../types/socket";
import { isAtBottom } from "../../utils/isAtBottom";
import { HiExclamationTriangle, HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";

interface MessageBoxProps {
  data: FullMessageType;
  isLast?: boolean;
  currentUser: DefaultSession["user"];
  conversationId: string;
  showDateDivider?: boolean;
}

const noUserType = {
  image: 'None',
  id: null,
  email: null,
  name: null
}

const MessageView:React.FC<MessageBoxProps> = ({
  data,
  isLast,
  currentUser,
  conversationId,
  showDateDivider
}) => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [seenUser, setSeenUser ] = useState(data.seen || []);
  const [seenListName, setSeenListName] = useState("");
  const [showSeenTag, setShowSeenTag] = useState(false);
  const [dots, setDots] = useState('');
  const isAIMessage = data.isAIResponse;
  const isOwn = isAIMessage ? false : currentUser?.email === data?.sender?.email ? true : false;
  const isConversationUser = data.conversation?.userIds?.includes(data?.sender?.id);
  const isWaiting = (data as any).isWaiting; // 대기 상태 (일반 메시지는 사용 안함)
  const isError = (data as any).isError; // 오류 상태
  const isTyping = (data as any).isTyping; // 타이핑 상태
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    mutate: resendMessage,
  } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      if (socket) socket.emit('send:message', data);
    },
    onError: (_error) => {
      // 실패 시 다시 에러 상태로 표시
      queryClient.setQueriesData(
        { queryKey: ['messages', conversationId] },
        (old: any) => {
          if (!old) return old;
          const newPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
            ...page,
            messages: page.messages.map((msg: any) =>
              msg.id === data.id ? { ...msg, isError: true, isWaiting: false } : msg
            )
          }));
          return { ...old, pages: newPages };
        }
      );
    }
  });

  const handleRetry = () => {
    if (isAIMessage) {
      // AI 응답 재시도: 직전 사용자 메시지를 찾아 그 내용으로 스트림 재요청
      const cache: any = queryClient.getQueryData(['messages', conversationId]);
      const allMessages: FullMessageType[] = cache?.pages?.flatMap((p: any) => p.messages) ?? [];
      const idx = allMessages.findIndex((m) => m.id === data.id);
      let prompt: string | null = null;
      for (let i = idx - 1; i >= 0; i--) {
        const m = allMessages[i] as any;
        if (!m?.isAIResponse && typeof m?.body === 'string' && m?.body?.length > 0) {
          prompt = m.body as string;
          break;
        }
      }
      if (!prompt) {
        toast.error('재시도할 사용자 메시지를 찾을 수 없습니다.');
        return;
      }

      // 에러 해제 및 대기/타이핑 표시
      queryClient.setQueriesData(
        { queryKey: ['messages', conversationId] },
        (old: any) => {
          if (!old) return old;
          const newPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
            ...page,
            messages: page.messages.map((msg: any) =>
              msg.id === data.id ? { ...msg, isError: false, isWaiting: true, isTyping: true, body: 'AI가 응답을 준비 중입니다.' } : msg
            )
          }));
          return { ...old, pages: newPages };
        }
      );

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 60000);
      const decoder = new TextDecoder();
      let fullResponse = '';
      let isStreamingComplete = false;

      fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          conversationId,
          aiAgentType: 'assistant',
          messageId: data.id,
          autoSave: true,
        }),
        signal: abortController.signal,
      })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`AI 응답 생성 중 오류가 발생했습니다. (${response.status}: ${errorText})`);
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error('스트리밍 응답을 읽을 수 없습니다.');

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const payload = line.slice(6);
                if (payload === '[DONE]') { isStreamingComplete = true; break; }
                try {
                  const parsed = JSON.parse(payload);
                  const content = parsed.content;
                  if (content && typeof content === 'string') {
                    fullResponse += content;
                    queryClient.setQueriesData(
                      { queryKey: ['messages', conversationId] },
                      (old: any) => {
                        if (!old) return old;
                        const newPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
                          ...page,
                          messages: page.messages.map((msg: any) =>
                            msg.id === data.id ? { ...msg, body: fullResponse, isWaiting: false, isTyping: true } : msg
                          )
                        }));
                        return { ...old, pages: newPages };
                      }
                    );
                  }
                } catch (_e) {
                  // ignore parse errors during stream
                }
              }
            }
            if (isStreamingComplete) break;
          }
        } finally {
          reader.releaseLock();
        }

        // 완료 처리
        queryClient.setQueriesData(
          { queryKey: ['messages', conversationId] },
          (old: any) => {
            if (!old) return old;
            const newPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
              ...page,
              messages: page.messages.map((msg: any) =>
                msg.id === data.id ? { ...msg, isTyping: false, isWaiting: false } : msg
              )
            }));
            return { ...old, pages: newPages };
          }
        );
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          toast.error('AI 응답 시간이 초과되었습니다. 다시 시도해주세요.');
        } else {
          toast.error('AI 응답 생성 중 오류가 발생했습니다.');
        }
        queryClient.setQueriesData(
          { queryKey: ['messages', conversationId] },
          (old: any) => {
            if (!old) return old;
            const newPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
              ...page,
              messages: page.messages.map((msg: any) =>
                msg.id === data.id ? { ...msg, body: 'AI 응답 실패. 위의 버튼을 눌러 재시도하세요.', isError: true, isTyping: false, isWaiting: false } : msg
              )
            }));
            return { ...old, pages: newPages };
          }
        );
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });
    } else {
      // 일반 메시지 재전송: 에러 해제 후 재전송
      queryClient.setQueriesData(
        { queryKey: ['messages', conversationId] },
        (old: any) => {
          if (!old) return old;
          const newPages = old.pages.map((page: { messages: FullMessageType[] }) => ({
            ...page,
            messages: page.messages.map((msg: any) =>
              msg.id === data.id ? { ...msg, isError: false } : msg
            )
          }));
          return { ...old, pages: newPages };
        }
      );

      resendMessage({
        conversationId,
        data: data.body ? { message: data.body } : undefined,
        image: data.image || undefined,
        messageId: data.id,
      });
    }
  };

  const { 
    mutate: seenMessageMutation, 
    data: seenMessageUser 
  }  = useMutation({
      mutationFn: seenMessages,
      onSuccess: (data) => {
        if (socket && data?.seenMessageUser && currentUser?.email) {
          socket.emit("seen:message", {
            seenMessageUser: data.seenMessageUser,
            userEmail: currentUser.email,
          });
        }
        // ✅ 메시지 읽음 처리 시 conversationList 쿼리 무효화
        queryClient.setQueryData(['conversationList'], (old: any) => {
          if (!old?.conversations) return old;
          const conversations = old.conversations.map((c: any) =>
            c.id === conversationId ? { ...c, unReadCount: 0 } : c
          );
          return { conversations };
        });
      }
  });

  // 마지막 메시지 확인
  useEffect(() => {
    const messageId = data.id;
    if ( messageId 
        && data.sender.email !== currentUser?.email
        && isLast
    ) {
      seenMessageMutation({ conversationId, messageId });
    }
  }, [isLast, data.id, conversationId, data.sender.email, currentUser?.email, seenMessageMutation]);

  // 마지막 메시지를 확인한 사용자 이름 리스트
  useEffect(() => {
    if(!isLast || seenUser.length <= 1) return;

    const filteredSeenList = (seenUser || [])
      .filter((user) => 
        user.email !== data?.sender?.email && 
        user.email !== currentUser?.email
      )
      
    const updatedSeenList = filteredSeenList.map(user => user.name).join(', ');
    setSeenListName(updatedSeenList);
    setShowSeenTag(filteredSeenList.length >= 1); // 1:1에서 상대방 1명만 읽어도 표시
  }, [seenUser, isLast, data?.sender?.email, currentUser?.email]);

  // 스크롤 맨아래에서 메시지를 읽은 사용자가 있으면, 아래로 스크롤 내려가게 설정
  useEffect(() => {
    if (!isLast || seenUser.length <= 1 || !showSeenTag || !bottomRef.current) return;
    const messageContainer = bottomRef.current.parentElement as HTMLElement | null;
    if (isAtBottom(messageContainer)) {
      requestAnimationFrame(() => {
        if (bottomRef.current) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      });
    }
  }, [showSeenTag]);  

  useEffect(() => {
    if(!socket) return;

    const handleSeenUser = (payload: MessageSeenInfo) => {
      const { conversationId: conId, seen } = payload;

      // 변경 사항이 있는 경우에만 처리
      const hasChanged = !arraysEqualUnordered(seen, seenUser);

      if (hasChanged) {
        setSeenUser(seen); // ✅ 메시지 하단 "읽음" 표시 갱신
      }
    }

    socket.on("seen:user", handleSeenUser);
    return () => {
      socket.off("seen:user", handleSeenUser);
    }
  }, [socket, seenUser]);

  // 대기 상태 애니메이션
  useEffect(() => {
    if (!isWaiting && !isTyping) return;
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isWaiting, isTyping]);

  return (
    data?.type === 'system' 
      ? 
      (<div 
        data-message-id={data.id}
        className="
        flex 
        justify-center
      ">
        <span className="
          px-6
          py-2
          mb-4
          bg-amber-400
          text-neutral-950
          text-sm
          rounded-full
        ">
          {data.body}
        </span>
      </div>)
      : (
      <>
        {showDateDivider && (
          <div className="flex justify-center items-center my-4">
            <div className="px-4 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 rounded-full">
              {new Date(data.createdAt).toLocaleDateString("ko-KR", {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>
        )}
        <div 
          data-message-id={data.id}
          className={clsx(
            "flex gap-3 p-4",
            isOwn && !isAIMessage && "justify-end"
        )} >
          <div className={clsx(isOwn && !isAIMessage && "order-2")}>
            <Avatar 
              user={isConversationUser ? data.sender : noUserType} 
              isOwn={isOwn && !isAIMessage} 
              isAIChat={isAIMessage}
            />
          </div>
          <div className={clsx(
            "flex flex-col flex-1",
            isOwn && !isAIMessage && "items-end",
            data.image && 'max-[360px]:w-full'
          )}>
            {isError && (
              <div className="flex flex-row items-center mb-1">
                <HiExclamationTriangle className="w-4 h-4 text-red-500" />
                {(isOwn || isAIMessage) && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-sm text-red-600 underline ml-1"
                  >
                    재시도
                  </button>
                )}
              </div>
            )}
            <div className={clsx(
              "text-sm w-fit overflow-hidden mb-2",
              isError ? 'bg-red-100 border-l-4 border-red-400' :
              isAIMessage ? 'bg-gray-100' : 
              isOwn ? 'bg-sky-300' : 'bg-sky-100',
              data.image ? 'max-[360px]:w-full rounded-md p-0' : 'py-2 px-3 rounded-2xl'
            )}>
              {data.image && <ImageModal
                src={data.image}
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
              />}
              {data.image ? (
                <div className="max-[360px]:w-full w-[288px] h-[288px] relative">
                  <FallbackNextImage
                    onClick={() => setImageModalOpen(true)}
                    src={data.image}
                    alt=""
                    fill
                    sizes="288"
                    priority={true}
                    className="
                      object-cover
                      cursor-pointer
                      hover:scale-110
                      transition
                      translate
                    "
                  />
                </div>
              ): (
                <div className="flex items-start gap-2">
                  {(isWaiting && isTyping) && (
                    <div className="flex items-center gap-1">
                      <HiSparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-amber-500 font-medium">
                        {dots}
                      </span>
                    </div>
                  )}
                  <pre 
                    className="whitespace-pre-wrap dark:text-neutral-950"
                    dangerouslySetInnerHTML={{ __html : DOMPurify.sanitize(data.body || '') }} 
                  />
                </div>
              )}
            </div>
            <div className={clsx("flex items-baseline gap-1" ,
                isOwn && 'justify-end',
            )}>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                {isAIMessage ? '하이트진로 AI 어시스턴트' : isConversationUser ? data.sender.name : '(알 수 없음)'}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {new Date(data.createdAt).toLocaleString("ko-KR", 
                  {
                    hour: "numeric",
                    minute: "numeric",
                })}
              </div>
            </div>
            { isLast && isOwn && showSeenTag && (
              <>
                <div className="
                  text-sm
                  font-light
                  text-neutral-500 dark:text-neutral-400
                ">
                  읽음{data.conversation?.isGroup ? ` : ${seenListName}`: ''}
                </div>
              </>
              )}
          </div>
        </div>
        { isLast && isOwn && showSeenTag 
          && (<div ref={bottomRef} className="bottom"/>)
        }
      </>
      )
    )
}

export default MessageView;
