import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devsonghee.com"),
  title: {
    default: "TanStack Query 기반의 공지사항",
    template: "공지사항",
  },
  description: "Scent Memories와 관련된 공지사항을 안내합니다.",
  openGraph: {
    title: "공지사항",
    description: "TanStack Query로 구현한 공지사항",
    url: "https://www.devsonghee.com/blogs",
    type: "website",
  },
  keywords: [
    "TanStack Query",
    "공지사항",
    "Next.js",
    "프론트엔드",
    "비동기 캐싱",
  ],
};

export default async function NoticeLayout({
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