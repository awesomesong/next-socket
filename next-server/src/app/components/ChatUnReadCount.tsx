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
        <span className={clsx(`
                absolute 
                md:-left-[2px]
                md:-top-[3px]
                inline-flex 
                justify-center 
                items-center
                w-fit 
                px-2
                bg-red-500 
                text-neutral-50 
                rounded-full 
            `,
            size === 'mobile-small' && `
                max-md:top-[6px]
                max-md:left-[37%]
                max-md:text-[11px]
                max-[420px]:left-[21%]
        `)}>
            {formatMessageCount(unReadCount)}
        </span>
    )
}

export default ChatUnReadCount;
