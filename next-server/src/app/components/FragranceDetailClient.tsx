'use client';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFragranceBySlug } from '@/src/app/lib/getFragrances';
import { deleteFragrance } from '@/src/app/lib/deleteFragrance';
import { fragranceListKey, fragranceDetailKey } from '@/src/app/lib/react-query/fragranceCache';
import FragranceMotionWrapper from '@/src/app/components/FragranceMotionWrapper';
import FragranceReviewSection from '@/src/app/components/FragranceReviewSection';
import { FragranceDetailSkeleton } from './FragranceSkeleton';
import ImageSlider from './ImageSlider';
import StatusMessage from './StatusMessage';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { InfiniteData } from '@tanstack/react-query';
import { FragranceType } from '../types/fragrance';

type Props = {
    slug: string;
};

export default function FragranceDetailClient({ slug }: Props) {
    const [sliderIndex, setSliderIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['fragrance', slug],
        queryFn: () => getFragranceBySlug(slug),
        // 서버에서 hydration 된 값을 바로 쓰고, 마운트 직후 중복 refetch를 줄임
        staleTime: 60 * 1000,
        refetchOnMount: false,
    });

    useEffect(() => {
        setSliderIndex(0);
    }, [slug]);

    const hasEditPermission = useMemo(() => {
        if (!session?.user?.email || !data?.fragrance?.authorEmail) {
            return false;
        }
        const isAuthor = session.user.email === data.fragrance.authorEmail;
        const isAdmin = session.user.role === 'admin';
        return isAuthor || isAdmin;
    }, [session?.user?.email, session?.user?.role, data?.fragrance?.authorEmail]);

    const handleDelete = async () => {
        if (!data?.fragrance) return;
        const confirmed = confirm(`"${data.fragrance.brand} ${data.fragrance.name}" 향수를 삭제하겠습니까?`);
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await deleteFragrance(data.fragrance.id);

            // 목록 캐시에서 제거
            queryClient.setQueryData<InfiniteData<FragranceType[]>>(fragranceListKey, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) =>
                        (page ?? []).filter((f) => f.id !== data.fragrance.id)
                    ),
                };
            });
            queryClient.removeQueries({ queryKey: fragranceDetailKey(slug), exact: true });

            toast.success('향수가 삭제되었습니다.');
            router.push('/');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : '향수 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <FragranceDetailSkeleton />;
    }

    if (error || !data?.fragrance) {
        return (
             <StatusMessage
                error={error instanceof Error ? error : undefined}
                fallbackMessage="향수 데이터를 가져오는데 실패했습니다."
            />
        );
    }

    const { fragrance } = data;

    return (
        <div className="fragrance-detail-layout">
            {/* 목록 / 수정 / 삭제 */}
            <div className="detail-action-bar">
                <Link href="/" className="action-btn">
                    목록
                </Link>
                {hasEditPermission && (
                    <>
                        <Link
                            href={`/fragrance/${fragrance.slug}/edit`}
                            className="action-btn"
                        >
                            수정
                        </Link>
                        <button
                            type="button"
                            className="action-btn"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? '삭제 중' : '삭제'}
                        </button>
                    </>
                )}
            </div>

            {fragrance.images?.length > 0 && (
                <div className="fragrance-form-layout">
                    <div className="fragrance-form-left">
                        <div className="fragrance-detail-image-box group">
                            <div className="fragrance-img-size bg-stone-200/20 dark:bg-stone-800/20">
                                <ImageSlider
                                    images={fragrance.images}
                                    currentIndex={sliderIndex}
                                    onSelectIndex={setSliderIndex}
                                    alt={`${fragrance.brand} ${fragrance.name}`}
                                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
                                    variant="default"
                                    aspectRatio="3/4"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="fragrance-form-right">
                        {fragrance.brand && (
                            <h2 className="text-top">
                                <span className="text-gradient-scent">{fragrance.brand} · {fragrance.name}</span>
                            </h2>
                        )}
                        {fragrance.description && (
                            <div
                                className="fragrance-info text-bottom text-[12px] md:text-[13px] leading-[1.8] text-stone-600 dark:text-stone-300/90 font-light tracking-wide"
                                dangerouslySetInnerHTML={{ __html: fragrance.description }}
                            />
                        )}

                        {fragrance.notes && (
                            <FragranceMotionWrapper delay={0}>
                                <div className="pt-8 border-t border-stone-200/60 dark:border-stone-700/40">
                                    <h3 className="text-gradient-scent text-sm font-bold tracking-[0.2em] uppercase text-stone-400 dark:text-stone-300 mb-4">
                                        노트 상세 정보
                                    </h3>
                                    <div
                                        className="text-[12px] md:text-[13px] leading-[1.7] text-stone-600 dark:text-stone-300 font-light whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{
                                            __html: fragrance.notes.replaceAll('\\n', '\n'),
                                        }}
                                    />
                                </div>
                            </FragranceMotionWrapper>
                        )}
                    </div>
                </div>
            )}

            <FragranceReviewSection
                fragranceName={`${fragrance.brand} ${fragrance.name}`}
                fragranceSlug={slug}
            />
        </div>
    );
}
