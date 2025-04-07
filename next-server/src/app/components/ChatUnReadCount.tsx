'use client';
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { formatMessageCount } from "@/src/app/utils/formatMessageCount";
import clsx from "clsx";
import { useEffect, useState } from "react";

type Props = {
    size?: 'mobile-small';
}

const ChatUnReadCount = ({ size }: Props) => {
    const [ chatUnReafCount, setChatUnReafCount] = useState(0);
    const { unreadCount }= useUnreadStore();

    useEffect(() => {
        setChatUnReafCount(unreadCount);
    }, [unreadCount]);

    return (
        <>
            {chatUnReafCount > 0 &&
                <span className={clsx(`
                        absolute 
                        md:-left-[2px]
                        md:-top-[3px]
                        inline-flex 
                        justify-center 
                        items-center
                        w-fit 
                        px-2
                        py-1 
                        bg-red-500 
                        text-neutral-50 
                        rounded-full 
                        leading-none 
                    `,
                    size === 'mobile-small' && `
                        max-md:top-[6px]
                        max-md:left-[37%]
                        max-md:text-[11px]
                        max-[420px]:left-[21%]
                `)}>
                    {formatMessageCount(unreadCount)}
                </span>
            }
        </>
    )
}

export default ChatUnReadCount;
