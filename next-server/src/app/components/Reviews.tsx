"use client";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import ScentUserAvatar from "./ScentUserAvatar";
import { getFragranceReviews } from "@/src/app/lib/getFragranceReviews";
import { Fragment, useEffect, useState, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { FragranceReviewType } from "@/src/app/types/fragrance";
import type {
  UpdateReviewResponse,
  PartialReviewUpdate,
  MutationContext,
  MutationError,
  ReviewsQueryData,
  ReviewPageItem,
} from "@/src/app/types/reviews";
import { updateFragranceReview } from "@/src/app/lib/updateFragranceReview";
import { deleteFragranceReview } from "@/src/app/lib/deleteFragranceReview";
import {
  replaceReviewById,
  removeReviewById,
  fragranceReviewsKey,
  type ReviewPage,
} from "@/src/app/lib/react-query/reviewsCache";
import FormReview from "./FormReview";
import { useSocket } from "../context/socketContext";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";
import { ReviewsSkeleton } from "./FragranceSkeleton";
import CircularProgress from "./CircularProgress";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
import EditableItemRow from "./EditableItemRow";

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
        return DOMPurify.sanitize(text || '');
      } catch (error) {
        console.warn('DOMPurify 로드 실패:', error);
        return text || '';
      }
    };
  }, []);

  const { data, status, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: fragranceReviewsKey(id),
      queryFn: getFragranceReviews,
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
          (acc: number, page: ReviewPage) => {
            const p = page.find((it: ReviewPageItem) => "reviews" in it) as
              | { reviews: { id: string }[] }
              | undefined;
            return acc + (p?.reviews?.length ?? 0);
          },
          0,
        );

        // 총 개수만큼 모두 로드했다면 다음 페이지 없음
        if (
          typeof countObj?.reviewsCount === "number" &&
          countObj.reviewsCount >= 0 &&
          loadedCount >= countObj.reviewsCount
        )
          return undefined;

        // ✅ 리뷰 배열이 비어있으면 다음 페이지 없음 (모바일 사파리 호환)
        if (!reviewsPage.reviews || reviewsPage.reviews.length === 0) {
          return undefined;
        }

        // 다음 페이지 커서 반환
        return reviewsPage.reviews.at(-1)?.id || undefined;
      },
    });

  // ✅ 사파리 호환성을 위한 useInView 설정
  // threshold: 0 (더 민감하게 반응), rootMargin: 100px (미리 트리거)
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
    triggerOnce: false,
  });

  const { mutateAsync: updateReview, isPending: isUpdatingReview } =
    useMutation({
      mutationFn: updateFragranceReview,
      onMutate: async ({ id: reviewId, text }) => {
        await queryClient.cancelQueries({
          queryKey: fragranceReviewsKey(id),
          exact: true,
        });
        const prev = queryClient.getQueryData<ReviewsQueryData>(fragranceReviewsKey(id));
        // ✅ 낙관적 텍스트 반영 (InfiniteQuery의 모든 페이지 순회)
        const partialUpdate: PartialReviewUpdate = { text };
        // replaceReviewById는 matchId를 사용하여 리뷰를 찾고 병합하므로 id 없이도 안전함
        replaceReviewById(queryClient, id, reviewId, partialUpdate);
        return { prev, reviewId } as MutationContext;
      },
      onSuccess: (updated, _vars, ctx) => {
        setEditingId(null);

        // 서버 응답 형태 정규화
        const updatedReview: FragranceReviewType | undefined =
          updated && typeof updated === "object" && "updateReview" in updated
            ? (updated as UpdateReviewResponse).updateReview
            : (updated as FragranceReviewType | undefined);

        // ✅ 최종 서버 데이터로 교체 (낙관적 업데이트를 서버 데이터로 덮어쓰기)
        // replaceReviewById가 모든 페이지를 순회하여 처리
        if (updatedReview?.id) {
          replaceReviewById(
            queryClient,
            id,
            ctx?.reviewId ?? updatedReview.id, // 낙관적 업데이트한 ID 사용
            updatedReview,
          );
        }

        // 소켓 브로드캐스트(리뷰 수정)
        try {
          socket?.emit(SOCKET_EVENTS.FRAGRANCE_REVIEW_UPDATED, {
            fragranceSlug: id,
            review: updatedReview,
          });
        } catch { }
      },
      onError: (err: MutationError, _vars, ctx) => {
        // ✅ 롤백: 이전 데이터로 완전 복원
        if (ctx?.prev) {
          queryClient.setQueryData<ReviewsQueryData>(fragranceReviewsKey(id), ctx.prev);
        }
        const message = err?.message || "리뷰 수정에 실패했습니다.";
        toast.error(message);
      },
    });

  const { mutate: deleteReview } = useMutation({
    mutationFn: deleteFragranceReview,
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({
        queryKey: fragranceReviewsKey(id),
        exact: true,
      });
      const prev = queryClient.getQueryData<ReviewsQueryData>(fragranceReviewsKey(id));
      // ✅ 낙관적 제거 + 카운트 -1 (InfiniteQuery의 모든 페이지 순회)
      removeReviewById(queryClient, id, deletedId);
      return { prev } as MutationContext;
    },
    onSuccess: (_result, deletedId) => {

      // 소켓 브로드캐스트(리뷰 삭제)
      try {
        socket?.emit(SOCKET_EVENTS.FRAGRANCE_REVIEW_DELETED, {
          fragranceSlug: id,
          reviewId: deletedId,
        });
      } catch { }
    },
    onError: (err: MutationError, _vars, ctx) => {
      // ✅ 롤백: 이전 데이터로 완전 복원
      if (ctx?.prev) {
        queryClient.setQueryData<ReviewsQueryData>(fragranceReviewsKey(id), ctx.prev);
      }
      const message = err?.message || "리뷰 삭제에 실패했습니다.";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      // ✅ 사파리에서 즉시 실행되도록 requestAnimationFrame 사용
      // ✅ 약간의 지연을 두어 DOM 업데이트가 완료된 후 실행
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          fetchNextPage();
        });
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <>
      {status === "pending" ? (
        <ReviewsSkeleton />
      ) : (
        <>
          {data?.pages[0]?.flat().map((page, i) => (
            <Fragment key={i}>
              {"reviewsCount" in page && (
                <h4 className="section-title">
                  <span className="text-gradient-scent">{name} - 리뷰 {page.reviewsCount}개</span>
                </h4>
              )}
            </Fragment>
          ))}
          <ul className="mt-2">
            {data?.pages?.map((page, pageIndex) => (
              <li key={`page-${pageIndex}`}>
                {(page
                  ?.find((item) => "reviews" in item) as { reviews: FragranceReviewType[] } | undefined)
                  ?.reviews?.map((review: FragranceReviewType) => (
                    <EditableItemRow
                      key={review.id}
                      id={review.id}
                      idPrefix="review"
                      authorName={review.author?.name}
                      authorImage={review.author?.image}
                      createdAt={review.createdAt}
                      canEdit={
                        user?.role === "admin" ||
                        user?.email === review.author?.email
                      }
                      isEditing={editingId === review.id}
                      isUpdating={isUpdatingReview}
                      onStartEdit={() => setEditingId(review.id)}
                      onDelete={() => {
                        deleteReview(review.id);
                        setEditingId(null);
                      }}
                      deleteConfirmMessage="리뷰를 지우시겠습니까?"
                      updatingLabel="리뷰 저장 중 입니다"
                      avatarFallback={<ScentUserAvatar />}
                      editForm={
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
                      }
                      contentHtml={sanitizeReviewText(review?.text || "")}
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

export default Reviews;
