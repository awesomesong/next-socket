'use client';
import { signIn } from "next-auth/react";
import { usePathname, useSearchParams} from "next/navigation";
import { Suspense } from "react";

const ButtonLogin = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryString = searchParams?.toString();
    const callbackUrl = `${pathname}?${searchParams?.toString() || ''}`;

    return (
    <Suspense>
        <button
            className='hover:underline'
            onClick={() => signIn(undefined, { callbackUrl })}
        >
            login
        </button>
    </Suspense>
    )
}

export default ButtonLogin;
