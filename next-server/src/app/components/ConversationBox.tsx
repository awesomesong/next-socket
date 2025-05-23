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
    const { conversationId } = useConversation();
    const { otherUser } = useOtherUser(data, currentUser);
    const router = useRouter();

    const handleClick = useCallback(() => {
        router.push(`/conversations/${data.id}`);
    }, [router, data.id]);

    const unReadMessageLength = data.unreadCount ?? 0;

    const userEmail = currentUser?.email;

    const lastMessage = data.messages?.[0] ?? null;

    const hasSeen = useMemo(() => {
        if(!lastMessage || !userEmail) return false;
        return lastMessage.seen?.some((user) => user.email === userEmail) ?? false;
    }, [userEmail, lastMessage]);

    const lastMessageText = useMemo(() => {
        if(lastMessage?.type === 'system') return;
        if(lastMessage?.image) return '사진을 보냈습니다.';
        if(lastMessage?.body) return lastMessage.body;
        return '대화방이 생성되었습니다.'
    }, [lastMessage]);

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
            data.userIds?.length < 2 && 'opacity-40',
            selected ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-white dark:bg-neutral-900'
        )}
        >   
            {data.isGroup && data.userIds?.length > 2? (
                <AvatarGroup users={data.users} />
            ): ( 
                <div className="m-1">
                    <Avatar user={otherUser} /> 
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
                            {data.name || otherUser.name }
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
                            hasSeen || conversationId || !lastMessage || lastMessage.type === 'system' 
                                ? 'font-normal' : 'font-bold'
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
