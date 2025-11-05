'use client';
import { signOut } from 'next-auth/react'


const ButtonLogout = () => {
    const onClick = () => {
        const result = confirm('로그아웃 하시겠습니까?');
        if( result ) signOut();
        return;
    };

    return (
        <button 
            type='button'
            className='
                hover:underline 
                drop-shadow-lg
                dark:text-slate-200 
                text-neutral-950
            '
            onClick={onClick}
        >
            Logout
        </button>
    )
}

export default ButtonLogout
