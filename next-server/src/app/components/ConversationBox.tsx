'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FullConversationType, MessageType } from "@/src/app/types/conversation";
import useOtherUser from "@/src/app/hooks/useOtherUser";
import Avatar from "./Avatar";
import AvatarGroup from "./AvatarGroup";
import useConversation from "@/src/app/hooks/useConversation";
import { formatDate } from "@/src/app/utils/formatDate";
import { IUserList } from "@/src/app/types/common";

interface ConversationBoxProps {
    data: FullConversationType;
    selected?: boolean;
    currentUser: IUserList | undefined;
}

const ConversationBox:React.FC<ConversationBoxProps> = ({
    data,
    selected,
    currentUser
}) => {
    const { otherUser } = useOtherUser(data, currentUser);
    const router = useRouter();

    const handleClick = useCallback(() => {
        router.push(`/conversations/${data.id}`);
    }, [router, data.id]);

    const unReadMessageLength = data.unReadCount ?? 0;

    const lastMessage = data.messages?.[0] ?? null;

    const lastMessageText = useMemo(() => {
        // AI 채팅방인 경우 마지막 메시지 요약 표시
        if (data.isAIChat) {            
            // AI 채팅방의 마지막 메시지 찾기 (최신 메시지가 첫 번째)
            const lastMessage = data.messages?.[0];
            
            if (lastMessage?.body) {
                // 메시지가 길면 요약
                const message = lastMessage.body;
                
                if (message.length > 30) {
                    return `${message.substring(0, 30)}...`;
                }
                return message;
            }
            
            return "하이트진로 AI 어시스턴트와 대화해보세요. 술에 대한 질문이나 추천을 받을 수 있습니다.";
        }
        // 시스템 메시지는 리스트 미리보기에서 숨김 처리(서버에서도 제외되지만 가드)
        if(lastMessage?.type === 'system') return undefined;
        if(lastMessage?.type === 'image') return '사진을 보냈습니다.';
        if(lastMessage?.body) return lastMessage.body;
        return '대화방이 생성되었습니다.'
    }, [lastMessage, data.isAIChat, data.messages]);

    return (
        <div
            onClick={handleClick}
            className={clsx(`
                relative
                flex
                items-center
                space-x-3
                p-3
                hover:bg-neutral-100
                hover:dark:bg-neutral-800
                transition
                cursor-pointer
            `,
            (!data.isAIChat && data.userIds?.length < 2) && 'opacity-40',
            selected ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-white dark:bg-neutral-900'
        )}
        >   
            {data.isGroup && data.userIds?.length > 2? (
                <AvatarGroup users={data.users} />
            ): ( 
                <div className="m-1">
                    <Avatar user={otherUser} isAIChat={!!data.isAIChat} /> 
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                <div className="focus:outline-none">
                    <div
                        className="
                            flex
                            justify-between
                            items-center
                            gap-2
                        "
                    >
                        <p
                            className="
                                truncate
                                text-md
                                font-medium
                            "
                        >
                            {data.isAIChat ? "하이트진로 AI 어시스턴트" : (data.name || otherUser.name)}
                            {data.isGroup && <span className="ml-2 text-neutral-500">{data.userIds?.length}</span>}
                        </p>
                        {lastMessage?.createdAt && (
                            <p
                                className="
                                    shrink-0
                                    text-xs
                                    font-light
                                "
                            >
                                {formatDate(lastMessage.createdAt)}
                            </p>
                        )}
                    </div>
                    <div
                        className="
                            flex
                            justify-between
                            items-center
                            gap-2
                        "
                    >
                        <p
                            className={clsx(`
                                truncate
                                text-neutral-600 
                                dark:text-neutral-400
                            `,
                            (!selected && unReadMessageLength > 0) ? 'font-bold' : 'font-normal'
                        )}
                        >
                            {lastMessageText}
                        </p>
                        {!selected && unReadMessageLength > 0 && 
                            <p className="
                                inline-flex
                                justify-center
                                items-center
                                shrink-0
                                px-2
                                py-1
                                bg-red-500
                                text-neutral-50
                                rounded-full
                                leading-none
                            ">
                                {unReadMessageLength}
                        </p>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConversationBox;
