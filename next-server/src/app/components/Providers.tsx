"use client";
import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const apolloClient = new ApolloClient({
        uri: `/api/graphql`,
        cache: new InMemoryCache(),
    });

    return (
        <SessionProvider refetchOnWindowFocus={true}>
            <ApolloProvider client={apolloClient}>
                {children}
            </ApolloProvider>
        </SessionProvider>
    )
}
