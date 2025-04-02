'use client';
import SidebarNav from "./SidebarNav";
import { useCallback, useEffect, useRef } from "react";
import { useKeyboardSafeHeight } from "@/src/app/hooks/useKeyboardSafeHeight";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const safeHeight = useKeyboardSafeHeight();
    const divRef = useRef<HTMLDivElement>(null);

    const applyHeight = useCallback(() => {
        if (safeHeight && divRef.current) {
            const screenWidth = window.innerWidth;
    
            if (screenWidth < 768) {
                divRef.current.style.height = `${safeHeight - 55}px`;
            } else {
                divRef.current.style.height = `${safeHeight}px`;
            }
        }
    }, [safeHeight]);
        
    useEffect(() => {
        applyHeight(); // 초기 적용
    
        window.addEventListener('resize', applyHeight); // 리사이즈 시에도 적용
    
        return () => {
            window.removeEventListener('resize', applyHeight); // 클린업
        };
    }, [applyHeight]);

    return (
        <div ref={divRef} 
            className="flex flex-row flex-1"
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