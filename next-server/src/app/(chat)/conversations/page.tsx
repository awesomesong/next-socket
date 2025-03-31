'use client';
import EmptyState from "@/src/app/components/EmptyState";
import useConversation from "../../hooks/useConversation";
import clsx from "clsx";

const ChatConversationsPage = () => {
    const { isOpen } = useConversation();

    return (
        <div className={clsx(`hidden 
                              h-full 
                              grow 
                              lg:block
                            `,
                              isOpen ? 'block' : 'hidden'
                            )}>
            <EmptyState message="대화방이나 멤버를 선택해주세요." />
        </div>
    );
}

export default ChatConversationsPage;
