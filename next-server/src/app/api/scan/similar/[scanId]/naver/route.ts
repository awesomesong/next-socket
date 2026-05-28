import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { checkRateLimit, getClientKey } from '@/src/app/lib/scan/rateLimit';
import { suggestSimilarFragrances } from '@/src/app/lib/scan/suggestSimilarFragrances';
import { searchNaverShopping, type TrustBadge } from '@/src/app/lib/scan/naverShopping';

export const runtime = 'nodejs';

type Params = Promise<{ scanId: string }>;

const NAVER_RECO_TTL_MS = 24 * 60 * 60 * 1000; // 24h
// 캐시 버전 — 선정 로직 변경 시 올려서 구버전 캐시 자동 무효화
const CACHE_VERSION = 9;

export interface NaverRecoItem {
  brand: string;
  name: string;
  price: number;
  /**
   * 실제 스토어 직접 URL:
   *  - 올리브영 결과 → oliveyoung.co.kr/...
   *  - 백화점 결과 → lotteon.com/... 등
   *  - 브랜드 직영 → brand.naver.com/dior/...
   * Naver Shopping 중간 페이지가 아닌 스토어 직접 링크.
   */
  storeUrl: string;
  mall: string;
  badge: TrustBadge | null;
  naverThumbnail: string;
}

interface NaverRecoCache {
  v?: number;
  items: NaverRecoItem[];
  fetchedAt: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { scanId } = await params;

    const rate = checkRateLimit(`similar-naver:${getClientKey(req)}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { message: `잠시 후에 다시 시도해 주세요 (${Math.ceil(rate.resetInMs / 1000)}초)` },
        { status: 429 },
      );
    }

    const scan = await prisma.scanResult.findUnique({
      where: { id: scanId },
      select: {
        brand: true,
        name: true,
        description: true,
        notes: true,
        naverRecoCache: true,
      },
    });
    if (!scan) {
      return NextResponse.json({ message: '스캔 결과를 찾을 수 없어요.' }, { status: 404 });
    }

    // 24h 캐시 확인 — 구버전(v 다름) 캐시는 무효화해서 재조회
    const cached = scan.naverRecoCache as unknown as NaverRecoCache | null;
    if (cached?.fetchedAt && cached.v === CACHE_VERSION) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < NAVER_RECO_TTL_MS) {
        return NextResponse.json({ items: cached.items, source: 'cache' });
      }
    }

    // LLM으로 비슷한 향수 추천 생성 (gpt-4o-mini)
    const suggestions = await suggestSimilarFragrances(
      scan.brand,
      scan.name,
      scan.description ?? null,
      scan.notes ?? null,
    );

    if (suggestions.length === 0) {
      return NextResponse.json({ items: [], source: 'fresh' });
    }

    // 각 추천 향수를 네이버에서 병렬 검색 (배치 5개) — 4개 채우면 종료
    const items: NaverRecoItem[] = [];
    const batchSize = 5;

    for (let i = 0; i < suggestions.length && items.length < 4; i += batchSize) {
      const batch = suggestions.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (s) => {
          try {
            // trust 모드: 배지 우선순위 → trustScore 순, 병행수입 차단 (naverShopping 내부 처리)
            const result = await searchNaverShopping(s.brand, s.name, 5, 'trust');

            // 적격 스토어만 허용:
            //   beauty_store : 올리브영·시코르 등 뷰티 전문몰 (storeUrl = 직접 스토어 URL)
            //   department   : 백화점
            //   official     : brand.naver.com 브랜드 직영만 (공식수입원 제외)
            //                  → mallName에 "공식" 있어도 brand.naver.com 아니면 탈락
            const best = result.items.find(
              (item) =>
                item.badges.includes('beauty_store') ||
                item.badges.includes('department') ||
                (item.badges.includes('official') && item.url.includes('brand.naver.com')),
            );

            if (!best) return null;

            return {
              brand: s.brand,
              name: s.name,
              price: best.price,
              storeUrl: best.url,
              mall: best.mall,
              badge: best.badges[0] ?? null,
              naverThumbnail: best.thumbnail,
            } satisfies NaverRecoItem;
          } catch {
            return null;
          }
        }),
      );
      for (const r of results) {
        if (r && items.length < 4) items.push(r);
      }
    }

    const cacheData: NaverRecoCache = { v: CACHE_VERSION, items, fetchedAt: new Date().toISOString() };
    await prisma.scanResult.update({
      where: { id: scanId },
      data: { naverRecoCache: cacheData as object },
    });

    return NextResponse.json({ items, source: 'fresh' });
  } catch (err) {
    console.error('[similar/naver] error:', err);
    return NextResponse.json(
      { message: '추천을 불러오는 데 실패했어요.' },
      { status: 500 },
    );
  }
}
