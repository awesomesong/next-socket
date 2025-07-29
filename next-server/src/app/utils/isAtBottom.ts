export const isAtBottom = (
    el: HTMLElement | null,
    isAndroid: boolean = /Android/i.test(navigator.userAgent)
  ): boolean => {
    if (!el) return false;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const visualViewportHeight = window.visualViewport?.height || window.innerHeight;
    const keyboardGap = isAndroid ? window.innerHeight - visualViewportHeight : 0;
    const threshold = isAndroid ? Math.max(180, keyboardGap) : 100;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    return distanceFromBottom <= threshold;
};
  