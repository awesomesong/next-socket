import { CreateNoticeRequest, CreateNoticeResponse } from "@/src/app/types/notice";

/**
 * 새 블로그 글 작성 API
 */
export const createNotice = async (data: CreateNoticeRequest): Promise<CreateNoticeResponse> => {
  const res = await fetch('/api/notice', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await res.json();

  if (!res.ok) {
    throw new Error(responseData.message || "공지사항 작성 중 오류가 발생했습니다.");
  }

  return {
    success: true,
    newNotice: responseData.newNotice,
    message: "글이 작성되었습니다.",
  };
};
