import "./globals.css";
import type { Metadata } from "next";
import { Nanum_Gothic } from 'next/font/google';
import ClientLayout from "./components/ClientLayout";

const nanumGothic = Nanum_Gothic({
  weight: ['400', '700', '800'],
  subsets: ['latin'],
  variable: '--font-nanum-gothic',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "https://devsonghee.com"),
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
    icon: "/image/songhee_logo.png",
  },
  openGraph: {
    title: "강송희 포트폴리오 | 프론트엔드 개발자",
    description:
      "Next.js 14, React, GraphQL, Prisma 등을 사용하여 구현한 웹 개발 포트폴리오입니다.",
    url: "https://yourdomain.com", // 본인의 도메인으로 교체
    siteName: "강송희 포트폴리오",
    images: [
      {
        url: "/image/songhee_logo.png", // og:image 경로
        width: 800,
        height: 600,
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
        relative 
        text-default
        bg-default
        break-all
        ${nanumGothic.variable}
      `}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
