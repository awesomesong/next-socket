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
import { prependReview, replaceReviewById, removeReviewById, drinkReviewsKey } from '@/src/app/lib/reviewsCache';
import type { ReviewsInfinite } from '@/src/app/lib/reviewsCache';
import FormReview from './FormReview';
import { useSocket } from '../context/socketContext';
import CommentSkeleton from './skeleton/CommentSkeleton';
import CircularProgress from './CircularProgress';
import FallbackNextImage from './FallbackNextImage';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';

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
    const socket = useSocket();
    const [editingId, setEditingId] = useState<string | null>(null);

    const isAllReviewsLoaded = (): boolean => {
        const cached = queryClient.getQueryData(drinkReviewsKey(id)) as ReviewsInfinite | undefined;
        if (!(cached && Array.isArray(cached.pages))) return false;
        const totalLoaded = cached.pages.reduce((acc: number, page) => {
            const p = (page as any[]).find((item: any) => 'reviews' in item) as { reviews: { id: string }[] } | undefined;
            return acc + (p?.reviews?.length ?? 0);
        }, 0);
        const countObj = (cached.pages[0] as any[])?.find((item: any) => 'reviewsCount' in item) as { reviewsCount: number } | undefined;
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
        queryKey: drinkReviewsKey(id),
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
        onMutate: async ({ id: reviewId, text }) => {
            await queryClient.cancelQueries({ queryKey: drinkReviewsKey(id), exact: true });
            const prev = queryClient.getQueryData(drinkReviewsKey(id));
            // 낙관적 텍스트 반영
            replaceReviewById(queryClient, id, reviewId, { text } as any);
            return { prev };
        },
        onSuccess: (updated) => {
            setEditingId(null);
            // 서버 응답 형태 정규화: { updateReview } 또는 바로 객체
            const updatedReview = (updated && typeof updated === 'object' && 'updateReview' in updated)
                ? (updated as any).updateReview
                : updated;

            // 최종 서버 데이터로 해당 리뷰만 치환
            if (updatedReview?.id) {
                replaceReviewById(queryClient, id, updatedReview.id, updatedReview as any);
            }

            // 일부 페이지만 로드된 경우에만 서버 원본 재검증
            if (!isAllReviewsLoaded()) {
                queryClient.invalidateQueries({ queryKey: drinkReviewsKey(id), exact: true });
            }

            // 소켓 브로드캐스트(리뷰 수정)
            try {
                socket?.emit('drink:review:updated', { drinkSlug: id, review: updatedReview });
            } catch {}
        },
        onError: (err: any, _vars, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(drinkReviewsKey(id), ctx.prev as any);
            const message = err?.message || '리뷰 수정에 실패했습니다.';
            toast.error(message);
        }
    });

    const { mutate: deleteReview } = useMutation({
        mutationFn: deleteDrinkReview,
        onMutate: async (deletedId: string) => {
            await queryClient.cancelQueries({ queryKey: drinkReviewsKey(id), exact: true });
            const prev = queryClient.getQueryData(drinkReviewsKey(id));
            // 낙관적 제거 + 카운트 -1
            removeReviewById(queryClient, id, deletedId);
            return { prev };
        },
        onSuccess: (_result, deletedId) => {
            // 모든 페이지가 이미 로드되었으면 재검증 생략
            if (!isAllReviewsLoaded()) {
                queryClient.invalidateQueries({ queryKey: drinkReviewsKey(id), exact: true });
            }

            // 소켓 브로드캐스트(리뷰 삭제)
            try {
                socket?.emit('drink:review:deleted', { drinkSlug: id, reviewId: deletedId });
            } catch {}
        },
        onError: (err: any, _vars, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(drinkReviewsKey(id), ctx.prev as any);
            const message = err?.message || '리뷰 삭제에 실패했습니다.';
            toast.error(message);
        }
    });

    // 소켓 수신: 리뷰 생성/수정/삭제 실시간 반영
    useEffect(() => {
        if (!socket) return;

        const handleNew = (payload: { drinkSlug: string; review: DrinkReviewType }) => {
            if (payload.drinkSlug !== id) return;
            prependReview(queryClient, id, payload.review as any);
        };

        const handleUpdated = (payload: { drinkSlug: string; review: DrinkReviewType }) => {
            if (payload.drinkSlug !== id) return;
            replaceReviewById(queryClient, id, payload.review.id, payload.review as any);
        };

        const handleDeleted = (payload: { drinkSlug: string; reviewId: string }) => {
            if (payload.drinkSlug !== id) return;
            removeReviewById(queryClient, id, payload.reviewId);
        };

        socket.on('drink:review:new', handleNew);
        socket.on('drink:review:updated', handleUpdated);
        socket.on('drink:review:deleted', handleDeleted);
        return () => {
            socket.off('drink:review:new', handleNew);
            socket.off('drink:review:updated', handleUpdated);
            socket.off('drink:review:deleted', handleDeleted);
        };
    }, [socket, id, queryClient]);

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
