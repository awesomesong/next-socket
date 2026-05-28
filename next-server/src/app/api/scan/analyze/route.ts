import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { getCurrentUser } from "@/src/app/lib/session";
import { analyzeFragranceFromUrl } from "@/src/app/lib/scan/visionAnalyze";
import { enrichFragranceInfo } from "@/src/app/lib/scan/enrichInfo";
import { findFragranceMatch } from "@/src/app/lib/scan/findMatch";
import { checkRateLimit, getClientKey } from "@/src/app/lib/scan/rateLimit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SCAN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — 이전 ScanResult.prices 재사용 기준

export async function POST(req: NextRequest) {
  try {
    // 1) 레이트 리밋
    const clientKey = getClientKey(req);
    const rate = checkRateLimit(clientKey);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          message: `요청이 너무 잦아요. ${Math.ceil(rate.resetInMs / 1000)}초 후에 다시 시도해 주세요.`,
        },
        { status: 429 },
      );
    }

    // 2) multipart 수신
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ message: "사진을 첨부해 주세요." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "이미지는 10MB 이하 크기로 올려 주세요." }, { status: 400 });
    }

    // 3) Cloudinary 업로드 (unsigned preset)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET;
    if (!cloudName || !preset) {
      console.error("[Scan] Cloudinary 환경변수 누락");
      return NextResponse.json({ message: "서버 설정에 문제가 있어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }

    const cloudForm = new FormData();
    cloudForm.append("file", file, "scan.png");
    cloudForm.append("upload_preset", preset);
    cloudForm.append("cloud_name", cloudName);

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudForm },
    );
    if (!cloudRes.ok) {
      const err = await cloudRes.text();
      console.error("[Scan] Cloudinary 업로드 실패:", err);
      return NextResponse.json({ message: "이미지 업로드에 실패했어요. 다시 시도해 주세요." }, { status: 500 });
    }
    const { secure_url, width: imageWidth, height: imageHeight } = (await cloudRes.json()) as {
      secure_url: string;
      width: number;
      height: number;
    };

    // 4) Vision 분석
    const analysis = await analyzeFragranceFromUrl(secure_url);

    if (!analysis.isFragrance) {
      return NextResponse.json(
        {
          message: "향수 사진이 아닌 것 같아요. 향수병이 잘 보이는 사진으로 다시 시도해 주세요.",
          isFragrance: false,
          imageUrl: secure_url,
        },
        { status: 200 },
      );
    }

    if (!analysis.brand || !analysis.name) {
      return NextResponse.json(
        {
          message: "브랜드나 향수 이름을 인식하지 못했어요. 더 선명한 사진으로 다시 시도해 주세요.",
          isFragrance: true,
          imageUrl: secure_url,
          brand: analysis.brand,
          name: analysis.name,
        },
        { status: 200 },
      );
    }

    // 5) 자체 갤러리 fuzzy 매칭 (강화된 token 기반)
    const matched = await findFragranceMatch(analysis.brand, analysis.name);

    // 5-1) Cache-aside: 동일 brand+name + 24h 내 ScanResult 검색
    //      - prices 캐시 재사용으로 가격 API 호출 절감
    //      - description/notes 캐시 재사용으로 enrichInfo 호출 절감
    const recentScans = await prisma.scanResult.findMany({
      where: {
        brand: { equals: matched?.brand ?? analysis.brand, mode: "insensitive" },
        name: { equals: matched?.name ?? analysis.name, mode: "insensitive" },
        createdAt: { gte: new Date(Date.now() - SCAN_CACHE_TTL_MS) },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const cachedScanWithPrices = recentScans.find((r) => r.prices !== null);
    const cachedScanWithDesc = recentScans.find(
      (r) => r.description && r.description.length > 0,
    );

    // 5-2) curated/캐시/LLM 우선순위로 description·notes 결정
    let finalDescription: string | null = null;
    let finalNotes: string | null = null;
    let enrichTokensUsed = 0;

    if (matched?.description) {
      // ① 자체 갤러리 매칭: curated 데이터 우선
      finalDescription = matched.description;
      finalNotes = matched.notes;
    } else if (cachedScanWithDesc) {
      // ② 24h 내 ScanResult 캐시 재사용 — enrichInfo 호출 안 함
      finalDescription = cachedScanWithDesc.description;
      finalNotes = cachedScanWithDesc.notes;
    } else {
      // ③ LLM 텍스트 호출로 향수 정보 보강 (Phase 3.6) — 스캔 컨텍스트는 항상 생성
      const enriched = await enrichFragranceInfo(analysis.brand, analysis.name, { generateAlways: true });
      finalDescription = enriched.description || null;
      finalNotes = enriched.notes || null;
      enrichTokensUsed = enriched.tokensUsed;
    }

    const finalBrand = matched?.brand ?? analysis.brand;
    const finalName = matched?.name ?? analysis.name;

    const user = await getCurrentUser();
    const session = await prisma.scanResult.create({
      data: {
        brand: finalBrand,
        name: finalName,
        notes: finalNotes,
        description: finalDescription,
        imageUrl: secure_url,
        imageWidth: imageWidth ?? null,
        imageHeight: imageHeight ?? null,
        matchedSlug: matched?.slug ?? null,
        userEmail: user?.email ?? null,
        // Vision OCR + LLM enrichment 합산
        tokensUsed: analysis.tokensUsed + enrichTokensUsed,
        // 24h 캐시 hit 시 prices 미리 채워서 가격 카드 즉시 표시
        prices: cachedScanWithPrices?.prices ?? undefined,
      },
    });

    return NextResponse.json({
      scanId: session.id,
      isFragrance: true,
      brand: finalBrand,
      name: finalName,
      notes: finalNotes,
      description: finalDescription,
      imageUrl: secure_url,
      matchedFragrance: matched,
      // 진단·디버깅용 (UI는 사용 안 해도 됨)
      confidence: matched?.confidence ?? null,
      fromCache: !!cachedScanWithPrices,
      tokensUsed: analysis.tokensUsed + enrichTokensUsed,
    });
  } catch (err) {
    console.error("[Scan analyze] error:", err);
    return NextResponse.json(
      { message: "분석 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
