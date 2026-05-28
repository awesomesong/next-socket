'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface GalleryItem {
  slug: string;
  brand: string;
  name: string;
  images: string[];
  similarity: number;
  method: 'score' | 'notes';
}

interface ApiResponse {
  items: GalleryItem[];
  source: 'cache' | 'fresh';
}

interface Props {
  scanId: string;
}

export default function SimilarGallery({ scanId }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/scan/similar/${scanId}`);
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
          Scent Memories에서 찾은 비슷한 향수
        </h3>
        <p className="text-xs text-text-secondary">
          {loading ? '불러오는 중...' : `총 ${items.length}종`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {loading
          ? [0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-[var(--color-card-bg)] dark:bg-[var(--color-ivory-soft)]" />
                <div className="flex flex-col gap-1.5 px-0.5">
                  <div className="h-2.5 w-2/5 rounded-full bg-[var(--color-card-bg)] dark:bg-[var(--color-ivory-soft)]" />
                  <div className="h-3 w-4/5 rounded-full bg-[var(--color-card-bg)] dark:bg-[var(--color-ivory-soft)]" />
                </div>
              </div>
            ))
          : items.map((item) => (
              <Link
                key={item.slug}
                href={`/fragrance/${item.slug}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--color-card-bg)] dark:bg-[var(--color-ivory-soft)] border border-[var(--color-card-border)] group-hover:border-lavender transition-colors">
                  {item.images[0] ? (
                    <Image
                      src={item.images[0]}
                      alt={`${item.brand} ${item.name}`}
                      fill
                      sizes="(max-width: 768px) 33vw, 200px"
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-text-secondary">no image</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 px-0.5">
                  <p className="text-[11px] text-text-secondary font-light truncate">
                    {item.brand}
                  </p>
                  <p className="text-[13px] font-medium text-text-primary truncate group-hover:text-lavender transition-colors leading-snug">
                    {item.name}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
