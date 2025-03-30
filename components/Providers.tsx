"use client";
import { BASE_URL } from '@/config';
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';


export const Providers = ({ children }: { children: React.ReactNode }) => {
    const client = new ApolloClient({
        uri: `${BASE_URL}/api/graphql`,
        cache: new InMemoryCache(),
    });

    return (
        <SessionProvider refetchOnWindowFocus={true}>
            <ApolloProvider client={client}>
                {children}
            </ApolloProvider>
        </SessionProvider>
    )
}
