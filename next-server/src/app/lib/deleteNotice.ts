import { DeleteNoticeResponse } from "@/src/app/types/notice";

/**
 * 블로그 글 삭제 API
 */
export const deleteNotice = async (id: string): Promise<DeleteNoticeResponse> => {
  const res = await fetch(`/api/notice/${id}`, {
    method: 'DELETE',
    headers: { "Content-Type": "application/json" },
  });

  const responseData = await res.json();

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("해당 글을 삭제할 권한이 없습니다.");
    }
    throw new Error(responseData.message || "공지사항 삭제 중 오류가 발생했습니다.");
  }

  return {
    success: true,
    message: "글이 삭제되었습니다.",
  };
};
