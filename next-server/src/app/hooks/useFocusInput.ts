import { useCallback, useRef } from "react";

/**
 * 입력 필드 포커스 공통 훅
 * - focusInput: 단순 포커스
 * - focusAndHold(gracePeriodMs): 즉시 포커스 후 지정된 시간 동안 주기적으로
 *   포커스 탈취 여부를 확인하여 복구한다.
 *   사용자가 클릭(pointerdown)으로 의도적 포커스 이동 시 복구 중단.
 * - cancelFocus: 복구 대기 예약 취소
 */
export function useFocusInput(
  fieldId: string,
  registerRef?: (instance: HTMLTextAreaElement | null) => void
) {
  const holdCleanupRef = useRef<(() => void) | null>(null);
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  // registerRef를 ref로 안정화: register()가 매 렌더마다 새 함수를 반환해도
  // setTextareaRef가 변경되지 않아 불필요한 필드 해제/재등록(값 초기화) 방지
  const registerRefStable = useRef(registerRef);
  registerRefStable.current = registerRef;

  const setTextareaRef = useCallback((el: HTMLTextAreaElement | null) => {
    registerRefStable.current?.(el);
    internalRef.current = el;
  }, []);

  const doFocus = useCallback(() => {
    const el =
      internalRef.current ??
      (document.getElementById(fieldId) as HTMLTextAreaElement | null);
    el?.focus();
  }, [fieldId]);

  const cancelFocus = useCallback(() => {
    holdCleanupRef.current?.();
    holdCleanupRef.current = null;
  }, []);

  const focusInput = doFocus;

  /**
   * 마운트 초기 포커스 + setTimeout 기반 주기적 복구:
   * - 즉시 포커스
   * - gracePeriodMs 내 여러 시점에서 포커스 탈취 여부 확인 → form 밖이면 복구
   * - 사용자 pointerdown 시 복구 중단 (의도적 이동)
   * - focusin 리스너 미사용 → 위젯과의 포커스 쟁탈전 및 입력 차단 없음
   */
  const focusAndHold = useCallback((gracePeriodMs = 3000) => {
    const el =
      internalRef.current ??
      (document.getElementById(fieldId) as HTMLTextAreaElement | null);
    if (!el) return;

    el.focus();
    holdCleanupRef.current?.();

    let stopped = false;
    const form = el.closest("form");

    const stopOnPointer = () => { stopped = true; };
    document.addEventListener("pointerdown", stopOnPointer, { once: true, passive: true });

    // gracePeriodMs 내 주기적 확인 (고정 간격이 아닌 점진적 체크)
    const checkPoints = [100, 300, 500, 800, 1200, 2000, 3000].filter(ms => ms <= gracePeriodMs);
    const timeouts = checkPoints.map(ms =>
      window.setTimeout(() => {
        if (stopped) return;
        if (document.activeElement !== el) {
          const target = document.activeElement;
          if (!target || !form?.contains(target)) {
            el.focus();
          }
        }
      }, ms)
    );

    const cleanupTimeout = window.setTimeout(() => {
      document.removeEventListener("pointerdown", stopOnPointer);
      holdCleanupRef.current = null;
    }, gracePeriodMs + 10);

    holdCleanupRef.current = () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(cleanupTimeout);
      document.removeEventListener("pointerdown", stopOnPointer);
    };
  },
    [fieldId]
  );

  return { focusInput, focusAndHold, cancelFocus, doFocus, setTextareaRef };
}
