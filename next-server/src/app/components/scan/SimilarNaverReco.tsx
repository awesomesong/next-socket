'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';

type TrustBadge = 'verified_catalog' | 'department' | 'official' | 'beauty_store';

interface NaverRecoItem {
  brand: string;
  name: string;
  price: number;
  storeUrl: string;  // 올리브영·백화점·brand.naver.com 직접 URL
  mall: string;
  badge: TrustBadge | null;
  naverThumbnail: string;
}

interface ApiResponse {
  items: NaverRecoItem[];
  source: 'cache' | 'fresh';
}

interface Props {
  scanId: string;
}

const BADGE_LABEL: Record<TrustBadge, string> = {
  beauty_store: '뷰티 전문몰',
  department: '백화점',
  official: '공식몰',
  verified_catalog: '정품 매칭',
};

/** 결과 아이템들의 스토어 종류를 요약 (중복 제거, 최대 2종) */
function summarizeStores(items: NaverRecoItem[]): string {
  const seen = new Set<TrustBadge>();
  for (const item of items) {
    if (item.badge) seen.add(item.badge);
  }
  const labels = [...seen]
    .map((b) => BADGE_LABEL[b])
    .filter(Boolean)
    .slice(0, 2);
  return labels.length > 0 ? labels.join(' · ') : '정품 판매처';
}

export default function SimilarNaverReco({ scanId }: Props) {
  const [items, setItems] = useState<NaverRecoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/scan/similar/${scanId}/naver`);
        const data = (await res.json()) as ApiResponse;
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        // 핵심 기능이 아니므로 에러 시 섹션 숨김
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [scanId]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-stone-500 dark:text-stone-300">
          AI가 추천하는 비슷한 향수
        </h3>
        <p className="text-xs text-text-secondary">
          {loading
            ? '올리브영 · 백화점 · 공식몰 확인 중...'
            : `${items.length}종 · ${summarizeStores(items)}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {loading
          ? [0, 1].map((i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse">
                <div className="aspect-square rounded-2xl bg-[var(--color-lavender-pale)]" />
                <div className="flex flex-col gap-1.5 px-0.5">
                  <div className="h-2.5 w-2/5 rounded-full bg-[var(--color-lavender-pale)]" />
                  <div className="h-3 w-4/5 rounded-full bg-[var(--color-lavender-pale)]" />
                  <div className="h-2.5 w-3/5 rounded-full bg-[var(--color-lavender-pale)]" />
                </div>
              </div>
            ))
          : items.map((item, idx) => {
              const imgSrc = item.naverThumbnail?.startsWith('http') ? item.naverThumbnail : '';

              return (
                <a
                  key={idx}
                  href={item.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-2"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--color-lavender-pale)] border border-[var(--color-card-border)] group-hover:border-lavender transition-colors">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={`${item.brand} ${item.name}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 240px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-text-secondary">no image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 px-0.5">
                    <p className="text-[11px] text-text-secondary font-light truncate">
                      {item.brand}
                    </p>
                    <p className="text-[13px] font-medium text-text-primary truncate group-hover:text-lavender transition-colors leading-snug">
                      {item.name}
                    </p>

                    {/* 스토어 배지 + 몰 이름 */}
                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {item.badge && (
                        <span className="shrink-0 inline-flex items-center bg-[var(--color-lavender-pale)] text-text-secondary text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none">
                          {BADGE_LABEL[item.badge]}
                        </span>
                      )}
                      <span className="text-[11px] text-text-secondary truncate">
                        {item.mall}
                      </span>
                    </div>

                    {/* 가격 + 바로가기 */}
                    <div className="flex items-center gap-1 group/link">
                      <span className="text-[12px] font-semibold text-text-primary group-hover/link:text-lavender transition-colors">
                        ₩{item.price.toLocaleString()}
                      </span>
                      <HiOutlineArrowTopRightOnSquare
                        className="size-3 text-text-secondary shrink-0 group-hover/link:text-lavender transition-colors"
                        aria-hidden
                      />
                    </div>
                  </div>
                </a>
              );
            })}
      </div>
    </section>
  );
}
