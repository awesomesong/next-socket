import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devsonghee.com"),
  title: "공지사항 | Scent Memories",
  description: "Scent Memories의 최신 소식과 공지사항을 확인해 보세요.",
  openGraph: {
    title: "공지사항 | Scent Memories",
    description: "Scent Memories의 최신 소식과 공지사항을 확인해 보세요.",
    url: "https://www.devsonghee.com/notice",
    type: "website",
    images: [
      {
        url: '/image/metadata/notice.png',
        width: 1200,
        height: 656,
        alt: 'Scent Memories 공지사항',
      },
    ],
  },
  keywords: [
    "Scent Memories",
    "센트 메모리즈",
    "공지사항",
    "업데이트",
    "소식",
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