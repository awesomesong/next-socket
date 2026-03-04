'use client';
import { signOut } from 'next-auth/react';

const ButtonLogout = () => {
    const onClick = () => {
        const result = confirm('로그아웃 하시겠습니까?');
        if( result ) signOut();
        return;
    };

    return (
        <button
            type="button"
            className="font-josefin text-gradient-scent font-semibold tracking-[0.03em] capitalize drop-shadow-sm focus:outline-none"
            onClick={onClick}
        >
            Logout
        </button>
    );
}

export default ButtonLogout
