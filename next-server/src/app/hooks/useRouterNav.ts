import { useMemo } from "react";
import { usePathname } from "next/navigation";

const useRouteNav = () => {
    const pathname = usePathname();

    const routerNav = useMemo(() => [
        {
            label: 'Chat',
            href: '/chatMember',
            active: false
        },
        {
            label: 'Blogs',
            href: '/blogs',
            active: pathname?.startsWith('/blogs') 
        },
        {
            label: 'posts',
            href: '/posts',
            active: pathname?.startsWith('/posts')
        },
    ], [pathname]);

    return routerNav;
};

export default useRouteNav;
