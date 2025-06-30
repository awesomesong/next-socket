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
            <EmptyState message="대화방이나 멤버를 선택하면 하이트 톡톡이 시작됩니다." />
        </div>
    );
}

export default ChatConversationsPage;
