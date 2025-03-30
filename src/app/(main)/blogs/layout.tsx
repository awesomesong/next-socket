import { BASE_URL } from "@/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "React Query 기반의 블로그",
    template: "블로그",
  },
  description: "React Query를 활용해 다양한 주제의 블로그 글을 업로드하고 공유할 수 있는 블로그입니다.",
  openGraph: {
    title: "React Query 블로그",
    description: "React Query로 구현된 빠르고 유연한 블로그 시스템",
    url: "https://yourdomain.com/posts",
    images: [
      {
        url: "/image/posts_og.png",
        width: 1200,
        height: 630,
        alt: "블로그 대표 이미지",
      },
    ],
    type: "website",
  },
  keywords: [
    "React Query",
    "블로그",
    "Next.js",
    "프론트엔드 블로그",
    "비동기 캐싱",
    "포스트 시스템"
  ],
};

export default async function BlogLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
  
    return (
        <>
          {children}
        </>
    )
}