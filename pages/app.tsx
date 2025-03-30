"use client";
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

type Props = {
    title: String
}

const client = new ApolloClient({
    uri: 'http://localhost:3001/api/graphql',
    cache: new InMemoryCache(),
})

function MyApp({Component, pageProps}: {
    Component: React.ReactNode,
    pageProps: Props
}){

    return (
        <ApolloProvider client={client}>
            <Component />
        </ApolloProvider>
    )
}

export default MyApp;