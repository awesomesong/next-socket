import type { Metadata } from "next";
import UserList from "@/src/app/components/UserList";
import Sidebar from "@/src/app/components/sidebar/Sidebar";

export const metadata: Metadata = {
    metadataBase: new URL("https://www.devsonghee.com"),
    title: {
      default: "채팅 멤버",
      template: "%s | 채팅 멤버",
    },
    description: "참여 중인 유저 목록을 확인할 수 있습니다.",
    openGraph: {
      title: "채팅 멤버",
      description: "참여 중인 유저 목록을 확인하세요.",
      url: "https://devsonghee.com/chatMember",
      type: "website",
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