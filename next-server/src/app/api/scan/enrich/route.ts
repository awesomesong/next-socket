import { NextRequest, NextResponse } from "next/server";
import { enrichFragranceInfo } from "@/src/app/lib/scan/enrichInfo";
import { checkRateLimit, getClientKey } from "@/src/app/lib/scan/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const clientKey = `enrich:${getClientKey(req)}`;
  const rate = checkRateLimit(clientKey);
  if (!rate.allowed) {
    return NextResponse.json(
      { message: `요청이 너무 잦아요. ${Math.ceil(rate.resetInMs / 1000)}초 후에 다시 시도해 주세요.` },
      { status: 429 },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const brand = typeof body?.brand === "string" ? body.brand.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!brand || !name) {
      return NextResponse.json({ message: "brand와 name이 필요합니다." }, { status: 400 });
    }

    const enriched = await enrichFragranceInfo(brand, name, { generateAlways: true });
    return NextResponse.json({
      description: enriched.description,
      notes: enriched.notes,
    });
  } catch (err) {
    console.error("[Scan enrich] error:", err);
    return NextResponse.json({ message: "분석 중 오류가 발생했어요." }, { status: 500 });
  }
}
