'use client';
import SidebarNav from "./SidebarNav";
import { useRef } from "react";
import { useLayoutHeight } from "@/src/app/hooks/useLayoutHeight";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";
import clsx from "clsx";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const keyboardVisible = useKeyboardVisible();
    useLayoutHeight(containerRef);

    return (
        <div 
            ref={containerRef} 
            className="flex flex-row overflow-hidden"
        >
            {/* 항상 렌더링! → visibility만 제어 */}
            <div
                className={clsx(
                "transition-all duration-300 ease-in-out",
                "flex-shrink-0",
                keyboardVisible
                    ? "opacity-0 -translate-x-4 pointer-events-none"
                    : "opacity-100 translate-x-0"
                )}
            >
                <SidebarNav />
            </div>
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