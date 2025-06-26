import type { DrinkReview } from '@prisma/client';
import { IUser } from '@/src/app/types/common';
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
