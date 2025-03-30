'use client';
import useRouteNav from "@/src/app/hooks/useRouterNav";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MobileNav = () => {
    const pathname = usePathname();
    const routerNav = useRouteNav();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname])

    return (
        <div className="
            md:hidden
        ">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(`
                        hamburger-menu
                    `,
                    isOpen && 'animate'
                )}
            >
                <div></div>
                <div></div>
                <div></div>
            </div>
            <ul 
                className={clsx(`
                        flex
                        flex-col
                        gap-3
                        fixed
                        left-0
                        right-0
                        bottom-0
                        top-[92px]
                        h-dvh
                        p-4
                        bg-white
                        dark:bg-[#0d0d0d]
                        capitalize
                    `,
                    isOpen ? 'block' : 'hidden'
                )}
            >
                {routerNav.map((route) => (
                    <li
                        key={route.label}
                    >
                        <Link
                            href={route.href}
                            className=''
                        >
                            <span className={clsx(`
                                inline-block
                                `,
                                route.active && 'font-extrabold'
                            )}>
                                {route.label}
                                {route.active && <span className={clsx(`
                                    flex
                                    w-full
                                    h-[2px]
                                    bg-default-reverse
                                `)} /> }
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default MobileNav;
