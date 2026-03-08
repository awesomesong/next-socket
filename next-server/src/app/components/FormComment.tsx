"use client";
import TextField, { formClassNames } from "./TextField";
import Button from "./Button";
import { formInputLayout } from "./formLayoutClasses";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import useComposition from "@/src/app/hooks/useComposition";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNoticesComments } from "@/src/app/lib/createNoticesComments";
import { CommentType } from "@/src/app/types/comments";
import { Author } from "@/src/app/types/notice";
import { useSocket } from "../context/socketContext";
import toast from "react-hot-toast";
import {
  prependNoticeCommentFirstPage,
  replaceCommentById,
  removeCommentById,
  noticesCommentsKey,
  incrementNoticeDetailCommentsCount,
} from "@/src/app/lib/react-query/noticeCache";
import { SOCKET_EVENTS } from "../lib/react-query/utils";

type FormCommentProps = {
  noticeId: string;
  user: {
    role?: string;
    id: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
  /** 초기 표시할 댓글 내용. 수정 폼에서 사용 */
  initialText?: string;
  /** 저장 버튼 텍스트 */
  submitLabel?: string;
  /** 저장 동작을 직접 처리하고 싶을 때 전달 */
  onSubmit?: (text: string) => Promise<unknown> | void;
  /** 취소 버튼 클릭 시 호출 */
  onCancel?: () => void;
  /** 컴포넌트가 나타날 때 자동으로 포커스 */
  autoFocus?: boolean;
};

const FormComment = ({
  noticeId,
  user,
  initialText = "",
  submitLabel = "확인",
  onSubmit,
  onCancel,
  autoFocus = false,
}: FormCommentProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [comment, setComment] = useState<string>(initialText);
  const [stateComment, setStateComment] = useState(
    Boolean(onSubmit) ? true : false,
  );
  const queryClient = useQueryClient();
  const socket = useSocket();

  // 한글 입력 조합 상태 관리
  const { isComposing, handleCompositionStart, handleCompositionEnd } =
    useComposition();

  // ✅ author 객체를 useMemo로 최적화 (중복 제거)
  const authorData: Author = useMemo(() => ({
    id: user?.id ?? "",
    name: user?.name ?? "",
    email: user?.email ?? "",
    image: user?.image ?? "",
  }), [user?.id, user?.name, user?.email, user?.image]);

  // useMutation을 사용한 낙관적 업데이트
  const { mutate: createCommentMutation } = useMutation({
    mutationFn: createNoticesComments,
    onMutate: async ({ noticeId: bid, comment: text }) => {
      await queryClient.cancelQueries({ queryKey: noticesCommentsKey(bid), exact: true });
      const previousComments = queryClient.getQueryData(noticesCommentsKey(bid));
      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticComment: CommentType = {
        id: optimisticId,
        noticeId: bid,
        text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorEmail: user.email ?? null,
        author: authorData, // ✅ 재사용
      };

      // 즉시 UI에 추가
      prependNoticeCommentFirstPage(queryClient, bid, optimisticComment);
      incrementNoticeDetailCommentsCount(queryClient, bid, 1);

      // ✅ 스크롤 최적화: requestAnimationFrame 사용
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(`comment-${optimisticId}`)?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        });
      });

      return { previousComments, optimisticId };
    },
    onSuccess: (result, { noticeId: bid }, context) => {
      if (!context?.optimisticId) return;
      // 임시 댓글을 실제 댓글로 교체
      replaceCommentById(queryClient, bid, context.optimisticId, {
        ...result.newComment,
        author: authorData,
      });

      // 소켓 브로드캐스트 (다른 사용자들에게만)
      try {
        socket?.emit(SOCKET_EVENTS.NOTICE_COMMENT_NEW, {
          noticeId: bid,
          comment: {
            ...result.newComment,
            author: {
              name: authorData.name,
              email: authorData.email,
              image: authorData.image,
            },
          },
        });
      } catch {}
    },
    onError: (error, { noticeId: bid, comment }, context) => {
      // 에러 시 롤백
      if (context?.previousComments) {
        queryClient.setQueryData(
          noticesCommentsKey(bid),
          context.previousComments,
        );
      }
      if (context?.optimisticId) {
        removeCommentById(queryClient, bid, context.optimisticId);
        incrementNoticeDetailCommentsCount(queryClient, bid, -1);
      }

      // 입력창 복원
      setComment(comment);

      const message = error instanceof Error ? error.message : "댓글 등록에 실패했습니다.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [autoFocus]);

  const onFocus = useCallback(() => {
    if (!user.email) return;
    setStateComment(true);
  }, [user?.email]);

  const submitComment = useCallback((text: string) => {
      if (text.trim() === "") {
        textareaRef.current?.focus();
        return toast.error("댓글을 입력해주세요.");
      }

      setComment(""); // 즉시 입력창 비우기

      if (onSubmit) {
        // 커스텀 onSubmit 함수 사용
        Promise.resolve()
          .then(() => onSubmit(text))
          .then(() => {
            // 댓글 수정의 경우 Comments.tsx에서 이미 처리하므로 여기서는 캐시 업데이트하지 않음
            onCancel?.();
          })
          .catch((error) => {
            // 실패 시 입력창 복원
            setComment(text);
            console.error("댓글 저장 실패:", error);
          });
      } else {
        // useMutation을 사용한 낙관적 업데이트
        createCommentMutation({ noticeId, comment: text });
      }
    },
    [onSubmit, onCancel, createCommentMutation, noticeId]
  );

  // 버튼 클릭 이벤트 핸들러
  const handleSubmitComment = useCallback(() => {
    submitComment(comment);
  }, [comment, submitComment]);

  // Enter 키 이벤트 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 한글 입력 조합 중이면 제출하지 않음
    if (isComposing()) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // 이벤트 객체에서 직접 값을 가져와서 정확한 텍스트 전달
      submitComment(e.currentTarget.value);
    }
  }, [submitComment, isComposing]);

  return (
    <div className={formInputLayout.wrapper}>
      <TextField
        ref={textareaRef}
        name="comment"
        disabled={!user?.email}
        placeholder={
          user?.email
            ? "댓글을 입력해주세요."
            : "로그인 후에 댓글을 작성할 수 있습니다."
        }
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        variant="underlined"
        minRows={1}
        classNames={formClassNames.textarea}
      />
      {stateComment && (
        <div className={formInputLayout.actions}>
          <Button
            onClick={handleSubmitComment}
            type="submit"
            size="md"
            variant="scent"
          >
            {submitLabel}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              type="button"
              variant="ghostLavender"
              size="md"
            >
              취소
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormComment;