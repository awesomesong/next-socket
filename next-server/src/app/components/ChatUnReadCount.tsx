'use client';
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { formatMessageCount } from "@/src/app/utils/formatMessageCount";
import clsx from "clsx";

type Props = {
    size?: 'mobile-small';
    className?: string;
}

const ChatUnReadCount = ({ size, className }: Props) => {
    const { unReadCount } = useUnreadStore();

    if (!unReadCount) return null;

    return (
        <span className={clsx(
            "unread-badge",
            size === 'mobile-small' && "max-md:text-[12px]",
            className,
        )}>
            {formatMessageCount(unReadCount)}
        </span>
    )
}

export default ChatUnReadCount;
