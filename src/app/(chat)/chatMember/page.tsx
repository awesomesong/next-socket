import EmptyState from "@/components/EmptyState";

export default async function ChatPage() {
  return (
    <div className="hidden grow h-full lg:block">
      <EmptyState message="멤버를 선택하면, 대화가 시작됩니다." />
    </div>
  );
}
