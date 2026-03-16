'use client';
import useRouteNav from "@/src/app/hooks/useRouterNav";
import NavLink from "./NavLink";
import { clsx } from "clsx";
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
                    top-[58px]
                    h-dvh
                    p-4
                    bg-default
                    capitalize
                `,
                    isOpen ? 'block' : 'hidden'
                )}
            >
                {routerNav.map((route) => (
                    <li key={route.label}>
                        <NavLink
                            href={route.href}
                            label={route.label}
                            isActive={route.active}
                            showLineOnActive
                        />
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default MobileNav;
