import { Tooltip } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import ChatUnReadCount from "./ChatUnReadCount";

const ChatMenu = () => {
  return (
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
                bottom-10
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
  )
}

export default ChatMenu
