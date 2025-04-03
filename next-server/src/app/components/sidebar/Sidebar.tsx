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
                className={clsx(`
                    max-md:fixed
                    max-md:z-40
                    max-md:flex-row
                    max-md:items-center
                    max-md:w-full
                    max-md:bottom-0
                    max-md:h-14
                    max-md:p-0
                    max-md:border-t-[1px]
                    transition-all 
                    duration-300 
                    ease-in-out
                    flex-shrink-0`,
                keyboardVisible
                    ? "opacity-0 translate-y-4 pointer-events-none"
                    : "opacity-100 translate-y-0"
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