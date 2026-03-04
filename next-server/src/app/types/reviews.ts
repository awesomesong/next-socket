import type { FragranceReviewType } from "./fragrance";
import type { ReviewPage, ReviewsInfinite } from "@/src/app/lib/react-query/reviewsCache";

// ===== API Response Types =====
export interface UpdateReviewResponse {
  updateReview: FragranceReviewType;
}

export interface DeleteReviewResponse {
  id: string;
}

// ===== Mutation Types =====
export interface PartialReviewUpdate extends Record<string, unknown> {
  text: string;
  id?: string;
}

export interface MutationContext {
  prev: ReviewsInfinite | undefined;
  reviewId?: string;
}

export type MutationError = Error & {
  message?: string;
  error?: string;
};

// ===== Query Page Types =====
export type ReviewPageItem = ReviewPage[number];

export type ReviewsQueryData = ReviewsInfinite;

