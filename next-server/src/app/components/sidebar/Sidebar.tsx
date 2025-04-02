'use client';
import { memo } from "react";
import SidebarNav from "./SidebarNav";
import useWindowSize from "../../hooks/useWindowSize";
import clsx from "clsx";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const windowSize = useWindowSize();

    return (
        <div className="flex flex-row flex-1">
            <SidebarNav />
            <main className={clsx("grow",
                windowSize.height && `h-[${windowSize.height}px]`
            )}>
                {children}
            </main>
        </div>
    )
}

export default Sidebar;