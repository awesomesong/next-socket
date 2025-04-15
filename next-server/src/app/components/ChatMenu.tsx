import { Tooltip } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import ChatUnReadCount from "./ChatUnReadCount";
import SocketState from "./SocketState";

const ChatMenu = () => {
  return (
    <>
        <SocketState />
        <Tooltip
            showArrow={true} 
            content="채팅"
            size='lg'
        >
            <Link 
                href='/conversations'
                title='채팅'
                className='
                    fixed
                    right-10
                    bottom-12
                    z-50
                    w-[70px]
                    h-[70px]
                '
            > 
                <Image 
                    src='/image/chat.png'
                    alt=''
                    fill
                    unoptimized={true}
                    priority={true}
                    className="object-cover"
                />
                <ChatUnReadCount />
            </Link>
        </Tooltip>
    </>
  )
}

export default ChatMenu
