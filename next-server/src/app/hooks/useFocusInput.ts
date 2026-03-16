import type { RefObject } from "react";
import { useCallback, useRef } from "react";

/**
 * 입력 필드 포커스 공통 훅
 * - ref 전달 시 ref.current 우선, 미전달 시 document.getElementById(fieldId) 폴백
 * - focusInputThenAgain(delayMs): 즉시 포커스 후 delayMs 뒤 한 번 더 (전송 후 리렌더 대비)
 * - focusAndHold(gracePeriodMs): 즉시 포커스 후 gracePeriodMs 동안 focusout 감지 → 빼앗기면 즉시 복구
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
   * 과거의 시간 기반 재포커스(focusInputThenAgain)는 제거하고,
   * 실제 API 완료/렌더링 이후에 호출할 수 있도록 doFocus만 노출한다.
   */

  /**
   * 마운트 초기 포커스용: 즉시 포커스 후 gracePeriodMs 동안 focusout 이벤트를 감지하여
   * 외부 요인(예: Cloudinary 위젯 초기화)에 의해 포커스가 빼앗기면 즉시 복구한다.
   * 같은 폼 내부 요소(버튼 등)로 이동 시에는 복구하지 않는다.
   */
  const focusAndHold = useCallback((gracePeriodMs = 1500) => {
      const el =
        inputRef?.current ??
        (document.getElementById(fieldId) as HTMLTextAreaElement | null);
      if (!el) return;

      el.focus();

      // 이전 listener 정리
      holdCleanupRef.current?.();

      const form = el.closest("form");

      const handleFocusOut = (e: FocusEvent) => {
        // 같은 폼 내부(버튼 등)로 이동 → refocus 안 함
        if (e.relatedTarget && form?.contains(e.relatedTarget as Node)) return;
        requestAnimationFrame(() => el.focus());
      };

      el.addEventListener("focusout", handleFocusOut);

      // gracePeriodMs 후 listener 자동 제거
      const timeoutId = window.setTimeout(() => {
        el.removeEventListener("focusout", handleFocusOut);
        holdCleanupRef.current = null;
      }, gracePeriodMs);

      holdCleanupRef.current = () => {
        window.clearTimeout(timeoutId);
        el.removeEventListener("focusout", handleFocusOut);
      };
    },
    [fieldId, inputRef]
  );

  return { focusInput, focusAndHold, cancelFocus, doFocus };
}
