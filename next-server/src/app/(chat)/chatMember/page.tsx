import EmptyState from "@/src/app/components/EmptyState";

export default async function ChatPage() {
  return (
    <div className="hidden grow h-full lg:block">
      <EmptyState message="멤버를 선택하면 하이트 톡톡이 시작됩니다." />
    </div>
  );
}
