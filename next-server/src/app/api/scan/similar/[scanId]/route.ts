import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/db';
import { checkRateLimit, getClientKey } from '@/src/app/lib/scan/rateLimit';
import {
  findSimilarFragrances,
  type SimilarFragrance,
} from '@/src/app/lib/scan/findSimilarFragrances';

export const runtime = 'nodejs';

type Params = Promise<{ scanId: string }>;

// 갤러리는 향수 등록이 잦지 않아 7일 캐시로 DB 조회 횟수 최소화
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface GalleryCache {
  items: SimilarFragrance[];
  fetchedAt: string;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { scanId } = await params;

    const rate = checkRateLimit(`similar-gallery:${getClientKey(req)}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { message: `잠시 후에 다시 시도해 주세요 (${Math.ceil(rate.resetInMs / 1000)}초)` },
        { status: 429 },
      );
    }

    const scan = await prisma.scanResult.findUnique({
      where: { id: scanId },
      select: {
        matchedSlug: true,
        notes: true,
        galleryCache: true,
      },
    });
    if (!scan) {
      return NextResponse.json({ message: '스캔 결과를 찾을 수 없어요.' }, { status: 404 });
    }

    // 7일 캐시 확인
    const cached = scan.galleryCache as unknown as GalleryCache | null;
    if (cached?.fetchedAt) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ items: cached.items, source: 'cache' });
      }
    }

    // 갤러리 DB에서 유사 향수 계산 — 외부 API 없음
    const items = await findSimilarFragrances(
      scan.matchedSlug ?? null,
      scan.notes ?? null,
      6,
    );

    // 캐시 저장 (빈 결과도 저장 — 반복 계산 방지)
    const cacheData: GalleryCache = { items, fetchedAt: new Date().toISOString() };
    await prisma.scanResult.update({
      where: { id: scanId },
      data: { galleryCache: cacheData as object },
    });

    return NextResponse.json({ items, source: 'fresh' });
  } catch (err) {
    console.error('[similar/gallery] error:', err);
    return NextResponse.json(
      { message: '추천을 불러오는 데 실패했어요.' },
      { status: 500 },
    );
  }
}
