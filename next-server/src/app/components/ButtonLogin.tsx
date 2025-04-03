'use client';
import { signIn } from "next-auth/react";
import { usePathname, useSearchParams} from "next/navigation";
import { Suspense } from "react";

const ButtonLogin = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return (
    <Suspense>
        <button
            className='hover:underline'
            onClick={() => signIn(undefined, { callbackUrl: `${pathname}${searchParams?.toString() && '?'+searchParams.toString()}` })}
        >
            login
        </button>
    </Suspense>
    )
}

export default ButtonLogin;
