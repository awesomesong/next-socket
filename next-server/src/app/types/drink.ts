import type { DrinkReview } from '@prisma/client';
import { InfiniteData } from '@tanstack/react-query';

export type DrinkReviewType = DrinkReview & {
    author:  {
        id: string;
        name?: string | null | undefined;
        email?: string | null | undefined;
        image?: string | null | undefined;
        profileImage?: string | null | undefined;
        role?: string | null | undefined;
    }
};

export type DrinkReviewPage = [
    { reviews: DrinkReviewType[] },
    { reviewsCount: number }
];

export type DrinkReviewsDataProps = InfiniteData<DrinkReviewPage>;

/**
 * 소켓 이벤트 페이로드 타입
 * New/Updated 이벤트 모두 동일한 구조를 사용하므로 통합
 */
export type DrinkReviewPayload = {
  drinkSlug: string;
  review: DrinkReviewType;
};

export type DrinkReviewDeletedPayload = {
  drinkSlug: string;
  reviewId: string;
};
