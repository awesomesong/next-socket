"use client";

/**
 * ScentMemoriesHeroSkeleton
 * Hero section loading placeholder — same section structure as ScentMemoriesHero.
 */
export const ScentMemoriesHeroSkeleton = () => {
    return (
        <section className="scent-hero" aria-label="로딩 중">
            <div className="scent-hero-skeleton-gradient" />
        </section>
    );
};

/**
 * FragranceCardSkeleton
 * Reusable skeleton for individual fragrance cards in a grid layout.
 * Replicates the style and colors from ProductFragrance.tsx
 */
export const FragranceCardSkeleton = () => {
    return (
        <div className="product-fragrance-skeleton-card product-fragrance-card-layout skeleton-pulse w-full">
            <div className="product-fragrance-card-image-box rounded-lg skeleton-bg w-full" />
            <div className="text-center w-fit flex flex-col items-center gap-2">
                <div className="w-16 h-2 rounded-full skeleton-bg-muted shrink-0" />
                <div className="w-24 h-4 rounded-full skeleton-bg shrink-0" />
            </div>
            <div className="w-6 h-px product-fragrance-accent-line opacity-50 shrink-0" />
        </div>
    );
};

/**
 * FragranceDetailSkeleton
 * Reusable skeleton for the fragrance detail view — same layout/classes as FragranceDetailClient.
 */
export const FragranceDetailSkeleton = () => {
    return (
        <div className="fragrance-detail-layout skeleton-pulse">
            {/* 목록/수정/삭제 영역과 동일한 상단 여백 유지 */}
            <div className="detail-action-bar">
                <div className="h-8 w-14 rounded-full skeleton-bg-muted" aria-hidden />
            </div>
            <div className="fragrance-form-layout">
                <div className="fragrance-form-left">
                    <div className="fragrance-detail-image-box">
                        <div className="fragrance-img-size skeleton-bg" />
                    </div>
                </div>
                <div className="fragrance-form-right">
                    <div className="space-y-6">
                        <div className="w-1/3 h-2 rounded-full skeleton-bg-muted" />
                        <div className="w-1/2 h-6 rounded-full skeleton-bg" />
                        <div className="space-y-3 pt-4">
                            <div className="w-full h-3 rounded-full skeleton-bg-muted-80" />
                            <div className="w-11/12 h-3 rounded-full skeleton-bg-muted-80" />
                            <div className="w-full h-3 rounded-full skeleton-bg-muted-80" />
                        </div>
                    </div>
                    <div className="pt-8 border-t border-stone-200/60 dark:border-stone-700/40 space-y-4">
                        <div className="w-24 h-2 rounded-full skeleton-bg-muted" />
                        <div className="space-y-3">
                            <div className="w-full h-3 rounded-full skeleton-bg-muted-80" />
                            <div className="w-3/4 h-3 rounded-full skeleton-bg-muted-80" />
                        </div>
                    </div>
                </div>
            </div>
            <ReviewFormSkeleton />
            <ReviewsSkeleton />
        </div>
    );
};
/**
 * FragranceHeaderSkeleton
 * Skeleton for the page header — same layout/classes as ProductFragrance header.
 */
export const FragranceHeaderSkeleton = () => {
    return (
        <div className="product-fragrance-header-layout skeleton-pulse">
            <div className="h-3 w-16 rounded-full skeleton-bg-muted mx-auto mb-2" />
            <div className="product-fragrance-header-grid">
                <div className="hidden sm:block" aria-hidden />
                <div className="h-8 w-48 sm:w-56 rounded-lg skeleton-bg mx-auto" />
                <div className="flex justify-center sm:justify-end">
                    <div className="h-[30px] w-[122px] rounded-full skeleton-bg-muted" />
                </div>
            </div>
            <div className="product-fragrance-divider product-fragrance-header-divider skeleton-divider-strong" />
        </div>
    );
};

/**
 * FragranceFilterSkeleton
 * Skeleton for the brand filter — same layout/classes as ProductFragrance filter.
 */
