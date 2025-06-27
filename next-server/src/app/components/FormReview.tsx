'use client';
import TextareaAutosize from 'react-textarea-autosize';
import React, { useRef, useState, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDrinkReviews } from '@/src/app/lib/createDrinkReviews';
import { DrinkReviewsDataProps, DrinkReviewType } from '@/src/app/types/drink';

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
};

const FormReview = ({ id, user, initialText = '', submitLabel = '확인', onSubmit, onCancel }: FormReviewProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [review, setReview] = useState<string>(initialText);
    const [stateReview, setStateReview] = useState(Boolean(onSubmit) ? true : false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const { mutate: createDrinkReviewsMutation } = useMutation({
        mutationFn: createDrinkReviews,
        onSuccess: (newData) => {
            setReview('');
            queryClient.setQueriesData({ queryKey: ['drinkReviews', id] },
                (oldData: DrinkReviewsDataProps | undefined): DrinkReviewsDataProps => {
                    const newReviewData = newData.newReview;
                    newReviewData.author = user;

                    if (!oldData || oldData.pages.length === 0) {
                        return {
                            pages: [[
                                { reviews: [newReviewData] },
                                { reviewsCount: 1 }
                            ]],
                            pageParams: [undefined],
                        };
                    }

                    const currentPage = oldData.pages[0];
                    const reviewsObj = currentPage.find((p) => 'reviews' in p) as { reviews: DrinkReviewType[] };
                    const countObj = currentPage.find((p) => 'reviewsCount' in p) as { reviewsCount: number };

                    const updatedPage: [ { reviews: DrinkReviewType[] }, { reviewsCount: number } ] = [
                        { reviews: [newReviewData, ...reviewsObj.reviews] },
                        { reviewsCount: countObj.reviewsCount + 1 }
                    ];

                    return {
                        ...oldData,
                        pages: [updatedPage, ...oldData.pages.slice(1)],
                    };
                }
            );
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
                .then(() => {
                    queryClient.invalidateQueries({ queryKey: ['drinkReviews', id] });
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
                            className='px-4 py-2 text-gray-600 border rounded-md'
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
