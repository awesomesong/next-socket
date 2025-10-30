import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HiChat } from 'react-icons/hi';
import { HiUser} from "react-icons/hi2";
import { IoHomeSharp } from "react-icons/io5";
import { RiLogoutBoxFill } from "react-icons/ri";
import useConversation from "./useConversation";
import { signOut } from "next-auth/react";

const useRouterChat = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { conversationId } = useConversation();

    const routerChat = useMemo(() => [
        {
            label: '채팅 멤버',
            href: '/chatMember',
            icon: HiUser,
            active: pathname === '/chatMember'
        },
        {
            label: '채팅',
            href: '/conversations',
            icon: HiChat,
            active: pathname === '/conversations' || !!conversationId
        },
        {
            label: '강송희 홈페이지',
            href: '/',
            onClick: () => router.push('/'),
            icon: IoHomeSharp
        },
        {
            label: '로그아웃',
            href: '#',
            onClick: () => {
                const result = confirm('로그아웃 하시겠습니까?');
                if( result ) signOut();
                return;
            },
            icon: RiLogoutBoxFill
        }
    ], [pathname, conversationId, router]);

    return routerChat;
};

export default useRouterChat;
