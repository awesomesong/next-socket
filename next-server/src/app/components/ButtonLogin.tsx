'use client';
import { signIn } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";

const ButtonLogin = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryString = searchParams?.toString();
    const fullPath = `${pathname}${queryString ? `?${queryString}` : ''}`;

    return (
        <button
            className="font-josefin text-gradient-scent font-semibold tracking-[0.03em] capitalize drop-shadow-sm focus:outline-none"
            onClick={() => signIn(undefined, { callbackUrl: fullPath })}
        >
            login
        </button>
    );
}

export default ButtonLogin;
