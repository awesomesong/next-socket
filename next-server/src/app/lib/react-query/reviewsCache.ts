import type { QueryClient } from "@tanstack/react-query";

export type Review = { id: string } & Record<string, unknown>;

export type ReviewPage = [{ reviews: Review[] }, { reviewsCount: number }];

export type ReviewsInfinite = { pages: ReviewPage[]; pageParams?: unknown[] };

export const drinkReviewsKey = (drinkSlug: string) =>
  ["drinkReviews", drinkSlug] as const;

// ===== Internal Utils =====
type PageData = { reviews?: Review[]; reviewsCount?: number };

function extractPageData(page: unknown): {
  reviewsObj: { reviews: Review[] } | undefined;
  countObj: { reviewsCount: number } | undefined;
} {
  if (!Array.isArray(page))
    return { reviewsObj: undefined, countObj: undefined };

  // ✅ 최적화: 한 번만 순회 (2번 find → 1번 loop)
  const arr = page as unknown as Array<PageData>;
  let reviewsObj: { reviews: Review[] } | undefined;
  let countObj: { reviewsCount: number } | undefined;

  for (const p of arr) {
    if ("reviews" in p) reviewsObj = p as { reviews: Review[] };
    else if ("reviewsCount" in p) countObj = p as { reviewsCount: number };
    if (reviewsObj && countObj) break; // 둘 다 찾으면 조기 종료
  }

  return { reviewsObj, countObj };
}

function createUpdatedPage(reviews: Review[], count: number): ReviewPage {
  return [{ reviews }, { reviewsCount: count }] as ReviewPage;
}

function withReviewsCache(
  queryClient: QueryClient,
  drinkSlug: string,
  updater: (old: ReviewsInfinite | undefined) => ReviewsInfinite | undefined,
): void {
  queryClient.setQueriesData(
    { queryKey: drinkReviewsKey(drinkSlug), exact: true },
    updater,
  );
}

export function prependReview(
  queryClient: QueryClient,
  drinkSlug: string,
  review: Review,
): void {
  withReviewsCache(queryClient, drinkSlug, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    const { reviewsObj, countObj } = extractPageData(old.pages[0]);
    if (!reviewsObj) return old;

    const updatedFirstPage = createUpdatedPage(
      [review, ...reviewsObj.reviews],
      (countObj?.reviewsCount ?? 0) + 1,
    );

    return {
      ...old,
      pages: [updatedFirstPage, ...old.pages.slice(1)],
    };
  });
}

export function replaceReviewById(
  queryClient: QueryClient,
  drinkSlug: string,
  matchId: string,
  serverReview: Partial<Review>,
): void {
  withReviewsCache(queryClient, drinkSlug, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    let hasChanges = false;
    const updatedPages = old.pages.map((page) => {
      const { reviewsObj, countObj } = extractPageData(page);
      if (!reviewsObj) return page;

      const idx = reviewsObj.reviews.findIndex((r) => r.id === matchId);
      if (idx === -1) return page; // 해당 리뷰가 이 페이지에 없으면 원본 유지

      // ✅ 최적화: idx 활용하여 직접 교체 (전체 map 대신)
      const updatedReviews = [...reviewsObj.reviews];
      updatedReviews[idx] = { ...reviewsObj.reviews[idx], ...serverReview };
      hasChanges = true;

      return createUpdatedPage(updatedReviews, countObj?.reviewsCount ?? 0);
    });

    // ✅ 변경 없으면 원본 반환 (참조 동일성)
    return hasChanges ? { ...old, pages: updatedPages } : old;
  });
}

export function removeReviewById(
  queryClient: QueryClient,
  drinkSlug: string,
  reviewId: string,
): void {
  withReviewsCache(queryClient, drinkSlug, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    let hasChanges = false;
    const updatedPages = old.pages.map((page) => {
      const { reviewsObj, countObj } = extractPageData(page);
      if (!reviewsObj) return page;

      const filteredReviews = reviewsObj.reviews.filter(
        (r) => r.id !== reviewId,
      );
      const removedCount = reviewsObj.reviews.length - filteredReviews.length;
      
      // ✅ 이 페이지에서 제거되지 않았으면 원본 유지
      if (removedCount === 0) return page;
      
      hasChanges = true;
      return createUpdatedPage(
        filteredReviews,
        Math.max(0, (countObj?.reviewsCount ?? 0) - removedCount),
      );
    });

    // ✅ 변경 없으면 원본 반환 (참조 동일성)
    return hasChanges ? { ...old, pages: updatedPages } : old;
  });
}
