'use client';
import SidebarNav from "./SidebarNav";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {

    return (
        <div className="flex flex-row flex-1">
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