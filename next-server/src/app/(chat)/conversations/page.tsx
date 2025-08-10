'use client';
import EmptyState from "@/src/app/components/EmptyState";
import useConversation from "../../hooks/useConversation";
import clsx from "clsx";

const ChatConversationsPage = () => {
    const { isOpen } = useConversation();

    return (
        <div className={clsx(`hidden
                              grow
                              lg:block
                            `,
                              isOpen ? 'block' : 'hidden',
                            )}>
            <div className="flex flex-col items-center justify-center h-full space-y-6">
                <EmptyState message="대화방이나 멤버를 선택하면 채팅이 시작됩니다." />
            </div>
        </div>
    );
}

export default ChatConversationsPage;
