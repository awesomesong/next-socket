"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getNoticesComments } from "@/src/app/lib/getNoticesComments";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { CommentType, UpdateCommentResponse } from "@/src/app/types/comments";
import { updateNoticesComments } from "@/src/app/lib/updateNoticesComments";
import { deleteNoticesComments } from "@/src/app/lib/deleteNoticesComments";
import {
  replaceCommentById,
  removeCommentById,
  noticesCommentsKey,
  incrementNoticeDetailCommentsCount,
} from "@/src/app/lib/react-query/noticeCache";
import FormComment from "./FormComment";
import { useSocket } from "../context/socketContext";
import { CommentsSkeleton } from "./FragranceSkeleton";
import CircularProgress from "./CircularProgress";
import toast from "react-hot-toast";
import { SOCKET_EVENTS } from "../lib/react-query/utils";
import type { CommentPage } from "@/src/app/types/comments";
import DOMPurify from "dompurify";
import EditableItemRow from "./EditableItemRow";
import ScentUserAvatar from "./ScentUserAvatar";

type CommentsProps = {
  noticeId: string;
  user?: {
    role?: string;
    id: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
};

const Comments = ({ noticeId, user }: CommentsProps) => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [editingId, setEditingId] = useState<string | null>(null);


  // ✅ 권한 체크를 useMemo로 최적화
  const canEditComment = useCallback((comment: CommentType) => {
    return user?.role === "admin" || user?.email === comment.author?.email;
  }, [user?.role, user?.email]);

  const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: noticesCommentsKey(noticeId),
      queryFn: getNoticesComments,
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
        const loadedCount = (allPages ?? []).reduce((acc: number, page: CommentPage) => {
            const p = page.find((it) => "comments" in it) as
              | { comments: { id: string }[] }
              | undefined;
            return acc + (p?.comments?.length ?? 0);
          },
          0,
        ) as number;

        // 총 개수만큼 모두 로드했다면 다음 페이지 없음
        if (
          typeof countObj?.commentsCount === "number" &&
          countObj.commentsCount >= 0 &&
          loadedCount >= countObj.commentsCount
        )
          return undefined;

        // ✅ 댓글 배열이 비어있으면 다음 페이지 없음 (모바일 사파리 호환)
        if (!commentsPage.comments || commentsPage.comments.length === 0) {
          return undefined;
        }

        // 다음 페이지 커서 반환
        return commentsPage.comments.at(-1)?.id || undefined;
      },
    });

  // ✅ 사파리 호환성을 위한 useInView 설정
  // threshold: 0 (더 민감하게 반응), rootMargin: 100px (미리 트리거)
  const { ref, inView } = useInView({ 
    threshold: 0,
    rootMargin: '100px',
    triggerOnce: false,
  });

  const { mutateAsync: updateComment, isPending: isUpdatingComment } = useMutation({
      mutationFn: updateNoticesComments,
      onMutate: async ({ noticeId: bid, commentId, text }) => {
        await queryClient.cancelQueries({
          queryKey: noticesCommentsKey(bid),
          exact: true,
        });
        const prev = queryClient.getQueryData(noticesCommentsKey(bid));
        // 낙관적 텍스트 반영
        replaceCommentById(queryClient, bid, commentId, { text });
        return { prev };
      },
      onSuccess: (updated) => {
        setEditingId(null);
        // 서버 응답 형태 정규화: { updatedComment } 또는 바로 객체
        const updatedComment =
          updated && typeof updated === "object" && "updatedComment" in updated
            ? (updated as UpdateCommentResponse).updatedComment
            : updated as CommentType;

        // ✅ 최종 서버 데이터로 해당 댓글만 치환
        if (updatedComment?.id) {
          replaceCommentById(
            queryClient,
            noticeId,
            updatedComment.id,
            updatedComment,
          );
        }
        
        // 소켓 브로드캐스트(댓글 수정)
        try {
          socket?.emit(SOCKET_EVENTS.NOTICE_COMMENT_UPDATED, {
            noticeId,
            comment: updatedComment,
          });
        } catch {}
      },
      onError: (err: Error, _vars, ctx) => {
        if (ctx?.prev) {
          queryClient.setQueryData(noticesCommentsKey(noticeId), ctx.prev);
        }
        const message = err?.message || "댓글 수정에 실패했습니다.";
        toast.error(message);
      },
    });

  const { mutate: deleteComment } = useMutation({
    mutationFn: deleteNoticesComments,
    onMutate: async ({ noticeId: bid, commentId }) => {
      await queryClient.cancelQueries({
        queryKey: noticesCommentsKey(bid),
        exact: true,
      });
      const prev = queryClient.getQueryData(noticesCommentsKey(bid));
      // 낙관적 제거 + 카운트 -1
      removeCommentById(queryClient, bid, commentId);
      // 블로그 상세 페이지 댓글 수 업데이트
      incrementNoticeDetailCommentsCount(queryClient, noticeId, -1);
      return { prev };
    },
    onSuccess: (_result, { commentId }) => {
      // 소켓 브로드캐스트(댓글 삭제)
      try {
        socket?.emit(SOCKET_EVENTS.NOTICE_COMMENT_DELETED, { noticeId, commentId });
      } catch {}
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(noticesCommentsKey(noticeId), ctx.prev);
      }
      const message = err?.message || "댓글 삭제에 실패했습니다.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      // ✅ 사파리에서 즉시 실행되도록 requestAnimationFrame 사용
      requestAnimationFrame(() => {
        fetchNextPage();
      });
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const sanitizeText = useCallback((text: string) => {
    if (typeof window === 'undefined') return text;
    
    try {
      return DOMPurify.sanitize(text || '');
    } catch (error) {
      console.warn('DOMPurify 로드 실패:', error);
      return text || '';
    }
  }, []);

  const commentsCount = useMemo(() => 
    data?.pages[0]?.find(
      (page): page is { commentsCount: number } => "commentsCount" in page
    )?.commentsCount,
    [data?.pages]
  );

  return (
    <>
      {commentsCount !== undefined && (
        <h4 className="section-title">
          <span className="text-gradient-scent">댓글 {commentsCount}개</span>
        </h4>
      )}
      {status === "pending" ? (
        <CommentsSkeleton />
      ) : (
        <>
          <ul className="mt-2">
            {data?.pages?.map((page, pageIndex) => (
              <li key={`page-${pageIndex}`}>
                {page
                  ?.find((item) => "comments" in item)
                  ?.comments?.map((comment: CommentType) => (
                    <EditableItemRow
                      key={comment.id}
                      id={comment.id}
                      idPrefix="comment"
                      authorName={comment.author?.name}
                      authorImage={comment.author?.image}
                      createdAt={comment.createdAt}
                      canEdit={canEditComment(comment)}
                      isEditing={editingId === comment.id}
                      isUpdating={isUpdatingComment}
                      onStartEdit={() => setEditingId(comment.id)}
                      onDelete={() => {
                        deleteComment({
                          noticeId,
                          commentId: comment.id,
                        });
                        setEditingId(null);
                      }}
                      deleteConfirmMessage="댓글을 지우시겠습니까?"
                      updatingLabel="댓글 저장 중 입니다"
                      avatarFallback={<ScentUserAvatar />}
                      editForm={
                        <FormComment
                          noticeId={noticeId}
                          user={user!}
                          initialText={comment.text}
                          submitLabel="저장"
                          autoFocus
                          onSubmit={(text) =>
                            updateComment({
                              noticeId,
                              commentId: comment.id,
                              text,
                            })
                          }
                          onCancel={() => setEditingId(null)}
                        />
                      }
                      contentHtml={sanitizeText(comment?.text || "")}
                    />
                  ))}
              </li>
            ))}
          </ul>
        </>
      )}
      <div
        ref={ref}
        className="infinite-scroll-sentinel"
      >
        {isFetchingNextPage && <CircularProgress aria-label="로딩중" />}
      </div>
    </>
  );
};

export default Comments;