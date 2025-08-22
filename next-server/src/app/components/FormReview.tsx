'use client';
import TextareaAutosize from 'react-textarea-autosize';
import React, { useRef, useState, FormEvent, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDrinkReviews } from '@/src/app/lib/createDrinkReviews';
import { DrinkReviewsDataProps, DrinkReviewType } from '@/src/app/types/drink';
import { useSocket } from "../context/socketContext";
import toast from 'react-hot-toast';
import { prependReview, replaceReviewById, upsertPrependReview, drinkReviewsKey } from '@/src/app/lib/reviewsCache';

type FormReviewProps = {
    id: string;
    user: {
        role?: string;
        id: string;
        name?: string | null | undefined;
        email?: string | null | undefined;
        image?: string | null | undefined;
    };
    /** 초기 표시할 리뷰 내용. 수정 폼에서 사용 */
    initialText?: string;
    /** 저장 버튼 텍스트 */
    submitLabel?: string;
    /** 저장 동작을 직접 처리하고 싶을 때 전달 */
    onSubmit?: (text: string) => Promise<unknown> | void;
    /** 취소 버튼 클릭 시 호출 */
    onCancel?: () => void;
    /** 컴포넌트가 나타날 때 자동으로 포커스 */
    autoFocus?: boolean;
};

const FormReview = ({ 
    id, 
    user, 
    initialText = '', 
    submitLabel = '확인', 
    onSubmit, 
    onCancel,
    autoFocus = false
}: FormReviewProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [review, setReview] = useState<string>(initialText);
    const [stateReview, setStateReview] = useState(Boolean(onSubmit) ? true : false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const socket = useSocket();

    useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [autoFocus]);

    const { mutate: createDrinkReviewsMutation } = useMutation<
        { newReview: DrinkReviewType },
        Error,
        { id: string; text: string },
        { prev?: DrinkReviewsDataProps; optimisticId: string }
    >({
        mutationFn: createDrinkReviews,
        onMutate: async ({ id, text }) => {
            await queryClient.cancelQueries({ queryKey: drinkReviewsKey(id), exact: true });
            const prev = queryClient.getQueryData(drinkReviewsKey(id)) as DrinkReviewsDataProps | undefined;
            const optimistic: DrinkReviewType = {
                id: `temp-${Date.now()}`,
                drinkSlug: id,
                text,
                createdAt: new Date(),
                updatedAt: new Date(),
                authorEmail: user.email ?? null,
                author: { id: user.id, name: user.name ?? '', email: user.email ?? '', image: user.image ?? null },
            };
            prependReview(queryClient, id, optimistic);
            return { prev, optimisticId: optimistic.id };
        },
        onSuccess: (newData, _vars, ctx) => {
            setReview('');
            // temp 치환
            replaceReviewById(queryClient, id, ctx?.optimisticId!, { ...newData.newReview, author: user });
            const reviewId = newData.newReview.id;
            // 소켓 브로드캐스트(리뷰 생성)
            try {
                socket?.emit('drink:review:new', {
                    drinkSlug: id,
                    review: {
                        ...newData.newReview,
                        author: {
                            name: user.name ?? '',
                            email: user.email ?? '',
                            image: user.image ?? null,
                        },
                    },
                });
            } catch {}
            setTimeout(() => {
                document.getElementById(`review-${reviewId}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }, 100);
        },
        onError: (err, _vars, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(drinkReviewsKey(id), ctx.prev);
            const message = err?.message || '리뷰 등록에 실패했습니다.';
            toast.error(message);
        },
    });

    const onFocus = () => {
        if(!user.email) return;
        setStateReview(true);
    };

    const handleSubmitReview = (e: FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (review.trim() === '') {
            textareaRef.current?.focus();
            return alert('리뷰를 입력해주세요.');
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (onSubmit) {
            Promise.resolve(onSubmit(review))
                .then((result: unknown) => {
                    const saved = (result && typeof result === 'object') ? (result as any) : undefined;
                    const savedReview: DrinkReviewType | undefined = saved?.newReview ?? saved;

                    if (savedReview?.id) {
                        const normalized: DrinkReviewType = {
                          id: savedReview.id,
                          drinkSlug: savedReview.drinkSlug ?? id,
                          text: savedReview.text ?? '',
                          createdAt: savedReview.createdAt instanceof Date ? savedReview.createdAt : new Date(savedReview.createdAt ?? Date.now()),
                          updatedAt: new Date(),
                          authorEmail: savedReview.authorEmail ?? user.email ?? null,
                          author: savedReview.author ?? {
                            id: user.id,
                            name: user.name ?? '',
                            email: user.email ?? '',
                            image: user.image ?? null,
                          },
                        };
                    
                        upsertPrependReview(queryClient, id, normalized);
                    }

                    onCancel?.();
                })
                .finally(() => setIsSubmitting(false));
        } else {
            createDrinkReviewsMutation(
                { id, text: review },
                {
                    onSettled: () => {
                        setIsSubmitting(false);
                    }
                }
            );
        }
    };

    return (
        <div className='my-4'>
            <TextareaAutosize
                ref={textareaRef}
                disabled={user?.email ? false : true}
                placeholder={user?.email ? '리뷰를 입력해주세요.' : '로그인 후에 리뷰를 작성할 수 있습니다.'}
                value={review}
                onChange={e => setReview(e.target.value)}
                onFocus={onFocus}
                className='w-full p-2 box-border border-solid border-b-[1px]'
            />
            {stateReview && (
                <div className='flex gap-2 mt-2'>
                    <button
                        onClick={handleSubmitReview}
                        type='submit'
                        className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md'
                    >
                        {isSubmitting ? '등록 중' : submitLabel}
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            type='button'
                            className='px-4 py-2 bg-gray-600 rounded-md text-white'
                        >
                            취소
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FormReview;
