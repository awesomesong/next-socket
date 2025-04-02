'use client';
import EmptyState from "@/src/app/components/EmptyState";
import useConversation from "../../hooks/useConversation";
import clsx from "clsx";
import useWindowSize from "../../hooks/useWindowSize";

const ChatConversationsPage = () => {
    const windowSize = useWindowSize();
    const { isOpen } = useConversation();

    return (
        <div className={clsx(`hidden 
                              grow 
                              lg:block
                            `,
                              isOpen ? 'block' : 'hidden',
                              windowSize.height && `h-[${windowSize.height}px]`
                            )}>
            <EmptyState message="대화방이나 멤버를 선택해주세요." />
        </div>
    );
}

export default ChatConversationsPage;
