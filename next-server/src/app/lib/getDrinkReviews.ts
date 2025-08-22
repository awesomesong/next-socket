import toast from "react-hot-toast";
import type { QueryFunctionContext } from '@tanstack/react-query';
import { drinkReviewsKey } from '@/src/app/lib/reviewsCache';

export const getDrinkReviews = async (
    { queryKey, pageParam }: QueryFunctionContext<ReturnType<typeof drinkReviewsKey>, string>
) => {
    const [_key, id ] = queryKey;
    const cursor = pageParam ?? null;

    try {
        const res = await fetch(`/api/drinks/review/${id}?cursor=${cursor}`, {
            next: {
                tags: [_key]
            },
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const { reviews, reviewsCount } = await res.json();

        if(!res.ok) {
            toast.error('리뷰를 찾지 못했습니다.');
        }

        return [{ reviews }, { reviewsCount }];

    } catch (error) {
        console.log('error');
    }
};
