'use client';
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';


const ButtonLogout = () => {
    const pathname = usePathname();

    const onClick = () => {
        const result = confirm('로그아웃 하시겠습니까?');
        if( result ) signOut();
        return;
        // signOut({ callbackUrl: `/api/auth/signout?callbackUrl=${pathname}`, redirect: true });
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
