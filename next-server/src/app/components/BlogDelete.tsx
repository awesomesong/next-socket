"use client";
import { useRouter } from "next/navigation";
import { BlogIdProps } from "@/src/app/types/blog";
import LargeButton from "./LargeButton";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../context/socketContext";
import {
  removeBlogCardById,
  snapshotBlogCardPosition,
  restoreBlogCardPosition,
  snapshotBlogDetail,
  restoreBlogDetail,
  BLOG_LIST_KEY,
  blogDetailKey,
  type BlogListInfinite,
} from "@/src/app/lib/react-query/blogsCache";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";
import { deleteBlog } from "@/src/app/lib/deleteBlog";
import toast from "react-hot-toast";

type BlogTitleProps = {
  blogTitle: string;
};

const BlogDelete = ({ blogId, blogTitle }: BlogIdProps & BlogTitleProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const socket = useSocket();

  const handleDeleteBlog = async (blogId: string, blogTitle: string) => {
    const result = confirm(`"${blogTitle}" 글을 삭제하겠습니까?`);
    if (!result) return;

    // 낙관적 업데이트(정밀 롤백 대비): 대상 위치/데이터 백업 후 제거
    const blogIdStr = String(blogId);
    const prevDetail = snapshotBlogDetail(queryClient, blogIdStr);
    const snapshot = queryClient.getQueryData(BLOG_LIST_KEY) as BlogListInfinite | undefined;
    const backup = snapshotBlogCardPosition(queryClient, blogIdStr);

    // 목록에서 대상 카드 제거 (유틸 사용)
    removeBlogCardById(queryClient, blogIdStr);

    try {
      const result = await deleteBlog(blogIdStr);
      
      if (result.success) {
        // 상세 캐시 제거
        queryClient.removeQueries({
          queryKey: blogDetailKey(blogIdStr),
          exact: true,
        });
        
        // 소켓 브로드캐스트: 삭제 알림
        socket?.emit(SOCKET_EVENTS.BLOG_DELETED, { blogId: blogIdStr });
        
        toast.success(result.message!);
        router.push(`/blogs`);
      }
    } catch (error: unknown) {
      // 롤백: 목록/상세 복원
      restoreBlogCardPosition(queryClient, backup, snapshot);
      restoreBlogDetail(queryClient, blogIdStr, prevDetail);
      
      if (error instanceof Error && error.message?.includes("권한")) {
        router.push("/blogs");
      }
      toast.error("블로그 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <LargeButton onClick={() => handleDeleteBlog(blogId, blogTitle)}>
        삭제
      </LargeButton>
    </>
  );
};

export default BlogDelete;
