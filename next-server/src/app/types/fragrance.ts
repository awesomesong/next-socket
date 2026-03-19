import type { Fragrance, FragranceReview } from '@prisma/client';
import { InfiniteData } from '@tanstack/react-query';

export type FragranceType = Fragrance;

export type FragranceAuthor = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profileImage?: string | null;
  role?: string | null;
};

export type FragranceWithAuthor = Fragrance & {
  author?: FragranceAuthor | null;
};

export type CreateFragranceRequest = {
  brand: string;
  name: string;
  images: string[];
  description: string;
  notes: string;
};

export type UpdateFragranceRequest = Partial<CreateFragranceRequest>;

export type CreateFragranceResponse = {
  success: boolean;
  newFragrance?: FragranceWithAuthor;
  message?: string;
};

export type UpdateFragranceResponse = {
  success: boolean;
  updatedFragrance?: FragranceWithAuthor;
  message?: string;
};

export type FragranceReviewType = FragranceReview & {
  author: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    profileImage?: string | null;
    role?: string | null;
  };
};

export type FragranceReviewPage = [
  { reviews: FragranceReviewType[] },
  { reviewsCount: number },
];

export type FragranceReviewsDataProps = InfiniteData<FragranceReviewPage>;

export type FragranceReviewPayload = {
  fragranceSlug: string;
  review: FragranceReviewType;
};

export type FragranceReviewDeletedPayload = {
  fragranceSlug: string;
  reviewId: string;
};
