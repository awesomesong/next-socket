'use client';
import useRouteNav from '@/src/app/hooks/useRouterNav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import useWindowSize from '@/src/app/hooks/useWindowSize';

const DesktopNav = () => {
    const pathname = usePathname();
    const routerNav = useRouteNav();
    const windowSize = useWindowSize();
    
    const HandleIndicatorMotion = (e: any) => {
        const marker = document.querySelector(".marker") as HTMLElement;

        marker.style.left = e.target.offsetLeft + "px";
        marker.style.width = e.target.offsetWidth + "px";
    };

    const HandleIndicatorActive = useCallback(() => {
        const marker = document.querySelector(".marker") as HTMLElement;
        const navBar =  document.querySelectorAll('.navBar');
        let routerNavActiveNum = 0;

        if(pathname === '/') {
            marker.style.left = '0';
            marker.style.width = '0';
            return;
        };
        
        routerNav.filter((route, i) => {
            if( route.active ) {
                ++routerNavActiveNum;
                marker.style.left = (navBar[i] as HTMLElement ).offsetLeft + "px";
                marker.style.width = (navBar[i] as HTMLElement ).offsetWidth + "px";
            } 
            if( routerNavActiveNum === 0 && routerNav.length === i + 1 ) {
                marker.style.left = '0';
                marker.style.width = '0';
            }
        });
    }, [pathname, routerNav]);

    useEffect(() => {
        HandleIndicatorActive();
    }, [pathname, windowSize, HandleIndicatorActive]);


    return (
        <div className='
            flex
            flex-1
            justify-center
            max-md:hidden
        '>
            <nav 
                className='
                    grow-0
                    relative
                '
            >
                <div 
                    className='
                        marker
                        absolute
                        left-0
                        -bottom-[8px]
                        w-0
                        h-[4px]
                        bg-gradient-to-r 
                        from-blue-700 
                        via-blue-500 
                        to-sky-400 
                        rounded-sm
                        transition-all
                        duration-[200ms]
                    ' 
                />
                <ul className='
                    flex 
                    align-center
                    justify-center
                    flex-1
                    space-x-4
                '>
                    {routerNav.map((route) => (
                        <li
                            key={route.label}
                        >
                            <Link 
                                onClick={HandleIndicatorMotion}
                                onMouseOver={HandleIndicatorMotion}
                                onMouseOut={HandleIndicatorActive}
                                onFocus={HandleIndicatorMotion}
                                onBlur={HandleIndicatorActive}
                                href={route.href}
                                className='
                                    navBar 
                                    capitalize 
                                    drop-shadow-lg 
                                    dark:text-slate-200 
                                    text-neutral-950
                                '
                            >
                                {route.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}

export default DesktopNav;
