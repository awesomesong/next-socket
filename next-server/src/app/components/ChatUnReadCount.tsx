'use client';
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { formatMessageCount } from "@/src/app/utils/formatMessageCount";
import clsx from "clsx";

type Props = {
    size?: 'mobile-small';
}

const ChatUnReadCount = ({ size }: Props) => {
    const { unReadCount } = useUnreadStore();

    if (!unReadCount) return null;

    return (
        <span className={clsx(
            "unread-badge",
            "absolute -right-[2px] -top-[2px]",
            size === 'mobile-small' && `
                max-md:top-0
                max-md:right-0
                max-md:text-[11px]
        `)}>
            {formatMessageCount(unReadCount)}
        </span>
    )
}

export default ChatUnReadCount;
