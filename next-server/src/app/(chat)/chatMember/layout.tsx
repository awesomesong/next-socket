import type { Metadata } from "next";
import UserList from "@/src/app/components/UserList";
import Sidebar from "@/src/app/components/sidebar/Sidebar";

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "https://www.devsonghee.com"),
    title: {
      default: "채팅 멤버",
      template: "%s | 채팅 멤버",
    },
    description: "참여 중인 유저 목록을 확인할 수 있습니다.",
    openGraph: {
      title: "채팅 멤버",
      description: "참여 중인 유저 목록을 확인하세요.",
      url: "https://songhee.dev/chat/chatMember",
      images: [
        {
          url: "/image/chat_member_og.png", // 원하는 og 이미지
          width: 1200,
          height: 630,
          alt: "채팅 멤버 미리보기",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "채팅 멤버",
      description: "참여 중인 유저와의 대화 목록을 확인하세요.",
      images: ["/image/chat_member_og.png"],
    },
};

export default async function ChatMemberLayout({
    children
}: {
    children: React.ReactNode
}) {

    return (
        <Sidebar>
          <UserList />
          {children}
        </Sidebar>
    )
}