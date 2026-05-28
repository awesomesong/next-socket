import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import {
  buildFallbackSearchUrl,
  searchNaverShopping,
  type NaverShoppingItem,
} from "@/src/app/lib/scan/naverShopping";
import { checkRateLimit, getClientKey } from "@/src/app/lib/scan/rateLimit";

export const runtime = "nodejs";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

type Params = Promise<{ scanId: string }>;

interface CachedPrices {
  items: NaverShoppingItem[];
  fetchedAt: string;
  /**
   * 한글 변환된 name (LLM 결과). 24h 안 재호출 시 LLM 비용 절감.
   * null이면 한글 변환 실패 또는 영문 그대로.
   */
  koreanName?: string | null;
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { scanId } = await params;

    const rate = checkRateLimit(`prices:${getClientKey(req)}`);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: `잠시 후에 다시 시도해 주세요 (${Math.ceil(rate.resetInMs / 1000)}초)`,
        },
        { status: 429 },
      );
    }

    const scan = await prisma.scanResult.findUnique({ where: { id: scanId } });
    if (!scan) {
      return NextResponse.json({ message: "스캔 결과를 찾을 수 없어요." }, { status: 404 });
    }

    const query = `${scan.brand} ${scan.name}`.trim();

    /**
     * naverSearchUrl 생성 — brand는 그대로, name은 한글 변환된 것 우선.
     * 네이버 검색은 띄어쓰기·표기에 민감해서 한글로 정확히 보내야 결과 잘 나옴.
     * koreanName 없으면 영문 name 그대로 fallback.
     */
    const buildSearchUrl = (koreanName: string | null | undefined): string => {
      const nameForSearch = koreanName || scan.name;
      const searchQuery = `${scan.brand} ${nameForSearch}`.trim();
      return buildFallbackSearchUrl(searchQuery);
    };

    // 24h 캐시 확인 — 캐시에 koreanName 같이 보관, LLM 재호출 회피
    const cached = scan.prices as unknown as CachedPrices | null;
    if (cached?.fetchedAt) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({
          items: cached.items,
          cachedAt: cached.fetchedAt,
          fresh: false,
          query,
          naverSearchUrl: buildSearchUrl(cached.koreanName),
        });
      }
    }

    let items: NaverShoppingItem[];
    let koreanName: string | null = null;
    try {
      const result = await searchNaverShopping(scan.brand, scan.name, 5);
      items = result.items;
      koreanName = result.koreanName;
    } catch (err) {
      console.error("[Scan prices] Naver API error:", err);
      return NextResponse.json({
        items: [],
        naverSearchUrl: buildSearchUrl(null), // 에러 시 영문 fallback
        error: "가격 정보를 불러올 수 없어요. 네이버 쇼핑에서 직접 검색해 보세요.",
        query,
      });
    }

    const naverSearchUrl = buildSearchUrl(koreanName);

    if (items.length === 0) {
      return NextResponse.json({
        items: [],
        naverSearchUrl,
        query,
      });
    }

    const cacheData: CachedPrices = {
      items,
      fetchedAt: new Date().toISOString(),
      koreanName,
    };
    await prisma.scanResult.update({
      where: { id: scanId },
      data: { prices: cacheData as object },
    });

    return NextResponse.json({
      items,
      cachedAt: cacheData.fetchedAt,
      fresh: true,
      query,
      naverSearchUrl,
    });
  } catch (err) {
    console.error("[Scan prices] error:", err);
    return NextResponse.json({ message: "가격 조회에 실패했어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
