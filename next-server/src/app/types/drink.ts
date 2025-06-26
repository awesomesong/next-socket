import type { DrinkReview } from '@prisma/client';
import { IUser } from '@/src/app/types/common';
import { InfiniteData } from '@tanstack/react-query';

export type DrinkReviewType = DrinkReview & {
    author: IUser;
};

export type DrinkReviewPage = [
    { reviews: DrinkReviewType[] },
    { reviewsCount: number }
];

export type DrinkReviewsDataProps = InfiniteData<DrinkReviewPage>;
