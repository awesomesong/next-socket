/**
 * 향수 이름 영문 → 한글 음역 변환 (OpenAI LLM).
 *
 * 목적: 네이버 쇼핑 API 1차 검색(영문)이 0건일 때, 한글로 등록된 mall title도
 * 매칭되도록 2차 검색용 한글 쿼리를 생성. 마이너 브랜드(LOE 등) 같은 케이스
 * 대응.
 *
 * 비용:
 *  - gpt-4o-mini ~$0.0001~0.001/호출
 *  - max_tokens 100 (짧은 응답만)
 *  - 1차 검색에 결과 있으면 호출 안 함 → 평균 비용 매우 작음
 *  - 24h prices 캐시 hit 시도 호출 안 함
 *
 * 안전망:
 *  - LLM 응답 실패/timeout 시 빈 문자열 반환 → 호출자가 2차 검색 건너뜀
 *  - 변환 결과가 입력과 동일하면 빈 문자열 반환 (무의미한 재검색 방지)
 */

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const TIMEOUT_MS = 8000;

const SYSTEM_PROMPT = `You are a transliterator for Korean fragrance e-commerce. Convert English perfume names to Korean phonetic spelling (한글 음역) as commonly used by Korean fragrance sellers on Naver Shopping.

Rules:
- Convert each English word to its standard Korean phonetic spelling.
- **CRITICAL: Combine all Korean syllables into one word WITHOUT spaces.** Naver Shopping registers fragrance names as single words (e.g., "피치앤티" not "피치 앤 티"). Spaces between Korean characters break search matching.
- Keep numbers as-is (e.g., "67" stays "67").
- For ambiguous words, use the most common Korean rendering found in actual Naver perfume listings.
- Return JSON only.`;

const USER_PROMPT = (name: string) => `Convert this fragrance name to Korean phonetic spelling (no spaces between Korean characters):
"${name}"

Examples:
  "Peach & Tea" → "피치앤티"      (NOT "피치 앤 티")
  "Apple Cotton" → "애플코튼"     (NOT "애플 코튼")
  "Oud Wood Intense" → "우드인텐스" (NOT "우드 인텐스")
  "Lime Basil Mandarin" → "라임바질만다린"
  "Sauvage" → "사베지"
  "N°5" → "N°5"

Return JSON:
{
  "korean": "한글붙여쓰기결과"
}`;

/**
 * 한글 글자 사이의 공백만 제거 (영문·숫자는 그대로 유지).
 * 네이버 검색이 띄어쓰기에 민감해서 "피치 앤 티"는 못 잡고 "피치앤티"만 잡는 케이스 대응.
 *
 *  "피치 앤 티"      → "피치앤티"
 *  "LOE 피치 앤 티"  → "LOE 피치앤티"   (LOE 뒤 공백은 영문 다음이라 유지)
 *  "apple 코튼 향수"  → "apple 코튼향수" (apple 뒤 공백 유지, 한글-한글 사이만)
 */
function removeKoreanSpaces(s: string): string {
  // lookahead로 "한글 + 공백 + 한글" 패턴의 공백만 제거
  return s.replace(/([가-힣])\s+(?=[가-힣])/g, '$1');
}

/**
 * 향수 영문 이름을 한글 음역으로 변환.
 *
 * @returns 변환된 한글 문자열 (한글 사이 공백 제거됨). 변환 실패 또는 입력과 동일하면 빈 문자열.
 */
export async function transliterateNameToKorean(name: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[transliterate] OPENAI_API_KEY missing — skipping');
    return '';
  }

  const trimmed = name.trim();
  if (!trimmed) return '';

  try {
    const res = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT(trimmed) },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.warn(`[transliterate] API ${res.status} — skipping`);
      return '';
    }

    const data = (await res.json()) as {
      choices: { message: { content: string | null } }[];
    };
    const content = data.choices[0]?.message?.content;
    if (!content) return '';

    const parsed = JSON.parse(content) as { korean?: string };
    const rawKorean = (parsed.korean ?? '').trim();

    // 후처리 안전망: LLM이 띄어쓰기로 줘도 한글 사이 공백 제거
    const korean = removeKoreanSpaces(rawKorean);

    // 변환 실패 또는 입력과 동일 → 무의미한 재검색 방지
    if (!korean || korean === trimmed || korean.toLowerCase() === trimmed.toLowerCase()) {
      return '';
    }

    return korean;
  } catch (err) {
    console.warn('[transliterate] 실패 — skipping:', err instanceof Error ? err.message : err);
    return '';
  }
}
