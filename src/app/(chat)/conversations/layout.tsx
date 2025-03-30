import type { Metadata } from "next";
import ConversationList from '@/components/ConversationList';
import Sidebar from '@/components/sidebar/Sidebar';

export const metadata: Metadata = {
  title: {
    default: "대화방",
    template: "%s | 대화방",
  },
  description: "실시간 채팅을 통해 사용자와 직접 대화를 나눌 수 있습니다.",
  openGraph: {
    title: "대화방",
    description: "지금 유저와 실시간으로 대화를 나눠보세요.",
    url: "https://songhee.dev/chat/conversation",
    images: [
      {
        url: "/image/conversation_og.png", // og 이미지 경로 (필요 시 공통 chat 이미지 재사용 가능)
        width: 1200,
        height: 630,
        alt: "대화방 미리보기",
      },
    ],
  },
};

export default async function conversationsLayout({
  children
}: {
  children: React.ReactNode
}){

  return (
    <Sidebar>
      <div className='flex flex-row h-dvh min-h-[18rem] max-md:pb-14'>
        <ConversationList />
        {children}
      </div>
    </Sidebar>
  )
}