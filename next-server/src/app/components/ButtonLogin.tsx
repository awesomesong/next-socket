'use client';
import { signIn } from "next-auth/react";
import { usePathname, useSearchParams} from "next/navigation";
import { Suspense } from "react";
import StatusMessage from "./StatusMessage";

const ButtonLogin = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryString = searchParams?.toString();
    const fullPath = `${pathname}${queryString ? `?${queryString}` : ''}`;

    return (
    <Suspense fallback={<StatusMessage message="로딩 중..."/>}>
        <button
            className='hover:underline'
            onClick={() => signIn(undefined, { callbackUrl: fullPath })}
        >
            login
        </button>
    </Suspense>
    )
}

export default ButtonLogin;
