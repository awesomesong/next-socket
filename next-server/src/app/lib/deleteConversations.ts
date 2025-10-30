import { toast } from "react-hot-toast";

/**
 * 대화방 삭제 API 호출
 * @param conversationId - 삭제할 대화방 ID
 * @returns Promise<{ success: boolean; payload?: any }> - 삭제 성공 여부와 응답 데이터
 */
export const deleteConversation = async (conversationId: string): Promise<{ success: boolean; payload?: any }> => {
  try {
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = (payload && (payload.message || payload.error)) || `삭제 실패 (HTTP ${res.status})`;
      toast.error(msg);
      return { success: false };
    }

    toast.success("대화방이 삭제되었습니다.");
    return { success: true, payload };
  } catch (error) {
    console.error("대화방 삭제 중 오류:", error);
    toast.error("대화방 삭제 중 오류가 발생했습니다.");
    return { success: false };
  }
};
