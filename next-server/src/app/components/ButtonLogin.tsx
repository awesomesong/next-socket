'use client';
import { signIn } from "next-auth/react";
import { usePathname, useSearchParams} from "next/navigation";

const ButtonLogin = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryString = searchParams?.toString();
    const fullPath = `${pathname}${queryString ? `?${queryString}` : ''}`;

    return (
        <button
            className='
                hover:underline
                drop-shadow-lg
                dark:text-slate-200 
                text-neutral-950
            '
            onClick={() => signIn(undefined, { callbackUrl: fullPath })}
        >
            login
        </button>
    )
}

export default ButtonLogin;
