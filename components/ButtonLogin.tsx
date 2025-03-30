'use client';
import { signIn } from "next-auth/react";
import { usePathname, useSearchParams} from "next/navigation";

const ButtonLogin = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return (
        <button
            className='hover:underline'
            onClick={() => signIn(undefined, { callbackUrl: `${pathname}${searchParams?.toString() && '?'+searchParams.toString()}` })}
        >
            login
        </button>
    )
}

export default ButtonLogin;
