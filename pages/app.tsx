"use client";
import { BASE_URL } from '@/config';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

type Props = {
    title: String
}

const client = new ApolloClient({
    uri: `${BASE_URL}/api/graphql`,
    cache: new InMemoryCache(),
})

function MyApp({Component, pageProps}: { Component: React.ElementType; pageProps: any } ){
    return (
        <ApolloProvider client={client}>
            <Component {...pageProps} />
        </ApolloProvider>
    )
}

export default MyApp;