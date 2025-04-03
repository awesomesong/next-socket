'use client';
import SidebarNav from "./SidebarNav";
import { useRef } from "react";
import { useLayoutHeight } from "@/src/app/hooks/useLayoutHeight";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useLayoutHeight(containerRef);

    return (
        <div 
            ref={containerRef} 
            className="flex flex-row"
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