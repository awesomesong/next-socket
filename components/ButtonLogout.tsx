'use client';
import { BASE_URL } from '@/config';
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
        <div 
            className='cursor-pointer hover:underline'
            onClick={onClick}
        >
            Logout
        </div>
    )
}

export default ButtonLogout
