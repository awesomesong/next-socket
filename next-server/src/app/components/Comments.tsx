"use client";
import dayjs from "@/src/app/utils/day";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { PiUserCircleFill } from "react-icons/pi";
import { getBlogsComments } from "@/src/app/lib/getBlogsComments";
import { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { CommentType } from "@/src/app/types/blog";
import { updateBlogsComments } from "@/src/app/lib/updateBlogsComments";
import { deleteBlogsComments } from "@/src/app/lib/deleteBlogsComments";
import {
  replaceCommentById,
  removeCommentById,
  blogsCommentsKey,
  incrementBlogDetailCommentsCount,
} from "@/src/app/lib/react-query/blogsCache";
import FormComment from "./FormComment";
import { useSocket } from "../context/socketContext";
import CommentSkeleton from "./skeleton/CommentSkeleton";
import CircularProgress from "./CircularProgress";
import FallbackNextImage from "./FallbackNextImage";
import toast from "react-hot-toast";
import { SOCKET_EVENTS } from "../lib/react-query/utils";

type CommentsProps = {
  blogId: string;
  user?: {
    role?: string;
    id: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
};

const Comments = ({ blogId, user }: CommentsProps) => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [editingId, setEditingId] = useState<string | null>(null);


  // ✅ 권한 체크를 useMemo로 최적화
  const canEditComment = useCallback((comment: CommentType) => {
    return user?.role === "admin" || user?.email === comment.author?.email;
  }, [user?.role, user?.email]);

  const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: blogsCommentsKey(blogId),
      queryFn: getBlogsComments,
      initialPageParam: "",
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage) return undefined;
        const commentsPage = lastPage.find((item) => "comments" in item) as
          | { comments: { id: string }[] }
          | undefined;
        const countObj = lastPage.find((item) => "commentsCount" in item) as
          | { commentsCount: number }
          | undefined;
        if (!commentsPage) return undefined;

        // 지금까지 로드된 총 댓글 개수
        const loadedCount = (allPages ?? []).reduce(
          (acc: number, page: any) => {
            const p = page.find((it: any) => "comments" in it) as
              | { comments: { id: string }[] }
              | undefined;
            return acc + (p?.comments?.length ?? 0);
          },
          0,
        );

        // 총 개수만큼 모두 로드했다면 다음 페이지 없음
        if (
          typeof countObj?.commentsCount === "number" &&
          loadedCount >= countObj.commentsCount
        )
          return undefined;

        // 다음 페이지 커서 반환
        return commentsPage.comments.at(-1)?.id || undefined;
      },
    });

  const { ref, inView } = useInView({ threshold: 0.2, delay: 100 });

  const { mutateAsync: updateComment, isPending: isUpdatingComment } = useMutation({
      mutationFn: updateBlogsComments,
      onMutate: async ({ blogId: bid, commentId, text }) => {
        await queryClient.cancelQueries({
          queryKey: blogsCommentsKey(bid),
          exact: true,
        });
        const prev = queryClient.getQueryData(blogsCommentsKey(bid));
        // 낙관적 텍스트 반영
        replaceCommentById(queryClient, bid, commentId, { text } as any);
        return { prev };
      },
      onSuccess: (updated) => {
        setEditingId(null);
        // 서버 응답 형태 정규화: { updatedComment } 또는 바로 객체
        const updatedComment =
          updated && typeof updated === "object" && "updatedComment" in updated
            ? (updated as any).updatedComment
            : updated;

        // ✅ 최종 서버 데이터로 해당 댓글만 치환
        if (updatedComment?.id) {
          replaceCommentById(
            queryClient,
            blogId,
            updatedComment.id,
            updatedComment as any,
          );
        }
        
        // 소켓 브로드캐스트(댓글 수정)
        try {
          socket?.emit(SOCKET_EVENTS.BLOG_COMMENT_UPDATED, {
            blogId,
            comment: updatedComment,
          });
        } catch {}
      },
      onError: (err: any, _vars, ctx) => {
        if (ctx?.prev)
          queryClient.setQueryData(blogsCommentsKey(blogId), ctx.prev as any);
        const message = err?.message || "댓글 수정에 실패했습니다.";
        toast.error(message);
      },
    });

  const { mutate: deleteComment } = useMutation({
    mutationFn: deleteBlogsComments,
    onMutate: async ({ blogId: bid, commentId }) => {
      await queryClient.cancelQueries({
        queryKey: blogsCommentsKey(bid),
        exact: true,
      });
      const prev = queryClient.getQueryData(blogsCommentsKey(bid));
      // 낙관적 제거 + 카운트 -1
      removeCommentById(queryClient, bid, commentId);
      // 블로그 상세 페이지 댓글 수 업데이트
      incrementBlogDetailCommentsCount(queryClient, blogId, -1);
      return { prev };
    },
    onSuccess: (_result, { commentId }) => {
      // 소켓 브로드캐스트(댓글 삭제)
      try {
        socket?.emit(SOCKET_EVENTS.BLOG_COMMENT_DELETED, { blogId, commentId });
      } catch {}
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(blogsCommentsKey(blogId), ctx.prev as any);
      const message = err?.message || "댓글 삭제에 실패했습니다.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const sanitizeText = useCallback((text: string) => {
    if (typeof window === 'undefined') return text;
    
    try {
      const DOMPurify = require('dompurify');
      return DOMPurify.sanitize(text || '');
    } catch (error) {
      console.warn('DOMPurify 로드 실패:', error);
      return text || '';
    }
  }, []);

  const handleDeleteComment = useCallback((commentId: string) => {
    if (window.confirm("댓글을 지우시겠습니까?")) {
      deleteComment({
        blogId,
        commentId,
      });
    }
    setEditingId(null);
  }, [deleteComment, blogId]);

  return (
    <>
      {data?.pages[0]?.flat().map((page, i) => (
        <Fragment key={i}>
          {Object.keys(page)[0] === "commentsCount" && (
            <h4>댓글 {page.commentsCount}개</h4>
          )}
        </Fragment>
      ))}
      {status === "pending" ? (
        <div className="flex flex-col gap-3">
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      ) : (
        <>
          <div className="mt-2">
            {data?.pages?.map((page, pageIndex) => (
              <ul key={`page-${pageIndex}`}>
                {page
                  ?.find((item) => "comments" in item)
                  ?.comments?.map((comment: CommentType) => (
                    <li
                      key={comment.id}
                      id={`comment-${comment.id}`}
                      className="flex flex-row gap-3 py-1"
                    >
                      <span className="shrink-0 overflow-hidden relative w-10 h-10 mt-1 rounded-full">
                        {comment.author?.image ? (
                          <FallbackNextImage
                            src={comment.author?.image}
                            alt={`${comment.author?.name} 이미지`}
                            fill
                            className="object-cover"
                            unoptimized={false}
                          />
                        ) : (
                          <PiUserCircleFill className="w-full h-full" />
                        )}
                      </span>
                      <div className="flex-1">
                        <div className="inline-flex items-end flex-wrap">
                          <span className="break-all mr-2">
                            {comment.author?.name}
                          </span>
                          <span className="text-gray-400 mr-2">
                            {dayjs(comment.createdAt).fromNow()}
                          </span>
                          {canEditComment(comment) && (
                            <span className="text-gray-500">
                              <button
                                onClick={() => {
                                  setEditingId(comment.id);
                                }}
                                className="
                                  px-3
                                  py-1 
                                  mr-2
                                  rounded-full
                                  text-xs
                                  text-blue-500
                                  border-blue-500
                                  border-1
                                "
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="
                                  px-3
                                  py-1 
                                  rounded-full
                                  text-xs
                                  text-gray-500
                                  border-gray-500
                                  dark:text-gray-400
                                  dark:border-gray-400
                                  border-1
                                "
                              >
                                삭제
                              </button>
                            </span>
                          )}
                        </div>
                        {editingId === comment.id ? (
                          isUpdatingComment ? (
                            <div className="flex items-center justify-center py-4">
                              <CircularProgress aria-label="댓글 저장 중 입니다" />
                            </div>
                          ) : (
                            <FormComment
                              blogId={blogId}
                              user={user!}
                              initialText={comment.text}
                              submitLabel="저장"
                              autoFocus
                              onSubmit={(text) =>
                                updateComment({
                                  blogId,
                                  commentId: comment.id,
                                  text,
                                })
                              }
                              onCancel={() => setEditingId(null)}
                            />
                          )
                        ) : (
                          <>
                            <pre
                              className="whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeText(comment?.text || ""),
                              }}
                            />
                          </>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            ))}
          </div>
        </>
      )}
      <div ref={ref}>
        {isFetchingNextPage && <CircularProgress aria-label="로딩중" />}
      </div>
    </>
  );
};

export default Comments;