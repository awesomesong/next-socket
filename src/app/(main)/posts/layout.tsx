import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "https://devsonghee.com"),
  title: {
    default: "GraphQL 기반의 게시판",
    template: "게시판",
  },
  description: "GraphQL로 구축된 게시판입니다. 사용자는 다양한 주제의 글을 작성하고 다른 사용자들과 공유할 수 있습니다.",
  openGraph: {
    title: "GraphQL 게시판",
    description: "Apollo 기반으로 구현된 실시간 게시판 시스템",
    url: "https://yourdomain.com/blogs",
    images: [
      {
        url: "/image/blog_og.png", // 📸 게시판 대표 이미지
        width: 1200,
        height: 630,
        alt: "GraphQL Blog Preview",
      },
    ],
    type: "website",
  },
  keywords: ["GraphQL", "Apollo", "Next.js", "게시판", "기술 게시판", "개발자 게시판"],
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