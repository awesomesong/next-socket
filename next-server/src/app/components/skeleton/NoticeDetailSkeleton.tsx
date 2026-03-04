'use client';

/**
 * 공지 상세 페이지 로딩 스켈레톤.
 * NoticeCardSkeleton과 동일한 CSS(skeleton-pulse, skeleton-bg, skeleton-bg-muted)만 사용.
 */
export function NoticeDetailSkeleton() {
  return (
    <div className="skeleton-pulse space-y-4" aria-hidden>
      <div className="flex justify-end gap-2 mb-3">
        <div className="h-8 w-20 rounded-full skeleton-bg-muted" />
        <div className="h-8 w-16 rounded-full skeleton-bg-muted" />
      </div>
      <h1 className="notice-detail__title">
        <span className="block h-6 w-4/5 max-w-md rounded-full skeleton-bg" />
        <span className="mt-2 block h-5 w-2/3 max-w-sm rounded-full skeleton-bg-muted" />
      </h1>
      <div className="notice-card__meta">
        <span className="notice-meta__avatar shrink-0">
          <span className="block w-7 h-7 rounded-full skeleton-bg" />
        </span>
        <span className="h-3 w-16 rounded-full skeleton-bg-muted" />
        <span className="h-3 w-14 rounded-full skeleton-bg-muted" />
        <span className="h-3 w-12 rounded-full skeleton-bg-muted" />
        <span className="h-3 w-10 rounded-full skeleton-bg-muted" />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="h-3 w-full rounded-full skeleton-bg-muted" />
        <div className="h-3 w-full rounded-full skeleton-bg-muted" />
        <div className="h-3 w-11/12 rounded-full skeleton-bg-muted" />
        <div className="h-3 w-4/5 rounded-full skeleton-bg-muted" />
        <div className="h-3 w-full rounded-full skeleton-bg-muted" />
        <div className="h-3 w-2/3 rounded-full skeleton-bg-muted" />
      </div>
    </div>
  );
}

export default NoticeDetailSkeleton;
