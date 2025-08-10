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
import FallbackNextImage from "@/src/app/components/FallbackNextImage";
import DOMPurify from "dompurify";
import { useSocket } from "../../context/socketContext";
import { MessageSeenInfo } from "../../types/socket";
import { isAtBottom } from "../../utils/isAtBottom";
import { HiSparkles } from "react-icons/hi2";
import { HiExclamationTriangle } from "react-icons/hi2";

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
  const isWaiting = (data as any).isWaiting; // 대기 상태
  const isError = (data as any).isError; // 오류 상태
  const isTyping = (data as any).isTyping; // 타이핑 상태
  const bottomRef = useRef<HTMLDivElement>(null);

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
        queryClient.invalidateQueries({ queryKey: ['conversationList'] });
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
                <div className="flex items-center gap-2">
                  {isWaiting && (
                    <HiSparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  )}
                  {isError && (
                    <HiExclamationTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <pre 
                    className="whitespace-pre-wrap dark:text-neutral-950"
                    dangerouslySetInnerHTML={{ __html : DOMPurify.sanitize(data.body || '') }} 
                  />
                  {isWaiting && (
                    <span className="text-amber-500 font-medium">
                      {dots}
                    </span>
                  )}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-4 bg-amber-500 animate-pulse ml-1"></span>
                  )}
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
