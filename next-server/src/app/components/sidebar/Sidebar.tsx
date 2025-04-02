'use client';
import { useResponsiveSafeHeight } from "../../hooks/useResponsiveSafeHeight";
import SidebarNav from "./SidebarNav";
import { useRef } from "react";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const divRef = useRef<HTMLDivElement>(null);  
    useResponsiveSafeHeight(divRef);

    return (
        <div ref={divRef} 
            className="flex flex-row"
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