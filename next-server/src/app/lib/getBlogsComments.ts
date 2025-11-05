import toast from "react-hot-toast";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { blogsCommentsKey } from "./react-query/blogsCache";
import type { CommentPage } from "@/src/app/types/comments";

export const getBlogsComments = async ({
  queryKey,
  pageParam,
}: QueryFunctionContext<ReturnType<typeof blogsCommentsKey>, string>): Promise<CommentPage> => {
  const [_key, blogId] = queryKey;
  const cursor = pageParam ?? null;

  const res = await fetch(`/api/blogs/comments/${blogId}?cursor=${cursor}`, {
    next: {
      tags: [_key],
    },
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  const { comments, commentsCount } = await res.json();

  if (!res.ok) {
    toast.error("해당 글의 댓글을 찾지 못했습니다.");
  }

  return [{ comments }, { commentsCount }] as CommentPage;
};
