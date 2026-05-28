import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";
import { analyzeFragranceFromUrl } from "@/src/app/lib/scan/visionAnalyze";
import { enrichFragranceInfo } from "@/src/app/lib/scan/enrichInfo";

/**
 * 등록용 향수 이미지 분석 (FormFragrance 에서 호출).
 *
 * 옵션 B 패턴 — 스캔 흐름과 통일된 2-stage pipeline:
 *   1) Vision OCR (gpt-4o → gpt-4o-mini fallback): brand + name 만 추출
 *      - max_tokens 400 (이전 800) — 응답 토큰 절반, 비용 ↓
 *      - "identify" 대신 OCR 톤 → refusal 감소
 *   2) LLM 보강 (gpt-4o-mini, 텍스트만): description + notes
 *      - 향수 지식 활용 → 정확도 ↑, hallucination 방지 프롬프트
 *      - 비용 $0.0001 (Vision의 1/50)
 *   3) slug 자동 생성 (코드, LLM 토큰 0)
 *
 * 응답 형식 유지: FragranceAnalysis { isFragrance, brand, name, slug, description, notes }
 */

function makeSlug(brand: string, name: string): string {
  return `${brand}_${name}`
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const EMPTY_RESULT = {
  isFragrance: false,
  brand: "",
  name: "",
  slug: "",
  description: "",
  notes: "",
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    const imageUrl: unknown = body?.imageUrl;
    if (typeof imageUrl !== "string" || !imageUrl) {
      return NextResponse.json(
        { message: "이미지 URL이 필요합니다." },
        { status: 400 },
      );
    }

    // 1단계: Vision OCR (brand + name)
    const vision = await analyzeFragranceFromUrl(imageUrl);

    if (!vision.isFragrance || !vision.brand || !vision.name) {
      return NextResponse.json({
        result: { ...EMPTY_RESULT, isFragrance: vision.isFragrance },
      });
    }

    // 2단계: LLM 보강 (description + notes + 영문 slug)
    const enriched = await enrichFragranceInfo(vision.brand, vision.name);

    // 3단계: slug 결정 — LLM 영문 slug 우선, 없으면 코드 fallback (한글 포함 가능)
    const slug = enriched.englishSlug || makeSlug(vision.brand, vision.name);

    return NextResponse.json({
      result: {
        isFragrance: true,
        brand: vision.brand,
        name: vision.name,
        slug,
        description: enriched.description,
        notes: enriched.notes,
      },
      _meta: {
        tokensUsed: vision.tokensUsed + enriched.tokensUsed,
        enrichConfident: enriched.confident,
      },
    });
  } catch (err) {
    console.error("[Fragrance analyze] error:", err);
    const message =
      err instanceof Error ? err.message : "AI 분석 중 오류가 발생했습니다.";
    return NextResponse.json(
      { message, code: "AI_ANALYSIS_FAILED" },
      { status: 500 },
    );
  }
}
