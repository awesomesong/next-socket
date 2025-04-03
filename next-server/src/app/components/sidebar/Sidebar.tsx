'use client';
import SidebarNav from "./SidebarNav";
import { useRef } from "react";
import useWindowSize from "@/src/app/hooks/useWindowSize";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const windowSize = useWindowSize();

    return (
        <div 
            className="flex flex-row"
            style={{
                height:
                    windowSize.height && windowSize.width
                    ? windowSize.width >= 768
                    ? `${windowSize.height}px`
                    : `calc(${windowSize.height}px - 55px)`
                    : undefined,
            }}
        >
            <SidebarNav />
            <main className="
                    flex 
                    flex-row 
                    w-full
                    min-h-[18rem] 
            ">
                {children}
            </main>
        </div>
    )
}

export default Sidebar;