export const FragranceFilterSkeleton = () => {
    const widths = ['w-14', 'w-20', 'w-20', 'w-24', 'w-16', 'w-20', 'w-24', 'w-20'];
    return (
        <div className="product-fragrance-filter-wrap skeleton-pulse">
            <div className="product-fragrance-filter-inner">
                <div className="product-fragrance-filter-pills">
                    {widths.map((w, i) => (
                        <div
                            key={`filter-skeleton-${i}`}
                            className={`product-fragrance-filter-pill min-h-[1.85rem] skeleton-bg skeleton-border border ${w}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * FragranceFormSkeleton
 * 로딩 시 향수 생성/수정 폼 영역 스켈레톤 (제목은 페이지에서 렌더)
 */
export const FragranceFormSkeleton = () => {
    return (
        <section className="product-layout skeleton-pulse">
            <div className="fragrance-form-layout">
                {/* Left Column */}
                <div className="fragrance-form-left-col">
                    <div className="fragrance-img-size skeleton-bg mx-auto sm:mx-0 lg:mx-auto" />
                    <div className="fragrance-form-thumbnails">
                        <div className="flex justify-between items-end border-b border-[#ede8f5] dark:border-[#c8b4ff30] pb-2">
                            <div className="w-20 h-2 rounded-full skeleton-bg-muted" />
                            <div className="w-14 h-2 rounded-full skeleton-bg-muted" />
                        </div>
                        <ul className="grid grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map(i => (
                                <li key={i} className="aspect-square rounded-xl skeleton-bg" />
                            ))}
                        </ul>
                    </div>
                </div>
                {/* Right Column */}
                <div className="fragrance-form-right-col">
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <div className="space-y-3">
                                <div className="w-16 h-2 rounded-full skeleton-bg-muted" />
                                <div className="w-full h-px skeleton-bg" />
                            </div>
                            <div className="space-y-3">
                                <div className="w-16 h-2 rounded-full skeleton-bg-muted" />
                                <div className="w-full h-px skeleton-bg" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="w-20 h-2 rounded-full skeleton-bg-muted" />
                            <div className="w-full h-px skeleton-bg" />
                        </div>
                        <div className="space-y-10">
                            <div className="space-y-3">
                                <div className="w-24 h-2 rounded-full skeleton-bg-muted" />
                                <div className="w-full h-24 rounded-lg skeleton-bg-muted-80" />
                            </div>
                            <div className="space-y-3">
                                <div className="w-24 h-2 rounded-full skeleton-bg-muted" />
                                <div className="w-full h-16 rounded-lg skeleton-bg-muted-80" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 sm:gap-4">
                        <div className="flex-1 h-10 rounded-full skeleton-bg" />
                        <div className="w-16 h-10 rounded-full skeleton-bg-muted" />
                    </div>
                </div>
            </div>
        </section>
    );
};

/**
 * ReviewItemSkeleton
 * Skeleton for a single review item in the list.
 */
export const ReviewItemSkeleton = () => {
    return (
        <div className="flex flex-row gap-3 py-1 skeleton-pulse">
            <div className="shrink-0 w-10 h-10 rounded-full skeleton-bg" />
            <div className="flex-1 space-y-3 pt-1">
                <div className="flex items-center gap-2">
                    <div className="w-20 h-3 rounded-full skeleton-bg-muted-80" />
                    <div className="w-16 h-3 rounded-full skeleton-bg-muted" />
                </div>
                <div className="space-y-2">
                    <div className="w-full h-3 rounded-full skeleton-bg-muted-80" />
                    <div className="w-4/5 h-3 rounded-full skeleton-bg-muted-80" />
                </div>
            </div>
        </div>
    );
};

/**
 * ReviewsSkeleton
 * Consolidated skeleton for the reviews section including header and list.
 */
export const ReviewsSkeleton = () => {
    return (
        <div className="w-full space-y-4">
            {/* Header Skeleton */}
            <div className="w-48 h-6 rounded-full skeleton-bg skeleton-pulse" />

            {/* List Skeleton */}
            <div className="flex flex-col gap-3">
                <ReviewItemSkeleton />
                <ReviewItemSkeleton />
                <ReviewItemSkeleton />
                <ReviewItemSkeleton />
            </div>
        </div>
    );
};

/**
 * CommentsSkeleton
 * Same layout/classes as ReviewsSkeleton for consistent loading UI (Comments section).
 */
export const CommentsSkeleton = () => {
    return (
        <div className="w-full space-y-4">
            {/* Header Skeleton (댓글 N개) */}
            <div className="w-48 h-6 rounded-full skeleton-bg skeleton-pulse" />

            {/* List Skeleton - same structure as ReviewsSkeleton */}
            <div className="flex flex-col gap-3">
                <ReviewItemSkeleton />
                <ReviewItemSkeleton />
                <ReviewItemSkeleton />
                <ReviewItemSkeleton />
            </div>
        </div>
    );
};

/**
 * ReviewFormSkeleton
 * Skeleton for the review form.
 */
export const ReviewFormSkeleton = () => {
    return (
        <div className="my-4 skeleton-pulse">
            <div className="w-full h-10 border-b skeleton-border skeleton-bg-muted-70 rounded-lg" />
        </div>
    );
};

/**
 * FormInputSkeleton
 * Reusable skeleton for form inputs (TextField/SelectBox) with label and underline.
 */
export const FormInputSkeleton = () => {
    return (
        <div className="form-input-skeleton pb-1">
            <div className="form-input-skeleton__label" />
            <div className="form-input-skeleton__input" />
        </div>
    );
};
