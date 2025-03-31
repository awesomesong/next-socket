'use client';
import NextAuthProvider from "@/src/app/context/NextAuthProvider";
import ToasterContext from "@/src/app/context/ToasterContext";
import ThemeProvider from "@/src/app/context/ThemeProvider";
import { NextUIProvider } from "@nextui-org/react";
import RQProviders from "@/src/app/context/RQProvider";
import SocketComponents from "@/src/app/components/SocketComponents";
import SocketState from "@/src/app/components/SocketState";
import UserActiveStatus from "@/src/app/components/ActiveStatus";
import { SocketProvider } from "../context/socketContext";
import ApolloProviders from "../context/ApolloProviders";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthProvider>
      <ApolloProviders>
        <RQProviders>
          <ToasterContext />
          <NextUIProvider className="flex flex-col flex-1">
            <ThemeProvider>
              <SocketProvider>
                <SocketComponents />
                <UserActiveStatus />
                <SocketState />
                {children}
              </SocketProvider>
            </ThemeProvider>
          </NextUIProvider>
        </RQProviders>
      </ApolloProviders>
    </NextAuthProvider>
  );
}
