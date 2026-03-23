import type { RefObject } from "react";
import { useCallback, useRef } from "react";

/**
 * 입력 필드 포커스 공통 훅
 * - focusInput: 단순 포커스
 * - focusAndHold(gracePeriodMs): 즉시 포커스 후 gracePeriodMs 동안 50ms 폴링으로
 *   포커스 탈취를 감지해 즉시 복구한다.
 *   사용자가 직접 pointerdown(클릭)하면 폴링 중단 → 의도적 포커스 이동 허용.
 *   keydown은 중단 조건에서 제외 → 타이핑 중에도 포커스 보호 유지.
 * - cancelFocus: 폴링 즉시 중단 (메시지 전송 시 호출)
 */
export function useFocusInput(
  fieldId: string,
  inputRef?: RefObject<HTMLTextAreaElement | null>
) {
  const holdCleanupRef = useRef<(() => void) | null>(null);

  const doFocus = useCallback(() => {
    const el =
      inputRef?.current ??
      (document.getElementById(fieldId) as HTMLTextAreaElement | null);
    el?.focus();
  }, [fieldId, inputRef]);

  const cancelFocus = useCallback(() => {
    holdCleanupRef.current?.();
    holdCleanupRef.current = null;
  }, []);

  const focusInput = doFocus;

  /**
   * 마운트 초기 포커스 유지:
   * - 즉시 포커스
   * - 이후 50ms 간격으로 document.activeElement를 확인하여 포커스가 빠져나가면 복구
   * - 사용자가 pointerdown(클릭)하면 폴링 중단 (의도적 포커스 이동 허용)
   * - keydown은 중단하지 않음 → 타이핑 중에도 포커스 탈취 즉시 복구
   * - gracePeriodMs 경과 시 자동 종료
   */
  const focusAndHold = useCallback((gracePeriodMs = 1500) => {
      const el =
        inputRef?.current ??
        (document.getElementById(fieldId) as HTMLTextAreaElement | null);
      if (!el) return;

      el.focus();
      holdCleanupRef.current?.();

      const form = el.closest("form");
      let stopped = false;

      // 사용자 클릭 감지 → 폴링 중단 (타이핑은 중단 안 함)
      const stopOnPointer = () => { stopped = true; };
      document.addEventListener("pointerdown", stopOnPointer, { once: true, capture: true });

      const intervalId = window.setInterval(() => {
        if (stopped) {
          window.clearInterval(intervalId);
          return;
        }
        if (document.activeElement === el) return;
        const target = document.activeElement;
        // 같은 폼 내부(버튼 등)로 이동 → 복구 안 함
        if (target && form?.contains(target)) return;
        el.focus();
      }, 50);

      const timeoutId = window.setTimeout(() => {
        window.clearInterval(intervalId);
        document.removeEventListener("pointerdown", stopOnPointer, { capture: true });
        holdCleanupRef.current = null;
      }, gracePeriodMs);

      holdCleanupRef.current = () => {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
        document.removeEventListener("pointerdown", stopOnPointer, { capture: true });
      };
    },
    [fieldId, inputRef]
  );

  return { focusInput, focusAndHold, cancelFocus, doFocus };
}
