'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineArrowRight, HiOutlineCamera, HiOutlinePlus } from 'react-icons/hi2';
import Button from '@/src/app/components/Button';
import PriceCards from './PriceCards';
import SimilarGallery from './SimilarGallery';
import SimilarNaverReco from './SimilarNaverReco';
import { useScanPrefillStore } from '@/src/app/store/scanPrefillStore';

interface MatchedFragrance {
  slug: string;
  brand: string;
  name: string;
  images: string[];
}

export interface ScanResultData {
  scanId: string;
  brand: string;
  name: string;
  notes?: string;
  description?: string;
  imageUrl: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  matchedFragrance?: MatchedFragrance | null;
}

interface Props {
  data: ScanResultData;
}

export default function ScanResult({ data }: Props) {
  const { brand, name, imageUrl, imageWidth, imageHeight, matchedFragrance } = data;
  const [imgLoaded, setImgLoaded] = useState(false);
  const router = useRouter();
  const setPrefill = useScanPrefillStore((s) => s.set);

  const [description, setDescription] = useState(data.description ?? '');
  const [notes, setNotes] = useState(data.notes ?? '');
  const needsEnrich = !data.description || !data.notes;
  // 처음부터 로딩 상태로 시작해 마운트 직후 빈 화면 깜빡임 방지
  const [isEnriching, setIsEnriching] = useState(needsEnrich);
  const [enrichFailed, setEnrichFailed] = useState(false);

  useEffect(() => {
    if (!needsEnrich) return;
    fetch('/api/scan/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, name }),
    })
      .then((r) => r.json())
      .then((d: { description?: string; notes?: string }) => {
        if (d.description) setDescription(d.description);
        if (d.notes) setNotes(d.notes);
        if (!d.description && !d.notes) setEnrichFailed(true);
      })
      .catch(() => setEnrichFailed(true))
      .finally(() => setIsEnriching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    /*
      FragranceDetail 톤으로 통일 — 카드(border + bg + padding) wrapping 제거.
      그라데이션 헤딩 + border-t 섹션 구분 + 톤 다운된 본문으로 정보 위계 표현.
    */
    <div className="mx-auto w-full max-w-5xl flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
      {/* 좌: 이미지 + 액션 버튼 — sticky로 스크롤 중에도 항상 보임 */}
      <div className="w-full max-w-md mx-auto lg:max-w-none lg:w-[400px] lg:mx-0 lg:shrink-0 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
        <div
          className="relative rounded-2xl overflow-hidden bg-[var(--color-lavender-pale)]"
          style={imageWidth && imageHeight ? { aspectRatio: `${imageWidth}/${imageHeight}` } : { aspectRatio: '3/4' }}
        >
          {/* 로딩 중 스켈레톤 */}
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-[var(--color-lavender-pale)]" />
          )}
          <Image
            src={imageUrl}
            alt={`${brand} ${name}`}
            fill
            sizes="(max-width: 1024px) 448px, 400px"
            className={`object-contain transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
          />
        </div>
        {/* 이미지 아래 액션 버튼 */}
        <div className="mt-4 flex flex-row gap-3 w-full">
          {matchedFragrance ? (
            <Link href={`/fragrance/${matchedFragrance.slug}`} className="flex-[3]">
              <Button variant="scent" fullWidth className="!px-4">
                <HiOutlineArrowRight className="size-4 shrink-0" aria-hidden />
                향수 페이지 보기
              </Button>
            </Link>
          ) : (
            <Button
              variant="scent"
              fullWidth
              className="flex-[3] !px-4"
              disabled={isEnriching}
              onClick={() => {
                setPrefill({ brand, name, description, notes, imageUrl });
                router.push('/fragrance/create');
              }}
            >
              <HiOutlinePlus className="size-4 shrink-0" aria-hidden />
              {isEnriching ? '불러오는 중...' : 'Scent Memories에 등록'}
            </Button>
          )}
          <Link href="/scan?camera=true" className="flex-[2]">
            <Button variant="ghostLavender" fullWidth className="whitespace-nowrap !px-4">
              <HiOutlineCamera className="size-4 shrink-0" aria-hidden />
              다른 향수 스캔
            </Button>
          </Link>
        </div>
      </div>

      {/* 우: 정보 영역 */}
      <div className="flex-1 flex flex-col gap-10 min-w-0 w-full">
        {/* 설명 섹션 — 로딩 / 내용 / 실패 세 상태 */}
        {isEnriching && !description ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-[var(--color-lavender-pale)] rounded w-full" />
            <div className="h-3 bg-[var(--color-lavender-pale)] rounded w-4/5" />
            <div className="h-3 bg-[var(--color-lavender-pale)] rounded w-3/5" />
          </div>
        ) : description ? (
          <p className="text-[13px] md:text-[14px] leading-[1.8] text-stone-600 dark:text-stone-300/90 font-light tracking-wide">
            {description}
          </p>
        ) : enrichFailed ? (
          <p className="text-[13px] md:text-[14px] text-stone-400 dark:text-stone-500 font-light">
            향수 설명 정보를 찾지 못했어요.
          </p>
        ) : null}

        {/* 노트 섹션 — 로딩 / 내용 / 실패 세 상태 */}
        <div className="pt-8 border-t border-stone-200/60 dark:border-stone-700/40">
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-stone-400 dark:text-stone-300 mb-4">
            향 노트
          </h3>
          {isEnriching && !notes ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 bg-[var(--color-lavender-pale)] rounded w-2/5" />
              <div className="h-3 bg-[var(--color-lavender-pale)] rounded w-3/5" />
              <div className="h-3 bg-[var(--color-lavender-pale)] rounded w-2/5" />
            </div>
          ) : notes ? (
            <p className="text-[13px] md:text-[14px] leading-[1.7] text-stone-600 dark:text-stone-300 font-light whitespace-pre-wrap">
              {notes}
            </p>
          ) : enrichFailed ? (
            <p className="text-[13px] md:text-[14px] text-stone-400 dark:text-stone-500 font-light">
              노트 정보를 찾지 못했어요.
            </p>
          ) : null}
        </div>

        {matchedFragrance && (
          <div className="pt-8 border-t border-stone-200/60 dark:border-stone-700/40">
            <h3 className="text-sm font-bold tracking-[0.2em] uppercase text-stone-400 dark:text-stone-300 mb-4">
              갤러리에 등록된 향수예요
            </h3>
            <Link
              href={`/fragrance/${matchedFragrance.slug}`}
              className="flex items-center gap-4 group"
            >
              {matchedFragrance.images[0] && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-ivory shrink-0 border border-stone-200/60 dark:border-stone-700/40">
                  <Image
                    src={matchedFragrance.images[0]}
                    alt={matchedFragrance.name}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate group-hover:text-lavender transition-colors">
                  {matchedFragrance.brand} · {matchedFragrance.name}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1">
                  상세 페이지로 이동
                  <HiOutlineArrowRight
                    className="size-3 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </p>
              </div>
            </Link>
          </div>
        )}

        <div className="pt-8 border-t border-stone-200/60 dark:border-stone-700/40">
          <PriceCards scanId={data.scanId} />
        </div>

        <div className="pt-8 border-t border-stone-200/60 dark:border-stone-700/40">
          <SimilarGallery scanId={data.scanId} />
        </div>

        <div className="pt-8 border-t border-stone-200/60 dark:border-stone-700/40">
          <SimilarNaverReco scanId={data.scanId} />
        </div>

      </div>
    </div>
  );
}
