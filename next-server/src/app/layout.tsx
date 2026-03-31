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
  title: {
    default: "Scent Memories | 강송희 프론트엔드 포트폴리오",
    template: "%s | Scent Memories",
  },
  description:
    "Scent Memories는 향수를 수집하고 기록하는 프론트엔드 포트폴리오 사이트입니다. Next.js 15, React 19, Socket.io, OpenAI Vision, Three.js 등을 활용하여 향수 갤러리, AI 이미지 분석, 실시간 채팅, 3D 인터랙션 기능을 구현하였습니다.",
  keywords: [
    "Scent Memories",
    "강송희",
    "프론트엔드 포트폴리오",
    "Next.js",
    "React",
    "Socket.io",
    "OpenAI Vision",
    "Three.js",
    "Prisma",
    "웹 개발자 포트폴리오",
    "프론트엔드 개발자",
  ],
  icons: {
    icon: "/image/scent_memories.png",
  },
  openGraph: {
    title: "Scent Memories | 강송희 프론트엔드 포트폴리오",
    description:
      "Scent Memories는 향수를 수집하고 기록하는 공간입니다. Next.js와 다양한 기술을 사용하여 갤러리, 채팅, 3D 기능 등을 구현한 포트폴리오입니다.",
    siteName: "Scent Memories",
    images: [
      {
        url: "/image/metadata/main_web.png", // og:image 경로
        width: 1200,
        height: 627,
        alt: "Scent Memories 포트폴리오 썸네일",
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
      <head>
        <meta name="google-site-verification" content="ALyIJvkt9qHniyOTPkbNb3MNaUU1U44WV-nnHnwQofY" />
      </head>
      <body className={`
        flex
        flex-col
        min-h-dvh
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
