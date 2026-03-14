'use client';

/**
 * 공지 상세 페이지 로딩 스켈레톤.
 * 실제 콘텐츠(notice/[id] 169-214)와 동일한 클래스 구조 사용.
 * 색상은 FragranceSkeleton과 동일(skeleton-pulse, skeleton-bg, skeleton-bg-muted 등).
 */
export function NoticeDetailSkeleton() {
  return (
    <>
      <div className="detail-action-bar skeleton-pulse">
        <div className="h-8 w-20 rounded-full skeleton-bg-muted" />
        <div className="h-8 w-16 rounded-full skeleton-bg-muted" />
        <div className="h-8 w-16 rounded-full skeleton-bg-muted" />
      </div>
      <h1 className="notice-detail__title">
        <span className="block h-7 w-4/5 max-w-md rounded-lg skeleton-bg" aria-hidden />
      </h1>
      <div className="notice-card__meta skeleton-pulse">
        <span className="notice-meta__avatar shrink-0">
          <span className="block w-7 h-7 rounded-full skeleton-bg" aria-hidden />
        </span>
        <span className="h-3 w-16 rounded-full skeleton-bg-muted" aria-hidden />
        <span className="h-3 w-14 rounded-full skeleton-bg-muted" aria-hidden />
        <span className="h-3 w-12 rounded-full skeleton-bg-muted" aria-hidden />
        <span className="h-3 w-10 rounded-full skeleton-bg-muted" aria-hidden />
      </div>
      <article
        className="
          notice-article
          mt-4 min-w-0 break-words
          text-sm
          scrollbar-thin
          [&_pre]:overflow-x-auto
          [&_pre]:whitespace-pre
          [&_code]:break-keep
          [&_code]:text-sm
        "
        aria-hidden
      >
        <div className="skeleton-pulse space-y-2">
          <div className="h-3 w-full rounded-full skeleton-bg-muted-80" />
          <div className="h-3 w-full rounded-full skeleton-bg-muted-80" />
          <div className="h-3 w-11/12 rounded-full skeleton-bg-muted-80" />
          <div className="h-3 w-4/5 rounded-full skeleton-bg-muted-80" />
          <div className="h-3 w-full rounded-full skeleton-bg-muted-80" />
          <div className="h-3 w-2/3 rounded-full skeleton-bg-muted-80" />
        </div>
      </article>
      <div className="my-4 skeleton-pulse" aria-hidden>
        <div className="w-full h-10 border-b skeleton-border skeleton-bg-muted-70 rounded-lg" />
      </div>
    </>
  );
}

export default NoticeDetailSkeleton;
