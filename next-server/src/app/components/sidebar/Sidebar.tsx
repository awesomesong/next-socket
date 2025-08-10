'use client';
import SidebarNav from "./SidebarNav";
import { useRef } from "react";
import { useLayoutHeight } from "@/src/app/hooks/useLayoutHeight";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // 모바일 가상 키보드 처리를 위한 레이아웃 높이 조정
    useLayoutHeight(containerRef as React.RefObject<HTMLElement>);

    return (
        <div 
            ref={containerRef} 
            className="
                flex 
                md:flex-row 
                flex-col-reverse
                overflow-hidden 
                h-screen
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