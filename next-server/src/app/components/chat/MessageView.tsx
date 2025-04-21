'use client';
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/src/app/components/Avatar";
import ImageModal from "@/src/app/components/ImageModal";
import { FullMessageType } from "@/src/app/types/conversation";
import clsx from "clsx";
import { DefaultSession } from "next-auth";
import { arraysEqualUnordered } from "@/src/app/utils/arraysEqualUnordered";
import { useMutation } from "@tanstack/react-query";
import { seenMessages } from "@/src/app/lib/seenMessages";
import FallbackNextImage from "@/src/app/components/FallbackNextImage";
import DOMPurify from "dompurify";
import { useSocket } from "../../context/socketContext";

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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [seenUser, setSeenUser ] = useState(data.seen || []);
  const [seenListName, setSeenListName] = useState("");
  const isOwn = currentUser?.email === data?.sender?.email ? true : false;
  const isConversationUser = data.conversation?.userIds?.includes(data?.sender?.id)
  const bottomRef = useRef<HTMLDivElement>(null);

  const { 
    mutate: seenMessageMutation, 
    data: seenMessageUser 
  }  = useMutation({
      mutationFn: seenMessages,
      onSuccess: (data) => {
          if(data.seenMessageUser.seen.length > 1 && socket) {
            socket.emit('seen:message', { seenMessageUser: data.seenMessageUser });
          }
      },
  });

  // 마지막 메시지 확인
  useEffect(() => {
    const messageId = data.id;
    if ( messageId 
        &&!messageId.startsWith('optimistic-')
        && isLast
    ) {
      seenMessageMutation({ conversationId, messageId });
    }
  }, [isLast, data.id, conversationId]);

  // 마지막 메시지를 확인한 사용자 이름 리스트
  useEffect(() => {
    if(!isLast || seenUser.length <= 1) return;

    const updatedSeenList = (seenUser || [])
      .filter((user) => user.email !== data?.sender?.email)
      .map((user) => user.name)
      .join(', ');
  
    setSeenListName(updatedSeenList);
  }, [seenUser]);

  // 스크롤 맨아래에서 메시지를 읽은 사용자가 있으면, 아래로 스크롤 내려가게 설정
  useEffect(() => {
    if (!isLast || seenUser.length <= 1 || !seenListName || !bottomRef.current) return;
  
    // 현재 스크롤이 맨 아래인지 확인
    const messageContainer = bottomRef.current.parentElement; // 메시지를 감싸는 부모 컨테이너
    if (!messageContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = messageContainer;
  
    const scrollDiff = Math.abs(scrollHeight - clientHeight - scrollTop); 
    const isAtBottom = scrollDiff <= 100; 
  
    // 스크롤이 이미 맨 아래에 있을 때만 자동 이동
    if (isAtBottom) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }, [seenListName]);  

  useEffect(() => {
    if(!socket) return;

    socket.on("seen:user", (seenMessageUser) => {
      const seenUsers = !arraysEqualUnordered(seenMessageUser.seen, seenUser) && seenMessageUser.seen > seenUser ? seenMessageUser.seen : seenUser;
      setSeenUser(seenUsers);
    });
    return () => {
      socket.off("seen:user");
    }
  }, [socket]);

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
            isOwn && "justify-end"
        )} >
          <div className={clsx(isOwn && "order-2")}>
            <Avatar user={isConversationUser ? data.sender : noUserType} isOwn={isOwn} />
          </div>
          <div className={clsx(
            "flex flex-col flex-1",
            isOwn && "items-end",
            data.image && 'max-[360px]:w-full'
          )}>
            <div className={clsx(
              "text-sm w-fit overflow-hidden mb-2",
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
                <pre 
                  className="whitespace-pre-wrap dark:text-neutral-950"
                   dangerouslySetInnerHTML={{ __html : DOMPurify.sanitize(data.body || '') }} 
                />
              )}
            </div>
            <div className={clsx("flex items-baseline gap-1" ,
                isOwn && 'justify-end',
            )}>
              <div className="text-sm text-neutral-700 dark:text-neutral-300">
                {isConversationUser ? data.sender.name : '(알 수 없음)'}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {new Date(data.createdAt).toLocaleString("ko-KR", 
                  {
                    hour: "numeric",
                    minute: "numeric",
                })}
              </div>
            </div>
            { isLast && isOwn && seenListName.length > 1 && (
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
        { isLast && isOwn && seenListName.length > 1 
          && (<div ref={bottomRef} className="bottom"/>)
        }
      </>
      )
    )
}

export default MessageView;
