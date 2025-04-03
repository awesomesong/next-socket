'use client';
import useRouterChat from "@/src/app/hooks/useRouterChat";
import { memo, useCallback, useMemo, useState } from "react";
import SidebarNavItem from "./SidebarNavItem";
import Avatar from "../Avatar";
import ProfileModal from "./ProfileModal";
import { useSession } from "next-auth/react";
import ShapesSkeleton from "../skeleton/ShapesSkeleton";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";
import clsx from "clsx";

const SidebarNav= () => {
    const keyboardVisible = useKeyboardVisible();
    const routerChat = useRouterChat();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    const handleCloseModal= useCallback(() => {
        return setIsOpen(false);
    }, [ isOpen ]);

    const user = useMemo(() => {
        return session?.user;
    }, [ session?.user?.email ]);

    return (
        <>
            <ProfileModal
                isOpen={isOpen}
                onCloseModal={handleCloseModal}
            />
            <div
                className="
                    flex
                    flex-col
                    shrink-0
                    justify-between
                    md:overflow-y-auto
                    overflow-y-hidden
                    left-0
                    w-20
                    h-dvh
                    p-4
                    bg-default
                    border-r-default
                    md:h-full
                    max-md:fixed
                    max-md:z-40
                    max-md:flex-row
                    max-md:items-center
                    max-md:w-full
                    max-md:bottom-0
                    max-md:h-14
                    max-md:p-0
                    max-md:border-t-[1px]
                "
            >
                <nav
                    className="
                    flex
                    flex-col
                    justify-between
                    max-md:w-full
                    max-md:h-full
                    "
                >
                    <ul
                        role="list"
                        className="
                            flex
                            items-center
                            flex-col
                            gap-y-2
                            max-md:flex-row
                            max-md:w-full
                            max-md:h-full
                        "
                    >
                        {routerChat.map((item) => (
                            <SidebarNavItem
                                key={item.label}
                                href={item.href}
                                label={item.label}
                                icon={item.icon}
                                active={item.active}
                                onClick={item.onClick}
                            />
                        ))}
                    </ul>
                </nav>
                <nav
                    className="
                        flex
                        mt-2
                        flex-col
                        justify-between
                        items-center
                        max-md:mt-0
                        max-md:px-2
                        max-md:border-l-[1px]
                    "
                >
                    {!!user?.id  
                        ? <div
                            onClick={() => setIsOpen(true)}
                            className="
                                cursor-pointer
                                transition
                                hover:opacity-75
                            "
                        >
                            <Avatar user={user} />
                        </div>
                        : 
                        (<div className="
                            overflow-hidden
                            inline-block
                            relative
                            rounded-full
                            w-8
                            h-8
                        ">
                            <ShapesSkeleton width="100%" height="100%" radius="lg" />
                        </div>)
                    }
                </nav>
            </div>
        </>
    )
}

export default SidebarNav;
