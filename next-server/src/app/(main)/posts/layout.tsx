import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devsonghee.com"),
  title: {
    default: "GraphQL 기반의 게시판",
    template: "게시판",
  },
  description: "GraphQL로 구축된 게시판입니다. 다양한 주제의 글을 작성하고 다른 사용자들과 공유할 수 있습니다.",
  openGraph: {
    title: "GraphQL 게시판",
    description: "Apollo 기반으로 구현된 실시간 게시판 시스템",
    url: "https://www.devsonghee.com/posts",
    type: "website",
  },
  keywords: ["GraphQL", "Apollo", "Next.js", "게시판", "기술 게시판", "개발자 게시판"],
};

export default async function PostLayout({
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