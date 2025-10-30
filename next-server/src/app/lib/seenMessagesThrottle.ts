/**
 * API 중복 호출 방지 (Throttle)
 * 같은 키에 대해 일정 시간 내 중복 호출 차단
 */

type ApiType = 'readMessages';

const lastCallMap = new Map<string, Map<string, number>>();

function getApiMap(apiType: ApiType): Map<string, number> {
  if (!lastCallMap.has(apiType)) {
    lastCallMap.set(apiType, new Map<string, number>());
  }
  return lastCallMap.get(apiType)!;
}

function shouldCallApi(apiType: ApiType, key: string, throttleMs: number = 1000): boolean {
  const apiMap = getApiMap(apiType);
  const now = Date.now();
  const lastCall = apiMap.get(key) || 0;
  
  if (now - lastCall < throttleMs) {
    return false; // throttleMs 이내 중복 호출 차단
  }
  
  apiMap.set(key, now);
  return true;
}

// ✅ 간편한 wrapper 함수들
export function shouldCallReadMessages(conversationId: string): boolean {
  return shouldCallApi('readMessages', conversationId);
}

// ✅ 쓰로틀 초기화 함수
export function resetReadMessagesThrottle(conversationId: string): void {
  const apiMap = getApiMap('readMessages');
  apiMap.delete(conversationId);
}

// ✅ 모든 쓰로틀 초기화 함수
export function resetAllReadMessagesThrottle(): void {
  const apiMap = getApiMap('readMessages');
  apiMap.clear();
}

