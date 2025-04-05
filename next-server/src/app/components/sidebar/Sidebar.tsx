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
            className="
                flex 
                md:flex-row 
                flex-col-reverse
                overflow-hidden 
                h-dvh
            "
        >
            <SidebarNav />
            <main className="
                flex 
                flex-row 
                flex-1
                w-full
                min-h-0
                overflow-hidden
            ">
                {children}
            </main>
        </div>
    )
}

export default Sidebar;