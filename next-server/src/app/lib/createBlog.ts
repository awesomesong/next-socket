import { CreateBlogRequest, CreateBlogResponse } from "@/src/app/types/blog";

/**
 * 새 블로그 글 작성 API
 */
export const createBlog = async (data: CreateBlogRequest): Promise<CreateBlogResponse> => {
  try {
    const res = await fetch('/api/blogs', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.message || "블로그 작성 중 오류가 발생했습니다.");
    }

    return {
      success: true,
      newBlog: responseData.newBlog,
      message: "글이 작성되었습니다.",
    };
  } catch (error) {
    console.error('블로그 작성 오류:', error);
    throw error;
  }
};
