'use client';

import useRouteNav from '@/src/app/hooks/useRouterNav';
import NavLink from './NavLink';

const DesktopNav = () => {
    const routerNav = useRouteNav();

    return (
        <div className="flex flex-1 justify-center max-md:hidden">
            <nav className="grow-0 relative">
                <ul className="flex align-center justify-center flex-1 space-x-4">
                    {routerNav.map((route) => (
                        <li key={route.label}>
                            <NavLink
                                href={route.href}
                                label={route.label}
                                isActive={route.active}
                                showLineOnActive
                            />
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default DesktopNav;
