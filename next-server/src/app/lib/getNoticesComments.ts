import toast from "react-hot-toast";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { noticesCommentsKey } from "./react-query/noticeCache";
import type { CommentPage } from "@/src/app/types/comments";

export const getNoticesComments = async ({
  queryKey,
  pageParam,
}: QueryFunctionContext<ReturnType<typeof noticesCommentsKey>, string>): Promise<CommentPage> => {
  const [_key, noticeId] = queryKey;
  const cursor = pageParam ?? null;

  const res = await fetch(`/api/notice/comments/${noticeId}?cursor=${cursor}`, {
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
