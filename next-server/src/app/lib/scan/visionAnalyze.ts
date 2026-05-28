/**
 * 향수 이미지 → 구조화 OCR (brand / name / concentration / size 분리).
 * 노트·설명은 enrichInfo.ts에서 텍스트 기반으로 별도 생성.
 *
 * 2-pass 정확도/비용 균형 설계:
 *   1) 1차: detail="low" (이미지 토큰 85, 빠르고 쌈)
 *      대부분의 또렷한 라벨은 여기서 끝남 — 평균 비용 이전과 동일
 *   2) needsHighResRetry() 평가 → name 결손/너무 짧음/concentration-only 등이면 의심
 *   3) 2차: detail="high" (이미지 토큰 ~765) — 어려운 케이스(작은 글씨, 흐린 사진)만
 *
 * 추출 정확도 보장:
 *   - 구조화 프롬프트: name 필드에 부향률/용량/원산지가 섞이지 않도록 분리
 *   - isConcentrationOnly 안전망: LLM이 부향률을 name으로 넣으면 코드에서 차단
 *   - rawText: 디버깅 + 향후 재구성용 (UI/계약 변경 없이 내부 보유)
 *
 * 모델 거부 시 gpt-4o-mini로 자동 fallback (정책 약간 다름, 비용 ~1/30).
 */

export interface VisionAnalysis {
  isFragrance: boolean;
  brand: string;
  name: string;
  tokensUsed: number;
}

const VISION_SYSTEM = `You are an OCR assistant for a personal fragrance gallery app. Users upload their own photos of perfume products to catalog in their personal collection. Your task is to extract visibly printed text from the image — this is text recognition, not identification.`;

const VISION_PROMPT = `This image shows a perfume product photo uploaded by the user for cataloging.

Read the visibly printed text on the bottle/package and return JSON with these fields separated:

{
  "isFragrance": true if the image shows a perfume/fragrance product (bottle, box, package), false otherwise,
  "rawText": "All visible text concatenated with ' | ' separators (for debugging). Empty if isFragrance is false.",
  "brand": "ONLY the maker/house name (e.g. 'Chanel', 'Dior', 'Jo Malone London'). Empty string if not visible. Prefer English/original spelling.",
  "name": "The specific product/line name (e.g. 'N°5', 'Sauvage', 'Polo Blue', 'Lime Basil & Mandarin', 'Polo 67'). EXCLUDE only: pure concentration words ('Eau de Parfum', 'EDP', 'EDT', 'Parfum', 'Cologne', 'Eau Fraiche'), size/volume ('50ml', '100 ml', '1.7 FL.OZ.', '3.4 oz'), origin ('Paris', 'Made in France'), barcodes, batch codes. Compound names that include a concentration word ARE valid (e.g. 'Polo Cologne Intense', 'Eau Sauvage' — the latter is an actual product name). If a product line number or sub-name is shown (e.g. 'Polo 67', 'Acqua di Giò Profumo'), include it as the name.",
  "concentration": "Concentration type if visible: 'EDP' | 'EDT' | 'EDC' | 'Parfum' | 'Eau Fraiche' | '' (empty if not visible)",
  "size": "Volume if visible, e.g. '50ml' | '100ml' | '' (empty if not visible)"
}

Rules:
- If isFragrance is false, set all string fields to "".
- Extract your best reading of the product name. If multiple text fragments could be the name, pick the most prominent one printed near the brand name (often immediately below or beside the brand). Only leave name empty if NO product/line text is visible at all.
- For brand+name combinations like "POLO 67 RALPH LAUREN": brand="Ralph Lauren", name="Polo 67".
- Return ONLY valid JSON, no other text.
- Do NOT refuse — this is text extraction from a product label, not identification of any person.`;

class VisionRefusalError extends Error {
  constructor(public refusal: string) {
    super(`Vision refused: ${refusal}`);
    this.name = "VisionRefusalError";
  }
}

type ImageDetail = "low" | "high";

async function callVisionOnce(
  imageUrl: string,
  model: string,
  detail: ImageDetail,
): Promise<VisionAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: VISION_SYSTEM },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl, detail } },
            { type: "text", text: VISION_PROMPT },
          ],
        },
      ],
      response_format: { type: "json_object" },
      // rawText + 구조화 필드 5개 포함하므로 600 토큰
      max_tokens: 600,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Vision API ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices: {
      message: { content: string | null; refusal?: string | null };
      finish_reason?: string;
    }[];
    usage?: { total_tokens?: number };
  };

  const choice = data.choices[0];
  const content = choice?.message?.content;

  if (!content) {
    console.error(
      `[visionAnalyze:${model}] empty content. Full response:`,
      JSON.stringify(data, null, 2),
    );
    const reason = choice?.finish_reason ?? "unknown";
    const refusal = choice?.message?.refusal;

    if (refusal) throw new VisionRefusalError(refusal);
    if (reason === "content_filter") {
      throw new VisionRefusalError("정책 차단 (content_filter)");
    }
    if (reason === "length") {
      throw new Error("응답이 잘렸어요. 다시 시도해주세요.");
    }
    throw new Error(`Vision API empty response (finish_reason=${reason})`);
  }

  interface RawVisionResponse {
    isFragrance?: boolean;
    rawText?: string;
    brand?: string;
    name?: string;
    concentration?: string;
    size?: string;
  }

  let parsed: RawVisionResponse;
  try {
    parsed = JSON.parse(content) as RawVisionResponse;
  } catch {
    console.error(`[visionAnalyze:${model}] JSON parse failed. content:`, content);
    throw new Error("Vision 응답을 JSON으로 파싱할 수 없어요.");
  }

  const brand = String(parsed.brand ?? "").trim();
  let name = String(parsed.name ?? "").trim();
  const concentration = String(parsed.concentration ?? "").trim();
  const rawText = String(parsed.rawText ?? "").trim();

  // 안전망: LLM이 여전히 부향률을 name으로 넣은 경우 제거
  // 예) name="Eau de Parfum", concentration="" → name을 비움
  if (name && isConcentrationOnly(name)) {
    console.warn(
      `[visionAnalyze:${model}/${detail}] name이 부향률("${name}")로 추출됨 → 비움. rawText="${rawText}"`,
    );
    name = "";
  }

  // 디버깅용: 추출 결과 한 줄 로그 (운영 중 오인식 추적)
  console.log(
    `[visionAnalyze:${model}/${detail}] brand="${brand}" name="${name}" conc="${concentration}" raw="${rawText.slice(0, 120)}"`,
  );

  return {
    isFragrance: Boolean(parsed.isFragrance),
    brand,
    name,
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}

