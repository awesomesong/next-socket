"use client";
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
    uri: `${process.env.NEXT_PUBLIC_URL}/api/graphql`,
    cache: new InMemoryCache(),
    credentials: "include", 
})

const ApolloProviders = ({ children }: { children: React.ReactNode } ) => {
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default ApolloProviders;