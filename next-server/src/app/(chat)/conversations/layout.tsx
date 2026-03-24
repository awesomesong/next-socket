import Sidebar from '@/src/app/components/sidebar/Sidebar';
import ConversationList from '@/src/app/components/ConversationList';

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