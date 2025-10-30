export interface ScrollFlags {
  atBottom: boolean;
  showArrow: boolean;
}

/**
 * prevAtBottom을 함께 넣으면 히스테리시스 적용 가능:
 *  - 하단 진입 임계(BOTTOM_IN_EPS)
 *  - 하단 이탈 임계(BOTTOM_OUT_EPS) : 진입보다 작게/크게 설정해 깜빡임 방지
 */
export function computeScrollFlags(
  el: HTMLElement | null,
  keyboardAware: boolean = true,
  prevAtBottom?: boolean, // ← 선택: 이전 상태로 히스테리시스
): ScrollFlags {
  if (!el) return { atBottom: false, showArrow: false };

  // 읽기
  let scrollTop = el.scrollTop;
  const scrollHeight = el.scrollHeight;
  const clientHeight = el.clientHeight;

  // 내용이 컨테이너보다 작거나 같으면 항상 바닥으로 간주 (화살표 숨김)
  if (scrollHeight <= clientHeight + 1) {
    return { atBottom: true, showArrow: false };
  }

  // iOS overscroll(음수) / 과도 스크롤 클램프
  const maxTop = Math.max(0, scrollHeight - clientHeight);
  scrollTop = Math.max(0, Math.min(scrollTop, maxTop));

  // 기본 여유
  let baseEPS = 64;

  // 모바일 키보드 대응 (과대보정 방지: 32~160 사이로 클램프)
  if (keyboardAware && window.visualViewport) {
    const shrink = Math.max(0, window.innerHeight - window.visualViewport.height);
    baseEPS = Math.max(baseEPS, Math.ceil(shrink / 2));
  }
  const EPS = Math.max(32, Math.min(baseEPS, 160));

  // 히스테리시스 임계(선택): prevAtBottom이 true면 조금 더 관대하게 유지
  const BOTTOM_IN_EPS = EPS + 0.5;          // 하단 '진입'/유지 임계
  const BOTTOM_OUT_EPS = Math.max(16, EPS / 2); // 하단 '이탈' 임계(더 타이트)

  const gap = scrollHeight - (scrollTop + clientHeight);

  // prevAtBottom이 있으면 히스테리시스 적용
  let atBottom: boolean;
  if (typeof prevAtBottom === "boolean") {
    atBottom = prevAtBottom
      ? gap <= BOTTOM_IN_EPS   // 이미 바닥이었다면 관대하게 유지
      : gap <= BOTTOM_OUT_EPS; // 바닥이 아니었다면 엄격히 들어와야 진입
  } else {
    atBottom = gap <= BOTTOM_IN_EPS;
  }

  const showArrow = !atBottom && scrollHeight > clientHeight + EPS;
  return { atBottom, showArrow };
}