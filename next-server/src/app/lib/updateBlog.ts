import { UpdateBlogRequest, UpdateBlogResponse } from "@/src/app/types/blog";

/**
 * 블로그 글 수정 API
 */
export const updateBlog = async (id: string, data: UpdateBlogRequest): Promise<UpdateBlogResponse> => {
  const res = await fetch(`/api/blogs/${id}`, {
    method: 'PUT',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await res.json();

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("해당 글을 수정할 권한이 없습니다.");
    }
    throw new Error(responseData.message || "블로그 수정 중 오류가 발생했습니다.");
  }

  return {
    success: true,
    updateBlog: responseData.updateBlog,
    message: "글이 수정되었습니다.",
  };
};
