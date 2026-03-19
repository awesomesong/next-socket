import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Nanum_Gothic, Josefin_Sans } from 'next/font/google';
import NextAuthProvider from "@/src/app/context/NextAuthProvider";
import ToasterContext from "@/src/app/context/ToasterContext";
import ToastFromUrl from "@/src/app/components/ToastFromUrl";
import ThemeProvider from "@/src/app/context/ThemeProvider";
import { HeroUIProvider } from "@heroui/react";
import RQProviders from "@/src/app/context/RQProvider";
import SocketComponents from "@/src/app/components/SocketComponents";
import UserActiveStatus from "@/src/app/components/ActiveStatus";
import SocketState from "@/src/app/components/SocketState";
import { SocketProvider } from "./context/socketContext";


const nanumGothic = Nanum_Gothic({
  weight: ['400', '700', '800'],
  subsets: ['latin'],
  variable: '--font-nanum-gothic',
  preload: false,
  display: 'swap',
});

const josefinSans = Josefin_Sans({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '600'],
  style: ['normal', 'italic'],
  preload: false,
  display: 'swap',
  variable: '--font-josefin-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devsonghee.com"),
  title: "강송희 포트폴리오 | 프론트엔드 개발자",
  description: `프론트엔드 개발자 강송희의 포트폴리오입니다. 
    Next.js 15, React 18, Prisma, socket.io, react-query, Next-Auth 등을 활용하여 
    블로그, 채팅, 인증 기능을 구현하였습니다.`,
  keywords: [
    "강송희",
    "프론트엔드 포트폴리오",
    "React",
    "Next.js",
    "Next-Auth",
    "react-query",
    "socket.io",
    "Prisma",
    "웹 개발자 포트폴리오",
    "프론트엔드 개발자",
  ],
  icons: {
    icon: "/image/scent_memories.png",
  },
  openGraph: {
    title: "강송희 포트폴리오 | 프론트엔드 개발자",
    description:
      "Next.js 15, React, react-query,socket.io, Prisma 등을 사용하여 구현한 웹 개발 포트폴리오입니다.",
    url: "https://www.devsonghee.com",
    siteName: "강송희 포트폴리오",
    images: [
      {
        url: "/image/scent_memories.png", // og:image 경로
        width: 992,
        height: 1056,
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
        ${josefinSans.variable}
      `}>
        <NextAuthProvider>
          <RQProviders>
            <ToasterContext />
            <Suspense fallback={null}>
              <ToastFromUrl />
            </Suspense>
            <HeroUIProvider className="flex flex-col flex-1">
              <ThemeProvider>
                <SocketProvider>
                  <SocketComponents />
                  <SocketState />
                  <UserActiveStatus />
                  {children}
                </SocketProvider>
              </ThemeProvider>
            </HeroUIProvider>
          </RQProviders>
        </NextAuthProvider>
      </body>
    </html>
  );
}
