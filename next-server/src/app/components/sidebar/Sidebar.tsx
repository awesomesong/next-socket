'use client';
import SidebarNav from "./SidebarNav";
import { useRef } from "react";
import { useLayoutHeight } from "@/src/app/hooks/useLayoutHeight";
import clsx from "clsx";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useLayoutHeight(containerRef);

    return (
        <div 
            ref={containerRef} 
            className="
                flex 
                md:flex-row 
                flex-col-reverse
                overflow-hidden 
                border-10
            "
        >
            <SidebarNav />
            <main className="
                flex 
                flex-row 
                overflow-hidden
                w-full
                min-h-[18rem] 
            ">
                {children}
            </main>
        </div>
    )
}

export default Sidebar;