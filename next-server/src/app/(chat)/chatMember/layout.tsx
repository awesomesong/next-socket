import UserList from "@/src/app/components/UserList";
import Sidebar from "@/src/app/components/sidebar/Sidebar";

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