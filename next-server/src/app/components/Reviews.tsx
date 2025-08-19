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

    const isAllReviewsLoaded = (): boolean => {
        const cached = queryClient.getQueryData<any>(['drinkReviews', id]);
        if (!(cached && Array.isArray(cached.pages))) return false;
        const totalLoaded = cached.pages.reduce((acc: number, page: any) => {
            const p = page.find((item: any) => 'reviews' in item) as { reviews: { id: string }[] } | undefined;
            return acc + (p?.reviews?.length ?? 0);
        }, 0);
        const countObj = cached.pages[0]?.find((item: any) => 'reviewsCount' in item) as { reviewsCount: number } | undefined;
        const totalCount = countObj?.reviewsCount ?? undefined;
        return typeof totalCount === 'number' && totalLoaded >= totalCount;
    };

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
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage) return undefined;
            const reviewsPage = lastPage.find((item) => 'reviews' in item) as { reviews: { id: string }[] } | undefined;
            const countObj = lastPage.find((item) => 'reviewsCount' in item) as { reviewsCount: number } | undefined;
            if (!reviewsPage) return undefined;

            // 지금까지 로드된 총 리뷰 개수
            const loadedCount = (allPages ?? []).reduce((acc: number, page: any) => {
                const p = page.find((it: any) => 'reviews' in it) as { reviews: { id: string }[] } | undefined;
                return acc + (p?.reviews?.length ?? 0);
            }, 0);

            // 총 개수만큼 모두 로드했다면 다음 페이지 없음
            if (typeof countObj?.reviewsCount === 'number' && loadedCount >= countObj.reviewsCount) return undefined;

            // 다음 페이지 커서 반환
            return reviewsPage.reviews.at(-1)?.id || undefined;
        }
    });

    const { ref, inView } = useInView({ threshold: 0.2, delay: 100 });

    const { mutateAsync: updateReview } = useMutation({
        mutationFn: updateDrinkReview,
        onSuccess: (updated) => {
            setEditingId(null);
            // 서버 응답 형태 정규화: { updateReview } 또는 바로 객체
            const updatedReview = (updated && typeof updated === 'object' && 'updateReview' in updated)
                ? (updated as any).updateReview
                : updated;

            // 낙관적 갱신: 모든 페이지에서 해당 리뷰 텍스트 갱신
            queryClient.setQueriesData(
                { queryKey: ['drinkReviews', id] },
                (oldData: any) => {
                    if (!oldData || oldData.pages.length === 0 || !updatedReview?.id) return oldData;
                    const nextPages = oldData.pages.map((page: any) => {
                        const reviewsObj = page.find((p: any) => 'reviews' in p) as { reviews: DrinkReviewType[] } | undefined;
                        const countObj = page.find((p: any) => 'reviewsCount' in p) ?? { reviewsCount: 0 };
                        if (!reviewsObj) return page;
                        const nextReviews = reviewsObj.reviews.map((r: DrinkReviewType) =>
                            r.id === updatedReview.id ? { ...r, ...updatedReview } : r
                        );
                        return [ { reviews: nextReviews }, countObj ];
                    });
                    return { ...oldData, pages: nextPages };
                }
            );

            // 모든 페이지가 이미 로드된 경우에는 불필요한 재검증을 생략
            if (isAllReviewsLoaded()) return; // 이미 전체 로드 완료 → 재검증 불필요
            // 일부 페이지만 로드된 경우에만 서버 원본 재검증
            queryClient.invalidateQueries({ queryKey: ['drinkReviews', id], exact: true });
        }
    });

    const { mutate: deleteReview } = useMutation({
        mutationFn: deleteDrinkReview,
        onSuccess: (result, deletedId) => {
            // 낙관적 갱신: 모든 페이지에서 해당 리뷰 제거 및 총 카운트 -1
            queryClient.setQueriesData(
                { queryKey: ['drinkReviews', id] },
                (oldData: any) => {
                    if (!oldData || oldData.pages.length === 0) return oldData;

                    const firstPage = oldData.pages[0];
                    const countObj = firstPage.find((p: any) => 'reviewsCount' in p) as { reviewsCount: number } | undefined;
                    const nextPages = oldData.pages.map((page: any) => {
                        const reviewsObj = page.find((p: any) => 'reviews' in p) as { reviews: DrinkReviewType[] } | undefined;
                        const cObj = page.find((p: any) => 'reviewsCount' in p) as { reviewsCount: number } | undefined;
                        if (!reviewsObj) return page;
                        const nextReviews = reviewsObj.reviews.filter((r: DrinkReviewType) => r.id !== deletedId);
                        const nextCount = Math.max(0, (cObj?.reviewsCount ?? countObj?.reviewsCount ?? 0) - 1);
                        return [ { reviews: nextReviews }, { reviewsCount: nextCount } ];
                    });
                    return { ...oldData, pages: nextPages };
                }
            );

            // 모든 페이지가 이미 로드되었으면 재검증 생략
            if (isAllReviewsLoaded()) return; // 전체 로드 → 재검증 불필요

            // 일부 페이지만 로드된 경우에만 서버 원본 재검증
            queryClient.invalidateQueries({ queryKey: ['drinkReviews', id], exact: true });
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
