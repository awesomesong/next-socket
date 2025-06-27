'use client';
import dayjs from '@/src/app/lib/day';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PiUserCircleFill } from 'react-icons/pi';
import { getDrinkReviews } from '@/src/app/lib/getDrinkReviews';
import { Fragment, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { DrinkReviewType } from '@/src/app/types/drink';
import { updateDrinkReview } from '@/src/app/lib/updateDrinkReview';
import { deleteDrinkReview } from '@/src/app/lib/deleteDrinkReview';
import FormReview from './FormReview';
import CommentSkeleton from './skeleton/CommentSkeleton';
import CircularProgress from './CircularProgress';
import FallbackNextImage from './FallbackNextImage';
import DOMPurify from 'dompurify';

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

const Reviews = ({ id, name, user } : ReviewsProps) => {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);

    const {
        data,
        status,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['drinkReviews', id],
        queryFn: getDrinkReviews,
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            const reviewsPage = lastPage.find((item) => 'reviews' in item) as { reviews: { id: string }[] } | undefined;
            if (!reviewsPage || !reviewsPage.reviews?.length) return undefined;
            const lastReviewId = reviewsPage.reviews?.at(-1)?.id;
            return lastReviewId || undefined;
        }
    });

    const { ref, inView } = useInView({ threshold: 0.2, delay: 100 });

    const { mutateAsync: updateReview } = useMutation({
        mutationFn: updateDrinkReview,
        onSuccess: () => {
            setEditingId(null);
            queryClient.invalidateQueries({ queryKey: ['drinkReviews', id] });
        }
    });

    const { mutate: deleteReview } = useMutation({
        mutationFn: deleteDrinkReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drinkReviews', id] });
        }
    });

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView]);

    return (
        <>
            {data?.pages[0]?.flat().map((page, i) => (
                <Fragment key={i}>
                    {Object.keys(page)[0] === 'reviewsCount' && (
                        <h4>{name} - 리뷰 {page.reviewsCount}개</h4>
                    )}
                </Fragment>
            ))}
            {status === 'pending' ? (
                <div className='flex flex-col gap-3'>
                    <CommentSkeleton />
                    <CommentSkeleton />
                    <CommentSkeleton />
                    <CommentSkeleton />
                </div>
            ) : (
                <>
                    <ul className='mt-2'>
                        {data?.pages?.flat().map((page, i) => (
                            <li key={i}>
                                {page?.reviews && page.reviews.length > 0 && Object.keys(page)[0] === 'reviews' &&
                                    page.reviews?.map((review: DrinkReviewType) => (
                                        <div 
                                            key={review.id}
                                            id={`review-${review.id}`}
                                            className='flex flex-row gap-3 py-1'
                                        >
                                            <span className='shrink-0 overflow-hidden relative w-10 h-10 mt-1 rounded-full'>
                                                {review.author?.image ? (
                                                    <FallbackNextImage
                                                        src={review.author?.image}
                                                        alt={`${review.author?.name} 이미지`}
                                                        fill
                                                        className='object-cover'
                                                        unoptimized={false}
                                                    />
                                                ) : (
                                                    <PiUserCircleFill className='w-full h-full' />
                                                )}
                                            </span>
                                            <div className='flex-1'>
                                                <div className='inline-flex items-end flex-wrap'>
                                                    <span className='break-all mr-2'>
                                                        {review.author?.name}
                                                    </span>
                                                    <span className='text-gray-400 mr-2'>
                                                        {dayjs(review.createdAt).fromNow()}
                                                    </span>
                                                    {user?.role === 'admin' || user?.email === review.author?.email && (
                                                        <span className='text-gray-500'>
                                                            <button 
                                                                onClick={() => {setEditingId(review.id);}}
                                                                className='
                                                                    px-3
                                                                    py-1 
                                                                    mr-2
                                                                    rounded-full
                                                                    text-xs
                                                                    text-blue-500
                                                                    border-blue-500
                                                                    border-1
                                                                '
                                                            >
                                                                수정
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    if (confirm('리뷰를 지우시겠습니까?')) {
                                                                        deleteReview(review.id);
                                                                    }
                                                                    setEditingId(null);
                                                                }} 
                                                                className='
                                                                    px-3
                                                                    py-1 
                                                                    rounded-full
                                                                    text-xs
                                                                    text-gray-500
                                                                    border-gray-500
                                                                    dark:text-gray-400
                                                                    dark:border-gray-400
                                                                    border-1
                                                                '
                                                            >
                                                                삭제
                                                            </button>
                                                        </span>
                                                    )}
                                                </div>
                                                {editingId === review.id ? (
                                                    <FormReview
                                                        id={id}
                                                        user={user!}
                                                        initialText={review.text}
                                                        submitLabel='저장'
                                                        autoFocus
                                                        onSubmit={(text) => updateReview({ id: review.id, text })}
                                                        onCancel={() => setEditingId(null)}
                                                    />
                                                ) : (
                                                    <>
                                                        <pre
                                                            className='whitespace-pre-wrap'
                                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review?.text || '') }}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <div ref={ref}>
                {isFetchingNextPage && (
                    <CircularProgress aria-label='로딩중' />
                )}
            </div>
        </>
    );
};

export default Reviews;
