import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devsonghee.com"),
  title: {
    default: "Scent Memories Chat",
    template: "%s | Scent Memories Chat",
  },
  description: "향수를 좋아하는 사람들을 위한 소통 공간입니다.",
  openGraph: {
    title: "Scent Memories Chat",
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
    <div className="w-full min-h-dvh bg-default">
      {children}
    </div>
  );
}