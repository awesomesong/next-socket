"use client";
import { BASE_URL } from '@/config';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import type { AppProps } from 'next/app';

type Props = {
    title: String
}

const client = new ApolloClient({
    uri: `${BASE_URL}/api/graphql`,
    cache: new InMemoryCache(),
})

function MyApp({Component, pageProps}: AppProps ){
    return (
        <ApolloProvider client={client}>
            <Component {...pageProps} />
        </ApolloProvider>
    )
}

export default MyApp;