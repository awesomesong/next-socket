/**
 * brand + name 텍스트 → 향수 노트·설명 생성 (LLM 향수 지식 활용).
 * - gpt-4o-mini로 비용 최소화 ($0.0001/호출)
 * - JSON 응답으로 안전 파싱
 * - LLM이 모르는 향수면 빈 응답 (hallucination 방지 프롬프트)
 */

export interface EnrichedInfo {
  description: string;
  notes: string;
  englishSlug: string; // LLM이 생성한 영문 표준 slug (잘 모르면 "")
  confident: boolean; // LLM이 이 향수를 안다고 확신하는지
  tokensUsed: number;
}

// 등록 폼용 — 확실한 정보만 반환
const ENRICH_SYSTEM = `당신은 향수 전문가입니다. 사용자가 식별한 향수 정보(브랜드 + 이름)를 받아, 당신의 향수 지식에 기반해 한국어로 설명과 노트를 제공합니다.

중요:
- 잘 아는 향수만 정보를 제공하세요. 모르거나 확신 없으면 모든 필드를 빈 문자열로 두고 "confident": false 반환.
- hallucination 금지. 추측한 정보는 빈 문자열.
- 정보가 정확하면 "confident": true.`;

const ENRICH_USER_TEMPLATE = (brand: string, name: string) => `다음 향수에 대해 알려주세요:

브랜드: ${brand}
향수명: ${name}

JSON 형식으로만 응답하세요:
{
  "confident": true/false (이 향수가 어떤 것인지 정확히 안다면 true, 추측이면 false),
  "englishSlug": "이 향수의 표준 영문 slug (소문자 + 밑줄). 예시: 'dior_sauvage', 'chanel_no5_leau', 'diptyque_philosykos', 'jomalone_lime_basil_mandarin'. 잘 모르면 빈 문자열.",
  "description": "잘 안다면 2~3 문장 한국어 설명 (계열·분위기·어울리는 상황). 잘 모르면 빈 문자열.",
  "notes": "잘 안다면 'TOP: ..., HEART: ..., BASE: ...' 형식 한국어. 잘 모르면 빈 문자열."
}

englishSlug 규칙:
- 영문 소문자만, 단어 사이 밑줄 (_)
- 특수문자·공백 모두 밑줄로 변환
- 브랜드명과 향수명을 영문 표기로 (입력이 한글이어도 영문 변환)
- 알려진 향수면 표준 영문 이름 사용 (예: "오 소바쥬" 입력 → "sauvage")
- 모르는 향수면 빈 문자열 (코드가 fallback 처리)`;

// 스캔 결과용 — 항상 최선을 다해 생성
const SCAN_ENRICH_SYSTEM = `당신은 향수 전문가입니다. 브랜드와 향수명을 받아 한국어로 설명과 노트를 반드시 작성합니다.

규칙:
- 해당 향수를 알고 있다면 정확한 정보를 작성하세요.
- 정확히 모르더라도 브랜드 성향·향수명·계열을 근거로 합리적인 설명을 작성하세요. 빈 값은 허용하지 않습니다.
- description: 계열, 분위기, 어울리는 상황을 2~3문장 한국어로.
- notes: 'TOP: ...\nHEART: ...\nBASE: ...' 형식 한국어로.`;

const SCAN_ENRICH_USER_TEMPLATE = (brand: string, name: string) => `다음 향수의 설명과 노트를 작성해 주세요:

브랜드: ${brand}
향수명: ${name}

JSON 형식으로만 응답하세요:
{
  "confident": true/false,
  "englishSlug": "표준 영문 slug (소문자 + 밑줄). 모르면 빈 문자열.",
  "description": "2~3문장 한국어 설명 (계열·분위기·어울리는 상황). 반드시 작성.",
  "notes": "TOP: ...\\nHEART: ...\\nBASE: ... 형식 한국어. 반드시 작성."
}`;

export async function enrichFragranceInfo(
  brand: string,
  name: string,
  options?: { generateAlways?: boolean },
): Promise<EnrichedInfo> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  if (!brand || !name) {
    return {
      description: "",
      notes: "",
      englishSlug: "",
      confident: false,
      tokensUsed: 0,
    };
  }

  const forScan = options?.generateAlways === true;
  const systemPrompt = forScan ? SCAN_ENRICH_SYSTEM : ENRICH_SYSTEM;
  const userPrompt = forScan
    ? SCAN_ENRICH_USER_TEMPLATE(brand, name)
    : ENRICH_USER_TEMPLATE(brand, name);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 700,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[enrichInfo] API ${res.status}: ${errBody.slice(0, 200)}`);
    return {
      description: "",
      notes: "",
      englishSlug: "",
      confident: false,
      tokensUsed: 0,
    };
  }

  const data = (await res.json()) as {
    choices: { message: { content: string | null } }[];
    usage?: { total_tokens?: number };
  };
  const content = data.choices[0]?.message?.content;
  if (!content) {
    console.error("[enrichInfo] empty content");
    return {
      description: "",
      notes: "",
      englishSlug: "",
      confident: false,
      tokensUsed: 0,
    };
  }

  try {
    const parsed = JSON.parse(content) as {
      confident?: boolean;
      description?: string;
      notes?: string;
      englishSlug?: string;
    };
    return {
      confident: Boolean(parsed.confident),
      description: String(parsed.description ?? "").trim(),
      notes: String(parsed.notes ?? "").trim(),
      englishSlug: sanitizeSlug(String(parsed.englishSlug ?? "")),
      tokensUsed: data.usage?.total_tokens ?? 0,
    };
  } catch (parseErr) {
    console.error("[enrichInfo] JSON parse failed:", parseErr, "content:", content);
    return {
      description: "",
      notes: "",
      englishSlug: "",
      confident: false,
      tokensUsed: 0,
    };
  }
}

/**
 * LLM 출력 slug를 안전한 형식으로 정리 (LLM이 가끔 대문자·공백·하이픈 섞음).
 */
function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
