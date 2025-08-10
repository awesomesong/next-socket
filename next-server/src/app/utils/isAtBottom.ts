export const isAtBottom = (
    el: HTMLElement | null,
    isAndroid: boolean = /Android/i.test(navigator.userAgent),
  ): boolean => {
    if (!el) return false;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const visualViewportHeight = window.visualViewport?.height || window.innerHeight;
    const keyboardGap = isAndroid ? window.innerHeight - visualViewportHeight : 0;
    const threshold = isAndroid ? Math.max(180, keyboardGap) : 100;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    return distanceFromBottom <= threshold;
};

// AI 응답 중 스크롤 감지를 위한 더 민감한 함수
export const isAtBottomForAI = (
    el: HTMLElement | null,
    threshold: number = 5
  ): boolean => {
    if (!el) return false;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    return distanceFromBottom <= threshold;
};
  