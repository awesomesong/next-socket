/**
 * 스캔한 향수의 정보를 바탕으로 비슷한 느낌의 향수 목록을 LLM으로 생성.
 * - gpt-4o-mini ($0.0001/호출)
 * - 결과는 ScanResult.naverRecoCache에 24h 캐시 → 반복 호출 없음
 */

export interface FragranceSuggestion {
  brand: string;
  name: string;
}

const SYSTEM_PROMPT = `당신은 향수 전문가입니다. 주어진 향수와 비슷한 느낌·계열의 향수를 추천합니다.

규칙:
- 올리브영·시코르·롯데/현대/신세계 백화점·브랜드 공식몰 등 국내 공식 판매처에서 취급하는 향수 우선
- 국내에서 정식 유통되며 실제로 구매 가능한 향수만 (병행수입·해외직구 제외)
- 다양한 브랜드에서 선택 (같은 브랜드 반복 금지)
- 주어진 향수 자체는 제외
- hallucination 금지 — 확실한 향수만`;

function buildUserPrompt(
  brand: string,
  name: string,
  description: string | null,
  notes: string | null,
): string {
  const lines = [`브랜드: ${brand}`, `향수명: ${name}`];
  if (notes) lines.push(`노트: ${notes}`);
  if (description) lines.push(`설명: ${description}`);

  return `다음 향수와 비슷한 느낌의 향수 4개를 추천해주세요.

${lines.join('\n')}

JSON 배열로만 응답하세요 (다른 텍스트 없이):
[
  {"brand": "브랜드명", "name": "향수이름"},
  ...
]`;
}

export async function suggestSimilarFragrances(
  brand: string,
  name: string,
  description: string | null,
  notes: string | null,
): Promise<FragranceSuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[suggestSimilar] OPENAI_API_KEY missing');
    return [];
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(brand, name, description, notes) },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      console.error(`[suggestSimilar] API ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      choices: { message: { content: string | null } }[];
    };
    const content = data.choices[0]?.message?.content;
    if (!content) return [];

    // response_format: json_object 는 최상위가 object 여야 해서
    // LLM이 { "suggestions": [...] } 또는 { "fragrances": [...] } 등으로 감쌀 수 있음
    const parsed = JSON.parse(content) as Record<string, unknown>;

    // 배열 값을 가진 첫 번째 키를 찾음
    const arr = Object.values(parsed).find(Array.isArray) as
      | { brand?: string; name?: string }[]
      | undefined;

    if (!arr) return [];

    return arr
      .filter((item) => item.brand && item.name)
      .map((item) => ({
        brand: String(item.brand).trim(),
        name: String(item.name).trim(),
      }))
      .slice(0, 5);
  } catch (err) {
    console.error('[suggestSimilar] error:', err);
    return [];
  }
}
