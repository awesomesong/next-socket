'use client';
import clsx from "clsx";
import useWindowSize from "../../hooks/useWindowSize";
import SidebarNav from "./SidebarNav";

const Sidebar = ({children}: {
    children: React.ReactNode
}) => {
    const windowSize = useWindowSize();

    return (
        <div className="flex flex-row flex-1">
            <SidebarNav />
            <main className="
                    flex 
                    flex-row 
                    w-full
                    min-h-[18rem] 
                "
                style={{
                    height:
                        windowSize.height && windowSize.width
                        ? windowSize.width >= 768
                          ? `${windowSize.height}px` // 👈 폭이 넓을 때
                          : `calc(${windowSize.height}px - 55px)` // 👈 폭이 좁을 때
                        : undefined,
                }}
            >
                {children}
            </main>
        </div>
    )
}

export default Sidebar;