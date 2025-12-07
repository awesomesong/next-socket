"use client";
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';

const link = new HttpLink({
    uri: `${process.env.NEXT_PUBLIC_URL}/api/graphql`,
    credentials: "include",
});

const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
})

const ApolloProviders = ({ children }: { children: React.ReactNode } ) => {
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default ApolloProviders;