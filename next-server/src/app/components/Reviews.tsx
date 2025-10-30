"use client";
import dayjs from "@/src/app/utils/day";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { PiUserCircleFill } from "react-icons/pi";
import { getDrinkReviews } from "@/src/app/lib/getDrinkReviews";
import { Fragment, useEffect, useState, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { DrinkReviewType } from "@/src/app/types/drink";
import { updateDrinkReview } from "@/src/app/lib/updateDrinkReview";
import { deleteDrinkReview } from "@/src/app/lib/deleteDrinkReview";
import {
  replaceReviewById,
  removeReviewById,
  drinkReviewsKey,
} from "@/src/app/lib/react-query/reviewsCache";
import FormReview from "./FormReview";
import { useSocket } from "../context/socketContext";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";
import CommentSkeleton from "./skeleton/CommentSkeleton";
import CircularProgress from "./CircularProgress";
import FallbackNextImage from "./FallbackNextImage";
import toast from "react-hot-toast";

type ReviewsProps = {
  id: string;
  name: string;
  user?: {
    role?: string;
    id: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
  };
};

const Reviews = ({ id, name, user }: ReviewsProps) => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ 리뷰 텍스트 sanitize 함수를 useMemo로 최적화
  const sanitizeReviewText = useMemo(() => {
    return (text: string) => {
      if (typeof window === 'undefined') {
        // SSR에서는 원본 텍스트 반환
        return text || '';
      }
      
      try {
        const DOMPurify = require('dompurify');
        return DOMPurify.sanitize(text || '');
      } catch (error) {
        console.warn('DOMPurify 로드 실패:', error);
        return text || '';
      }
    };
  }, []);

  const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: drinkReviewsKey(id),
      queryFn: getDrinkReviews,
      initialPageParam: "",
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage) return undefined;
        const reviewsPage = lastPage.find((item) => "reviews" in item) as
          | { reviews: { id: string }[] }
          | undefined;
        const countObj = lastPage.find((item) => "reviewsCount" in item) as
          | { reviewsCount: number }
          | undefined;
        if (!reviewsPage) return undefined;

        // 지금까지 로드된 총 리뷰 개수
        const loadedCount = (allPages ?? []).reduce(
          (acc: number, page: any) => {
            const p = page.find((it: any) => "reviews" in it) as
              | { reviews: { id: string }[] }
              | undefined;
            return acc + (p?.reviews?.length ?? 0);
          },
          0,
        );

        // 총 개수만큼 모두 로드했다면 다음 페이지 없음
        if (
          typeof countObj?.reviewsCount === "number" &&
          loadedCount >= countObj.reviewsCount
        )
          return undefined;

        // 다음 페이지 커서 반환
        return reviewsPage.reviews.at(-1)?.id || undefined;
      },
    });

  const { ref, inView } = useInView({ threshold: 0.2, delay: 100 });

  const { mutateAsync: updateReview, isPending: isUpdatingReview } =
    useMutation({
      mutationFn: updateDrinkReview,
      onMutate: async ({ id: reviewId, text }) => {
        await queryClient.cancelQueries({
          queryKey: drinkReviewsKey(id),
          exact: true,
        });
        const prev = queryClient.getQueryData(drinkReviewsKey(id));
        // ✅ 낙관적 텍스트 반영 (InfiniteQuery의 모든 페이지 순회)
        replaceReviewById(queryClient, id, reviewId, { text } as any);
        return { prev, reviewId };
      },
      onSuccess: (updated, _vars, ctx) => {
        setEditingId(null);
        
        // 서버 응답 형태 정규화
        const updatedReview =
          updated && typeof updated === "object" && "updateReview" in updated
            ? (updated as any).updateReview
            : updated;

        // ✅ 최종 서버 데이터로 교체 (낙관적 업데이트를 서버 데이터로 덮어쓰기)
        // replaceReviewById가 모든 페이지를 순회하여 처리
        if (updatedReview?.id) {
          replaceReviewById(
            queryClient,
            id,
            ctx?.reviewId ?? updatedReview.id, // 낙관적 업데이트한 ID 사용
            updatedReview as any,
          );
        }

        // 소켓 브로드캐스트(리뷰 수정)
        try {
          socket?.emit(SOCKET_EVENTS.DRINK_REVIEW_UPDATED, {
            drinkSlug: id,
            review: updatedReview,
          });
        } catch {}
      },
      onError: (err: any, _vars, ctx) => {
        // ✅ 롤백: 이전 데이터로 완전 복원
        if (ctx?.prev) queryClient.setQueryData(drinkReviewsKey(id), ctx.prev as any);
        const message = err?.message || "리뷰 수정에 실패했습니다.";
        toast.error(message);
      },
    });

  const { mutate: deleteReview } = useMutation({
    mutationFn: deleteDrinkReview,
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({
        queryKey: drinkReviewsKey(id),
        exact: true,
      });
      const prev = queryClient.getQueryData(drinkReviewsKey(id));
      // ✅ 낙관적 제거 + 카운트 -1 (InfiniteQuery의 모든 페이지 순회)
      removeReviewById(queryClient, id, deletedId);
      return { prev };
    },
    onSuccess: (_result, deletedId) => {

      // 소켓 브로드캐스트(리뷰 삭제)
      try {
        socket?.emit(SOCKET_EVENTS.DRINK_REVIEW_DELETED, {
          drinkSlug: id,
          reviewId: deletedId,
        });
      } catch {}
    },
    onError: (err: any, _vars, ctx) => {
      // ✅ 롤백: 이전 데이터로 완전 복원
      if (ctx?.prev) queryClient.setQueryData(drinkReviewsKey(id), ctx.prev as any);
      const message = err?.message || "리뷰 삭제에 실패했습니다.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <>
      {data?.pages[0]?.flat().map((page, i) => (
        <Fragment key={i}>
          {Object.keys(page)[0] === "reviewsCount" && (
            <h4>
              {name} - 리뷰 {page.reviewsCount}개
            </h4>
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
          <ul className="mt-2">
            {data?.pages?.map((page, pageIndex) => (
              <li key={`page-${pageIndex}`}>
                {page
                  ?.find((item) => "reviews" in item)
                  ?.reviews?.map((review: DrinkReviewType) => (
                    <div
                      key={review.id}
                      id={`review-${review.id}`}
                      className="flex flex-row gap-3 py-1"
                    >
                      <span className="shrink-0 overflow-hidden relative w-10 h-10 mt-1 rounded-full">
                        {review.author?.image ? (
                          <FallbackNextImage
                            src={review.author?.image}
                            alt={`${review.author?.name} 이미지`}
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
                            {review.author?.name}
                          </span>
                          <span className="text-gray-400 mr-2">
                            {dayjs(review.createdAt).fromNow()}
                          </span>
                          {(user?.role === "admin" ||
                            user?.email === review.author?.email) && (
                            <span className="text-gray-500">
                              <button
                                onClick={() => {
                                  setEditingId(review.id);
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
                                onClick={() => {
                                  if (confirm("리뷰를 지우시겠습니까?")) {
                                    deleteReview(review.id);
                                  }
                                  setEditingId(null);
                                }}
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
                        {editingId === review.id ? (
                          isUpdatingReview ? (
                            <div className="flex items-center justify-center py-4">
                              <CircularProgress aria-label="리뷰 저장 중 입니다" />
                            </div>
                          ) : (
                            <FormReview
                              id={id}
                              user={user!}
                              initialText={review.text}
                              submitLabel="저장"
                              autoFocus
                              onSubmit={(text) =>
                                updateReview({ id: review.id, text })
                              }
                              onCancel={() => setEditingId(null)}
                            />
                          )
                        ) : (
                          <>
                            <pre
                              className="whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeReviewText(review?.text || ""),
                              }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </>
      )}
      <div ref={ref}>
        {isFetchingNextPage && <CircularProgress aria-label="로딩중" />}
      </div>
    </>
  );
};

export default Reviews;
