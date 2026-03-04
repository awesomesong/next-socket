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

const NoticeCardSkeleton = () => {
  return (
    <div className="notice-grid">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={`xs-${index}`} className="block">
          <NoticeCardSkeletonItem />
        </div>
      ))}

      {Array.from({ length: 2 }).map((_, index) => (
        <div key={`sm-${index}`} className="hidden sm:block">
          <NoticeCardSkeletonItem />
        </div>
      ))}

      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`md-${index}`} className="hidden md:block">
          <NoticeCardSkeletonItem />
        </div>
      ))}

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`lg-${index}`} className="hidden lg:block">
          <NoticeCardSkeletonItem />
        </div>
      ))}
    </div>
  );
};

export default NoticeCardSkeleton;
