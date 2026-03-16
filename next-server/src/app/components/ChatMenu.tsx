import { Tooltip } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import ChatUnReadCount from "./ChatUnReadCount";

const ChatMenu = () => {
    return (
        <>
            <Tooltip
                showArrow={false}
                content="채팅"
                size='lg'
                classNames={{
                    content: "bg-[var(--scent-gradient-mid)] text-[var(--bg-page)]",
                }}
            >
                <Link
                    href='/conversations'
                    title='채팅'
                    className='
                    fixed
                    right-6
                    bottom-6
                    z-50
                    w-[60px]
                    h-[60px]
                '
                >
                    <Image
                        src='/image/scent_memories_chat.png'
                        alt=''
                        fill
                        unoptimized={true}
                        priority={true}
                        className="object-cover"
                    />
                    <ChatUnReadCount className="absolute -right-1 -top-1" />
                </Link>
            </Tooltip>
        </>
    )
}

export default ChatMenu
