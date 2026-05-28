import prisma from '@/prisma/db';
import {
  searchNaverShopping,
  type NaverShoppingItem,
  type TrustBadge,
} from './naverShopping';
import type { SimilarFragrance } from './findSimilarFragrances';

export type { TrustBadge };

/** Fragrance.naverCache JSON 형태 */
interface NaverCacheEntry {
  available: boolean;
  item: NaverShoppingItem | null;
  fetchedAt: string;
  koreanName: string | null;
}

/** 네이버 판매 확인된 유사 향수 */
export interface VerifiedSimilarFragrance extends SimilarFragrance {
  lowestPrice: number;
  naverUrl: string;
  mall: string;
  badge: TrustBadge | null;
  naverThumbnail: string;
}

const NAVER_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

/**
 * 단일 향수의 네이버 판매 여부 확인.
 * Fragrance.naverCache (7일 TTL) 우선 사용 — 만료 시 API 호출 후 갱신.
 */
async function checkOne(
  candidate: SimilarFragrance,
): Promise<VerifiedSimilarFragrance | null> {
  // 1. DB 캐시 확인
  const row = await prisma.fragrance.findUnique({
    where: { slug: candidate.slug },
    select: { naverCache: true },
  });

  if (row?.naverCache) {
    const cached = row.naverCache as unknown as NaverCacheEntry;
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    // thumbnail이 없는 구버전 캐시는 만료 처리 → 재조회
    const hasThumbnail = cached.item?.thumbnail !== undefined && cached.item.thumbnail !== '';
    if (age < NAVER_CACHE_TTL_MS && hasThumbnail) {
      if (!cached.available || !cached.item) return null;
      return buildVerified(candidate, cached.item);
    }
  }

  // 2. 캐시 없음/만료 → 네이버 API 호출 (결과 1개만)
  let entry: NaverCacheEntry;
  try {
    const result = await searchNaverShopping(candidate.brand, candidate.name, 1);
    const item = result.items[0] ?? null;
    entry = {
      available: item !== null,
      item,
      fetchedAt: new Date().toISOString(),
      koreanName: result.koreanName,
    };
  } catch (err) {
    console.warn(
      `[checkNaverAvailability] API 오류 ${candidate.brand} ${candidate.name}:`,
      err,
    );
    // 오류 시 캐시 저장 안 함 — 다음 요청에 재시도
    return null;
  }

  // 3. 캐시 저장
  await prisma.fragrance.update({
    where: { slug: candidate.slug },
    data: { naverCache: entry as object },
  });

  if (!entry.available || !entry.item) return null;
  return buildVerified(candidate, entry.item);
}

function buildVerified(
  candidate: SimilarFragrance,
  item: NaverShoppingItem,
): VerifiedSimilarFragrance {
  return {
    ...candidate,
    lowestPrice: item.price,
    naverUrl: item.url,
    mall: item.mall,
    badge: item.badges[0] ?? null,
    naverThumbnail: item.thumbnail,
  };
}

/**
 * 후보 목록을 배치로 네이버 확인.
 * 5개씩 병렬 처리 → resultCount개 채우면 즉시 종료.
 *
 * 왜 배치?
 *  - 캐시 미스가 겹치면 동시 네이버 API 호출이 10개까지 올라갈 수 있음
 *  - 5개씩 끊어서 호출 수 조절
 *  - 캐시 히트가 많으면 DB 조회만이라 빠름
 */
export async function checkNaverAvailability(
  candidates: SimilarFragrance[],
  resultCount = 6,
): Promise<VerifiedSimilarFragrance[]> {
  const results: VerifiedSimilarFragrance[] = [];
  const batchSize = 5;

  for (
    let i = 0;
    i < candidates.length && results.length < resultCount;
    i += batchSize
  ) {
    const batch = candidates.slice(i, i + batchSize);
    const checked = await Promise.all(batch.map(checkOne));

    for (const item of checked) {
      if (item && results.length < resultCount) {
        results.push(item);
      }
    }
  }

  return results;
}
