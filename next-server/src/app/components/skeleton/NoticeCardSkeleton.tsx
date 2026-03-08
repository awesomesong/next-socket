"use client";

/**
 * Single notice card skeleton — same structure & classes as NoticeCard
 * so layout is managed by one set of CSS (notice-card, notice-card__image-wrap, etc.).
 * Uses skeleton-bg / skeleton-bg-muted from FragranceSkeleton style.
 */
const NoticeCardSkeletonItem = () => (
  <div className="notice-card block h-full skeleton-pulse" aria-hidden>
    <div className="notice-card__image-wrap flex items-center justify-center">
      <div className="w-full h-full min-h-[160px] rounded-none skeleton-bg" />
    </div>
    <div className="notice-card__body">
      <h2 className="notice-card__title">
        <span className="block w-full h-4 rounded-full skeleton-bg" />
      </h2>
      <div className="notice-card__meta">
        <span className="shrink-0 w-7 h-7 rounded-full skeleton-bg" />
        <span className="h-3 w-16 rounded-full skeleton-bg-muted" />
        <span className="h-3 w-14 rounded-full skeleton-bg-muted" />
        <span className="h-3 w-12 rounded-full skeleton-bg-muted" />
        <span className="h-3 w-10 rounded-full skeleton-bg-muted" />
      </div>
    </div>
  </div>
);

const NoticeCardSkeleton = () => (
  <div className="notice-grid notice-grid-skeleton">
    {Array.from({ length: 8 }).map((_, i) => (
      <NoticeCardSkeletonItem key={i} />
    ))}
  </div>
);

export default NoticeCardSkeleton;
