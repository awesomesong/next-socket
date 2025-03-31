'use client';
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { formatMessageCount } from "@/src/app/utils/formatMessageCount";
import { socket } from "@/src/socket";
import { useEffect } from "react";

const ChatUnReadCount = () => {
    const { unreadCount }= useUnreadStore();

    useEffect(() => {

    }, [ socket ]);

    return (
        <>
            {unreadCount > 0 &&
                <span className="
                    absolute 
                    md:-left-[2px]
                    md:-top-[3px]
                    max-md:top-[6px]
                    max-md:left-[37%]
                    max-md:text-[11px]
                    max-[420px]:left-[21%]
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
                ">
                    {formatMessageCount(unreadCount)}
                </span>
            }
        </>
    )
}

export default ChatUnReadCount;