/**
 * 부향률·용량 같은 비-제품명 텍스트를 name 후보에서 걸러내기 위한 안전망.
 * LLM이 프롬프트를 무시하고 "Eau de Parfum"을 name으로 반환하는 경우 차단.
 */
function isConcentrationOnly(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[.\s]/g, "");
  const blocklist = [
    "eaudeparfum",
    "eaudetoilette",
    "eaudecologne",
    "eaufraiche",
    "parfum",
    "edp",
    "edt",
    "edc",
    "cologne",
    "extraitdeparfum",
    "extrait",
  ];
  return blocklist.includes(normalized);
}

/**
 * 1차 low pass 결과를 보고 "high로 재시도해야 할 정도로 의심스러운가" 판단.
 *
 * 안전망(isConcentrationOnly)이 부향률 단어를 빈 값으로 강제 변환하므로,
 * "name이 비었다" = "low 해상도로는 진짜 제품명을 못 읽었다"는 신호.
 *
 * 트리거 조건 (하나라도 만족 시 high 재시도):
 *  - isFragrance=false: 향수 아닌 사진은 high로 재시도해도 답 없음
 *  - brand 또는 name이 빈 문자열: 핵심 필드 결손
 *  - name이 5자 이하: "Polo", "N°5" 같은 짧은 이름은 진짜이긴 한데 잘못 잡혔을 수 있음
 *    (false positive로 high pass 추가 발생하지만 정확도 우선)
 *
 * concentration이 비어있는 경우는 high 재시도 트리거에 넣지 않음 — 향수 라벨에 부향률
 * 표기가 아예 없는 경우(예: 일부 미니어처)도 있어 false positive 너무 많아짐.
 */
function needsHighResRetry(r: VisionAnalysis): boolean {
  if (!r.isFragrance) return false;
  if (!r.brand || !r.name) return true;
  if (r.name.length <= 5) return true;
  return false;
}

/**
 * 모델 거부(refusal) 시 gpt-4o → gpt-4o-mini 자동 fallback.
 * detail 파라미터를 받아 low/high 양쪽 호출에서 재사용.
 */
async function callWithRefusalFallback(
  imageUrl: string,
  detail: ImageDetail,
): Promise<VisionAnalysis> {
  try {
    return await callVisionOnce(imageUrl, "gpt-4o", detail);
  } catch (err) {
    if (!(err instanceof VisionRefusalError)) throw err;
    console.warn(
      `[visionAnalyze] gpt-4o(${detail}) refused (${err.refusal}). Falling back to gpt-4o-mini...`,
    );
  }
  try {
    return await callVisionOnce(imageUrl, "gpt-4o-mini", detail);
  } catch (err) {
    if (err instanceof VisionRefusalError) {
      throw new Error(
        "이 사진은 AI가 분석을 거부했어요. 향수병이 또렷이 보이는 다른 각도의 사진으로 시도해주세요. (광고 이미지나 인물이 포함된 사진은 거부될 수 있어요)",
      );
    }
    throw err;
  }
}

export async function analyzeFragranceFromUrl(
  imageUrl: string,
): Promise<VisionAnalysis> {
  // 1차 pass: detail="low" — 빠르고 쌈. 대부분 또렷한 라벨은 여기서 끝.
  const firstPass = await callWithRefusalFallback(imageUrl, "low");

  if (!needsHighResRetry(firstPass)) {
    return firstPass;
  }

  // 2차 pass: detail="high" — 작은 글씨/흐린 사진 등 어려운 케이스 보강.
  // 비용은 약 9배지만 1차에서 걸러진 케이스만 진입하므로 평균 비용 영향 적음.
  console.log(
    `[visionAnalyze] 1패스 의심 → high 재시도. 1패스 결과: brand="${firstPass.brand}" name="${firstPass.name}"`,
  );

  try {
    const secondPass = await callWithRefusalFallback(imageUrl, "high");

    // high pass도 brand/name이 비면 1차 결과가 더 나쁘진 않으니 1차 유지.
    // 둘 다 채워졌으면 high 결과 우선 (더 정확).
    if (secondPass.brand && secondPass.name) {
      // 토큰 누적: 1차 + 2차 비용을 사용자에게 정확히 보고
      return {
        ...secondPass,
        tokensUsed: firstPass.tokensUsed + secondPass.tokensUsed,
      };
    }

    console.log(
      `[visionAnalyze] high pass도 brand/name 결손 → 1패스 결과 반환`,
    );
    return {
      ...firstPass,
      tokensUsed: firstPass.tokensUsed + secondPass.tokensUsed,
    };
  } catch (err) {
    // 2차에서 에러나면 1차 결과라도 반환 (전체 실패보단 부분 결과가 나음)
    console.warn(
      `[visionAnalyze] high 재시도 실패 → 1패스 결과 반환:`,
      err instanceof Error ? err.message : err,
    );
    return firstPass;
  }
}
