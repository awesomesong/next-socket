// Shared AI topic/safety policy (isomorphic: usable on server and client)

export function normalizeText(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // 제로폭 제거
    .replace(/[^\S\r\n]+/g, " "); // 공백 정리(개행 유지)
}

export const PROHIBITED_PATTERNS: RegExp[] = [
  // 불법/마약/폭탄 + 제조/제작/만들기 (단독 '제조' 오탐 방지)
  /(?:불법|마약|폭탄)[\w\s]*?(?:제\s*조|제\s*작|만들\s*기)/u,
  // 성적(행위/콘텐츠/표현) 등 구체화 (학업 '성적' 오탐 방지)
  /성\s*적\s*(?:행위|콘텐츠|표현|묘사|착취)/u,
  // 증오/혐오/차별 + 발언/표현
  /(?:증\s*오|혐\s*오|차\s*별)[\w\s]*?(?:발\s*언|표\s*현)/u,
  // 자해/자살/학대
  /자\s*해|자\s*살|학\s*대/u,
];


export function containsProhibited(message: string): boolean {
  const text = normalizeText(message ?? ""); // 한 번만 정규화
  if (text.length === 0) return false; // 빠른 종료(선택)
  return PROHIBITED_PATTERNS.some((re) => re.test(text));
}

export function validatePrompt(message: string): {
  isValid: boolean;
  error?: string;
} {
  if (!message || !message.trim())
    return { isValid: false, error: "메시지를 입력해주세요." };
  if (containsProhibited(message))
    return { isValid: false, error: "부적절한 내용은 허용되지 않습니다." };
  return { isValid: true };
}

// General chat validation: only block prohibited content and empty input
export function validateUserMessage(message: string): {
  isValid: boolean;
  error?: string;
} {
  if (!message || !message.trim())
    return { isValid: false, error: "메시지를 입력해주세요." };
  if (containsProhibited(message))
    return { isValid: false, error: "부적절한 내용은 허용되지 않습니다." };
  return { isValid: true };
}
