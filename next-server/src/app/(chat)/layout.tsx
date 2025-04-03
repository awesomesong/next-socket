import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "https://www.devsonghee.com"),
  title: {
    default: "채팅",
    template: "%s | 채팅",
  },
  description: "실시간 채팅 기능을 제공합니다. 유저와 대화를 나눠보세요.",
  openGraph: {
    title: "채팅",
    description: "Socket.io 기반의 실시간 채팅",
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