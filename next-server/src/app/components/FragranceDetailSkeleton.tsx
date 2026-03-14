/**
 * 상세/수정 공용 스켈레톤 (한 곳에서만 정의).
 * "use client" 없음 → loading.tsx(Suspense fallback)에서 사용해도 hydration 이슈 없음.
 * - variant="detail": 상세 로딩 (loading.tsx)
 * - variant="form": 수정 폼 로딩 (edit 페이지)
 */
export type FragranceDetailSkeletonVariant = "detail" | "form";

export default function FragranceDetailSkeleton({
  variant = "detail",
}: { variant?: FragranceDetailSkeletonVariant } = {}) {
  const isDetail = variant === "detail";

  return (
    <div className="fragrance-detail-layout skeleton-pulse">
      {isDetail && (
        <div className="detail-action-bar">
          <div className="h-8 w-14 rounded-full skeleton-bg-muted" aria-hidden />
        </div>
      )}

      <div className="fragrance-form-layout">
        <div
          className={
            isDetail
              ? "fragrance-form-left"
              : "fragrance-form-left sm:flex-row lg:flex-col"
          }
        >
          <div className="fragrance-detail-image-box">
            <div className="fragrance-img-size skeleton-bg mx-auto sm:mx-0 lg:mx-auto" />
          </div>
          {!isDetail && (
            <div className="flex flex-col gap-6 sm:flex-grow w-full sm:w-auto lg:w-full shrink-0 min-w-0">
              <div className="flex justify-between items-end border-b border-[#ede8f5] dark:border-[#c8b4ff30] pb-2">
                <div className="w-20 h-2 rounded-full skeleton-bg-muted" />
                <div className="w-14 h-2 rounded-full skeleton-bg-muted" />
              </div>
              <ul className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <li
                    key={i}
                    className="aspect-square rounded-xl skeleton-bg"
                  />
                ))}
              </ul>
            </div>
          )}
        </div>

        <div
          className={
            isDetail ? "fragrance-form-right" : "fragrance-form-right gap-12"
          }
        >
          {isDetail ? (
            <>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {isDetail && (
        <>
          <div className="my-4 skeleton-pulse">
            <div className="w-full h-10 border-b skeleton-border skeleton-bg-muted-70 rounded-lg" />
          </div>
          <div className="w-full space-y-4">
            <div className="w-48 h-6 rounded-full skeleton-bg skeleton-pulse" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-row gap-3 py-1 skeleton-pulse"
                >
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
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
