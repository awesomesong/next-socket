'use client';
import { SessionProvider } from "next-auth/react";
import { FC, ReactNode } from "react";

interface ProviderProps {
    children: ReactNode
};

const NextAuthProvider: FC<ProviderProps> = ({ children }) => {
    return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>
};

export default NextAuthProvider;