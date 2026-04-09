'use client';

import { useSession } from 'next-auth/react';
import ButtonLogin from './ButtonLogin';
import ButtonLogout from './ButtonLogout';
import ButtonProfile from './ButtonProfile';

const HeaderUserMenu = () => {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <li className="w-[72px] h-[30px]" aria-hidden />;
    }

    if (session?.user?.name) {
        return (
            <>
                <li className="flex">
                    <ButtonProfile />
                </li>
                <li>
                    <ButtonLogout />
                </li>
            </>
        );
    }

    return (
        <li>
            <ButtonLogin />
        </li>
    );
};

export default HeaderUserMenu;
