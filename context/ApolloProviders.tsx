"use client";
import { BASE_URL } from "@/config";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

export const ApolloProviders = ({ children }: { children: React.ReactNode }) => {
	const client = new ApolloClient({
	uri: `${BASE_URL}/api/graphql`,
		cache: new InMemoryCache(),
	});
	return <ApolloProvider client={client}>{children}</ApolloProvider>;
};