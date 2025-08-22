import type { QueryClient } from '@tanstack/react-query';

export type Review = { id: string } & Record<string, unknown>;

export type ReviewPage = [
  { reviews: Review[] },
  { reviewsCount: number }
];

export type ReviewsInfinite = { pages: ReviewPage[]; pageParams?: unknown[] };

export const drinkReviewsKey = (drinkSlug: string) => ['drinkReviews', drinkSlug] as const;

function withDrinkReviewsCache(
  queryClient: QueryClient,
  drinkSlug: string,
  transform: (reviews: Review[], count: number) => { reviews: Review[]; count: number }
): void {
  queryClient.setQueriesData({ queryKey: drinkReviewsKey(drinkSlug), exact: true }, (old: ReviewsInfinite | undefined) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    const nextPages = old.pages.map((page) => {
      const arr = page as unknown as Array<{ reviews?: Review[]; reviewsCount?: number }>;
      const reviewsObj = arr.find((p) => 'reviews' in p) as { reviews: Review[] } | undefined;
      const countObj = arr.find((p) => 'reviewsCount' in p) as { reviewsCount: number } | undefined;
      if (!reviewsObj) return page;

      const res = transform(reviewsObj.reviews ?? [], countObj?.reviewsCount ?? 0);
      return [{ reviews: res.reviews }, { reviewsCount: res.count }];
    });

    return { ...old, pages: nextPages };
  });
}

export function prependReview(
  queryClient: QueryClient,
  drinkSlug: string,
  review: Review
): void {
  withDrinkReviewsCache(queryClient, drinkSlug, (reviews, count) => ({
    reviews: [review, ...reviews],
    count: count + 1,
  }));
}

export function replaceReviewById(
  queryClient: QueryClient,
  drinkSlug: string,
  matchId: string,
  serverReview: Review
): void {
  withDrinkReviewsCache(queryClient, drinkSlug, (reviews, count) => ({
    reviews: reviews.map((r) => (r.id === matchId ? { ...r, ...serverReview } : r)),
    count,
  }));
}

export function removeReviewById(
  queryClient: QueryClient,
  drinkSlug: string,
  reviewId: string
): void {
  withDrinkReviewsCache(queryClient, drinkSlug, (reviews, count) => ({
    reviews: reviews.filter((r) => r.id !== reviewId),
    count: Math.max(0, count - 1),
  }));
}

export function upsertPrependReview(
  queryClient: QueryClient,
  drinkSlug: string,
  review: Review
): void {
  withDrinkReviewsCache(queryClient, drinkSlug, (reviews, count) => {
    const idx = reviews.findIndex((r) => r.id === review.id);
    if (idx === -1) {
      return { reviews: [review, ...reviews], count: count + 1 };
    }
    const next = reviews.map((r, i) => (i === idx ? { ...r, ...review } : r));
    return { reviews: next, count };
  });
}