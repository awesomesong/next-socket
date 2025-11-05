"use client";
import TextareaAutosize from "react-textarea-autosize";
import React, {
  useRef,
  useState,
  FormEvent,
  useEffect,
  useCallback,
} from "react";
import useComposition from "@/src/app/hooks/useComposition";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDrinkReviews } from "@/src/app/lib/createDrinkReviews";
import { DrinkReviewsDataProps, DrinkReviewType } from "@/src/app/types/drink";
import { useSocket } from "../context/socketContext";
import toast from "react-hot-toast";
import {
  prependReview,
  replaceReviewById,
  removeReviewById,
  drinkReviewsKey,
} from "@/src/app/lib/react-query/reviewsCache";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";

type FormReviewProps = {
  id: string;
  user: {
    role?: string;
    id: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
  /** 초기 표시할 리뷰 내용. 수정 폼에서 사용 */
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

const FormReview = ({
  id,
  user,
  initialText = "",
  submitLabel = "확인",
  onSubmit,
  onCancel,
  autoFocus = false,
}: FormReviewProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [review, setReview] = useState<string>(initialText);
  const [stateReview, setStateReview] = useState(Boolean(onSubmit) ? true : false);
  const queryClient = useQueryClient();
  const socket = useSocket();

  // 한글 입력 조합 상태 관리
  const { isComposing, handleCompositionStart, handleCompositionEnd } =
    useComposition();

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [autoFocus]);

  const { mutate: createDrinkReviewsMutation } = useMutation({
    mutationFn: createDrinkReviews,
    onMutate: async ({ id, text }) => {
      await queryClient.cancelQueries({
        queryKey: drinkReviewsKey(id),
        exact: true,
      });
      const prev = queryClient.getQueryData(drinkReviewsKey(id)) as
        | DrinkReviewsDataProps
        | undefined;
      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      const optimistic: DrinkReviewType = {
        id: optimisticId,
        drinkSlug: id,
        text,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorEmail: user.email ?? null,
        author: {
          id: user.id,
          name: user.name ?? "",
          email: user.email ?? "",
          image: user.image ?? null,
        },
      };
      prependReview(queryClient, id, optimistic);

      setTimeout(() => {
        document.getElementById(`review-${optimisticId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100);

      return { prev, optimisticId };
    },
    onSuccess: (newData, _vars, ctx) => {
      if (!ctx?.optimisticId) return;
      replaceReviewById(queryClient, id, ctx.optimisticId, {
        ...newData.newReview,
        author: user,
      });
      // 소켓 브로드캐스트(리뷰 생성) - 다른 사용자들에게만 전송
      try {
        socket?.emit(SOCKET_EVENTS.DRINK_REVIEW_NEW, {
          drinkSlug: id,
          review: {
            ...newData.newReview,
            author: {
              name: user.name ?? "",
              email: user.email ?? "",
              image: user.image ?? null,
            },
          },
        });
      } catch {}
    },
    onError: (error, { id, text }, context) => {
      // 에러 시 롤백
      if (context?.prev) {
        queryClient.setQueryData(drinkReviewsKey(id), context.prev);
      }
      if (context?.optimisticId) {
        // 낙관적 업데이트로 추가된 리뷰 제거
        removeReviewById(queryClient, id, context.optimisticId);
      }

      // 입력창 복원
      setReview(text);

      const message =
        error instanceof Error ? error.message : "리뷰 등록에 실패했습니다.";
      toast.error(message);
    },
  });

  const onFocus = useCallback(() => {
    if (!user?.email) return;
    setStateReview(true);
  }, [user?.email]);

  // 리뷰 제출 로직 (공통 함수)
  const submitReview = useCallback((text: string) => {
    if (text.trim() === "") {
      textareaRef.current?.focus();
      return alert("리뷰를 입력해주세요.");
    }

    setReview(""); // 즉시 입력창 비우기

    if (onSubmit) {
      // 커스텀 onSubmit 함수 사용
      Promise.resolve()
        .then(() => onSubmit(text))
        .then(() => {
          onCancel?.();
        })
        .catch((error) => {
          // 실패 시 입력창 복원
          setReview(text);
          console.error("리뷰 저장 실패:", error);
        });
    } else {
      // useMutation을 사용한 낙관적 업데이트
      createDrinkReviewsMutation({ id, text });
    }
  }, [onSubmit, onCancel, createDrinkReviewsMutation, id]);

  // 버튼 클릭 이벤트 핸들러
  const handleSubmitReview = useCallback((e: FormEvent<HTMLButtonElement>) => {
      e.preventDefault();
      submitReview(review);
  }, [review, submitReview]);

  // Enter 키 이벤트 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 한글 입력 조합 중이면 제출하지 않음
      if (isComposing()) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        // 이벤트 객체에서 직접 값을 가져와서 정확한 텍스트 전달
        submitReview(e.currentTarget.value);
      }
  }, [submitReview, isComposing]);

  return (
    <div className="my-4">
      <TextareaAutosize
        ref={textareaRef}
        disabled={!user?.email}
        placeholder={
          user?.email
            ? "리뷰를 입력해주세요."
            : "로그인 후에 리뷰를 작성할 수 있습니다."
        }
        value={review}
        onChange={(e) => setReview(e.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className="w-full p-2 box-border border-solid border-b-[1px]"
      />
      {stateReview && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSubmitReview}
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
          >
            {submitLabel}
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              type="button"
              className="px-4 py-2 bg-gray-600 rounded-md text-white"
            >
              취소
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormReview;
