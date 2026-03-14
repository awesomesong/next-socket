'use client';
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const ButtonLogin = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryString = searchParams?.toString();
    const fullPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
    const signInHref = `/auth/signin${fullPath ? `?callbackUrl=${encodeURIComponent(fullPath)}` : ''}`;

    return (
        <Link
            href={signInHref}
            className="font-josefin text-gradient-scent font-semibold tracking-[0.03em] capitalize drop-shadow-sm focus:outline-none"
        >
            login
        </Link>
    );
}

export default ButtonLogin;
