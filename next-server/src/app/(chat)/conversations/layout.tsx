import type { Metadata } from "next";
import ConversationList from '@/src/app/components/ConversationList';
import Sidebar from '@/src/app/components/sidebar/Sidebar';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "https://www.devsonghee.com"),
  title: {
    default: "대화방",
    template: "%s | 대화방",
  },
  description: "실시간 채팅을 통해 사용자와 직접 대화를 나눌 수 있습니다.",
  openGraph: {
    title: "대화방",
    description: "지금 유저와 실시간으로 대화를 나눠보세요.",
    url: "https://devsonghee.com/conversations",
    type: "website",
  },
};

export default async function conversationsLayout({
  children
}: {
  children: React.ReactNode
}){

  return (
    <Sidebar>
      <ConversationList />
      {children}
    </Sidebar>
  )
}