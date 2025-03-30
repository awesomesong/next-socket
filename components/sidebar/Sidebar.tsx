'use client';
import { memo } from "react";
import SidebarNav from "./SidebarNav";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {

    return (
        <div className="flex flex-row flex-1">
            <SidebarNav />
            <main className="grow">
                {children}
            </main>
        </div>
    )
}

export default Sidebar;