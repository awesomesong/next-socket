import type { QueryClient } from '@tanstack/react-query';

export type Review = { id: string } & Record<string, unknown>;

export type ReviewPage = [
  { reviews: Review[] },
  { reviewsCount: number }
];

export type ReviewsInfinite = { pages: ReviewPage[]; pageParams?: unknown[] };

export const drinkReviewsKey = (drinkSlug: string) => ['drinkReviews', drinkSlug] as const;

// ===== Internal Utils =====
type PageData = { reviews?: Review[]; reviewsCount?: number };

function extractPageData(page: unknown): { reviewsObj: { reviews: Review[] } | undefined; countObj: { reviewsCount: number } | undefined } {
  if (!Array.isArray(page)) return { reviewsObj: undefined, countObj: undefined };
  
  const arr = page as unknown as Array<PageData>;
  const reviewsObj = arr.find((p) => 'reviews' in p) as { reviews: Review[] } | undefined;
  const countObj = arr.find((p) => 'reviewsCount' in p) as { reviewsCount: number } | undefined;
  
  return { reviewsObj, countObj };
}

function createUpdatedPage(reviews: Review[], count: number): ReviewPage {
  return [
    { reviews },
    { reviewsCount: count }
  ];
}

function withReviewsCache(
  queryClient: QueryClient,
  drinkSlug: string,
  updater: (old: ReviewsInfinite | undefined) => ReviewsInfinite | undefined
): void {
  queryClient.setQueriesData({ queryKey: drinkReviewsKey(drinkSlug), exact: true }, updater);
}

export function prependReview(
  queryClient: QueryClient,
  drinkSlug: string,
  review: Review
): void {
  withReviewsCache(queryClient, drinkSlug, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    const { reviewsObj, countObj } = extractPageData(old.pages[0]);
    if (!reviewsObj) return old;

    const updatedFirstPage = createUpdatedPage(
      [review, ...reviewsObj.reviews],
      (countObj?.reviewsCount ?? 0) + 1
    );

    return {
      ...old,
      pages: [updatedFirstPage, ...old.pages.slice(1)]
    };
  });
}

export function replaceReviewById(
  queryClient: QueryClient,
  drinkSlug: string,
  matchId: string,
  serverReview: Review
): void {
  withReviewsCache(queryClient, drinkSlug, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    const updatedPages = old.pages.map(page => {
      const { reviewsObj, countObj } = extractPageData(page);
      if (!reviewsObj) return page;

      const updatedReviews = reviewsObj.reviews.map((r) => 
        r.id === matchId ? { ...r, ...serverReview } : r
      );

      return createUpdatedPage(updatedReviews, countObj?.reviewsCount ?? 0);
    });

    return {
      ...old,
      pages: updatedPages
    };
  });
}

export function removeReviewById(
  queryClient: QueryClient,
  drinkSlug: string,
  reviewId: string
): void {
  withReviewsCache(queryClient, drinkSlug, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    const updatedPages = old.pages.map(page => {
      const { reviewsObj, countObj } = extractPageData(page);
      if (!reviewsObj) return page;

      const filteredReviews = reviewsObj.reviews.filter((r) => r.id !== reviewId);
      const removedCount = reviewsObj.reviews.length - filteredReviews.length;

      return createUpdatedPage(
        filteredReviews,
        Math.max(0, (countObj?.reviewsCount ?? 0) - removedCount)
      );
    });

    return {
      ...old,
      pages: updatedPages
    };
  });
}