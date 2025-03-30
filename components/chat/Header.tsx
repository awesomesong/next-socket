'use client';
import Avatar from "@/components/Avatar";
import useOtherUser from "@/src/app/hooks/useOtherUser";
import { Conversation, User } from "@prisma/client";
import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2";
import { DefaultSession } from "next-auth";
import ProfileDrawer from "./ProfileDrawer";
import AvatarGroup from "@/components/AvatarGroup";
import useActiveList from "@/src/app/hooks/useActiveList";
import useConversationUserList from "@/src/app/hooks/useConversationUserList";

interface HeaderProps {
    conversation: Conversation & {
        users: User[]
    };
    currentUser: DefaultSession["user"];
};

const Header:React.FC<HeaderProps> = ({
    conversation,
    currentUser
}) => {
    const { otherUser } = useOtherUser(conversation, currentUser);
    const [ isDrawerOepn, setIsDrawerOpen ] = useState(false);
    const { add, conversationUsers } = useConversationUserList();

    const { members } = useActiveList();
    const isActive = useMemo(() => {
        return otherUser.email === 'None' ? 'None' : members.includes(otherUser?.email!);
    }, [otherUser, members]);

    const statusText = useMemo(() => {
        if(conversation?.isGroup) return `${conversation.users.length} 명`;

        return isActive === 'None' ? '' : isActive ? '활성화' : '비활성화';
    }, [conversation, isActive]);

    useEffect(() => { 
        if(conversation?.userIds.length > 1) {
            add({ conversationId: conversation?.id, userIds: conversation?.userIds });
        }
    }, [conversation, add]);

    return (
        <>
            <ProfileDrawer
                data={conversation}
                otherUser={otherUser}
                isOpen={isDrawerOepn}
                onClose={() => setIsDrawerOpen(false)}
            />
            <div
                className="
                    flex
                    justify-between
                    items-center
                    gap-2
                    w-full
                    py-3
                    px-2
                    sm:px-4
                    bg-default
                    border-b-default
                    shadow-sm
                "
            >
                <div className="flex gap-3 items-center">
                    <Link 
                        href="/conversations"
                        className="
                            lg:hidden
                            block
                            text-sky-500
                            hover:text-sky-600
                            transition
                            cursor-pointer
                        "    
                    >
                        <HiChevronLeft size={32} />
                    </Link>
                    <div className="shrink">
                        {conversation?.isGroup && conversation.userIds.length > 2? (
                            <AvatarGroup users={conversation.users} />
                        ) : (
                            <Avatar user={otherUser} />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="line-clamp-2">
                            {conversation?.name || otherUser.name}
                        </div>
                        <div 
                            className="
                                text-sm
                                font-light
                                text-neutral-500
                            "
                        >
                            {statusText}
                        </div>
                    </div>
                </div>
                <HiEllipsisHorizontal 
                    size={32}
                    onClick={() => setIsDrawerOpen(true)}
                    className="
                        shrink-0
                        w-8
                        h-8
                        text-sky-500
                        cursor-pointer
                        hover:text-sky-600
                        transition
                    "
                />
            </div>
        </>
    )
}

export default memo(Header);
