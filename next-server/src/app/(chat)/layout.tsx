import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devsonghee.com"),
  title: {
    default: "하이트 톡톡",
    template: "%s | 하이트 톡톡",
  },
  description: "하이트진로를 좋아하는 사람들을 위한 소통 공간입니다.",
  openGraph: {
    title: "하이트 톡톡",
    description: "Socket.io 기반의 실시간 소통 공간",
    url: "https://www.devsonghee.com/chatMember",
    type: "website",
  },
};

export default async function RootLayout({
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