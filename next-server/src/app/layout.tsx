import "./globals.css";
import type { Metadata } from "next";
import { Nanum_Gothic } from 'next/font/google';
import NextAuthProvider from "@/src/app/context/NextAuthProvider";
import ToasterContext from "@/src/app/context/ToasterContext";
import ThemeProvider from "@/src/app/context/ThemeProvider";
import { HeroUIProvider } from "@heroui/react";
import RQProviders from "@/src/app/context/RQProvider";
import SocketComponents from "@/src/app/components/SocketComponents";
import UserActiveStatus from "@/src/app/components/ActiveStatus";
import ApolloProviders from "./context/ApolloProviders";
import { SocketProvider } from "./context/socketContext";


const nanumGothic = Nanum_Gothic({
  weight: ['400', '700', '800'],
  subsets: ['latin'],
  variable: '--font-nanum-gothic',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devsonghee.com"),
  title: "강송희 포트폴리오 | 프론트엔드 개발자",
  description: `프론트엔드 개발자 강송희의 포트폴리오입니다. 
    Next.js 14, React 18, Prisma, GraphQL, Pusher, Next-Auth 등을 활용하여 
    블로그, 채팅, 인증 기능을 구현하였습니다.`,
  keywords: [
    "강송희",
    "프론트엔드 포트폴리오",
    "React",
    "Next.js",
    "Next-Auth",
    "GraphQL",
    "Prisma",
    "웹 개발자 포트폴리오",
    "프론트엔드 개발자",
  ],
  icons: {
    icon: "/image/hitejiro.png",
  },
  openGraph: {
    title: "강송희 포트폴리오 | 프론트엔드 개발자",
    description:
      "Next.js 14, React, GraphQL, Prisma 등을 사용하여 구현한 웹 개발 포트폴리오입니다.",
    url: "https://www.devsonghee.com",
    siteName: "강송희 포트폴리오",
    images: [
      {
        url: "/image/hitejinro.png", // og:image 경로
        width: 235,
        height: 200,
        alt: "강송희 포트폴리오 로고",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html 
      lang="ko" 
      suppressHydrationWarning
    >
      <body className={`
        flex
        flex-col
        text-default
        bg-default
        break-all
        ${nanumGothic.variable}
      `}>
        <NextAuthProvider>
          <ApolloProviders>
            <RQProviders>
              <ToasterContext />
              <HeroUIProvider className="flex flex-col flex-1">
                <ThemeProvider>
                  <SocketProvider>
                    <SocketComponents />
                    <UserActiveStatus />
                    {children}
                  </SocketProvider>
                </ThemeProvider>
              </HeroUIProvider>
            </RQProviders>
          </ApolloProviders>
        </NextAuthProvider>
      </body>
    </html>
  );
}
