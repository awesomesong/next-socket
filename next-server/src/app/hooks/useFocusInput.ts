import type { RefObject } from "react";
import { useCallback, useRef } from "react";

/**
 * 입력 필드 포커스 공통 훅
 * - focusInput: 단순 포커스
 * - focusAndHold(gracePeriodMs): 즉시 포커스 후 지정된 시간(gracePeriodMs) 뒤에
 *   포커스 탈취 여부를 1회 확인하여 복구한다.
 *   사용자가 클릭(pointerdown)으로 의도적 포커스 이동 시 복구 중단.
 * - cancelFocus: 복구 대기 예약 취소
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
   * 마운트 초기 포커스:
   * - 즉시 포커스
   * - third-party 스크립트(Cloudinary 등)의 포커스 탈취를 방어하기 위해 콜백 1회성 확인
   * - 모바일 환경에서 키보드 깜빡임(flickering)을 유발하는 50ms 폴링 제거
   */
  const focusAndHold = useCallback((gracePeriodMs = 1500) => {
      const el =
        inputRef?.current ??
        (document.getElementById(fieldId) as HTMLTextAreaElement | null);
      if (!el) return;

      el.focus();
      holdCleanupRef.current?.();

      let stopped = false;
      const stopOnPointer = () => { stopped = true; };
      // 캡처 단계에서 너무 민감하게 반응하지 않도록 passive 처리
      document.addEventListener("pointerdown", stopOnPointer, { once: true, passive: true });

      // 마운트 및 페이지 전환 직후 발생할 수 있는 일시적 포커스 유실을 방어하기 위해
      // 무한 폴링 대신, 초기 몇 차례(100ms, 300ms, 500ms)만 점진적으로 확인 및 복구 시도
      const checks = [100, 300, 500, Math.min(gracePeriodMs, 800)];
      const timeouts = checks.map(ms => 
        window.setTimeout(() => {
          if (!stopped && document.activeElement !== el) {
            const form = el.closest("form");
            const target = document.activeElement;
            // 같은 폼 내부(버튼 등)로 이동한 게 아니면 (body 등으로 뺏기면) 복구
            if (!target || !form?.contains(target)) {
              el.focus();
            }
          }
        }, ms)
      );

      // 마지막 타이머가 끝날 즈음 이벤트 리스너 정리
      const cleanupTimeout = window.setTimeout(() => {
        document.removeEventListener("pointerdown", stopOnPointer);
        holdCleanupRef.current = null;
      }, Math.min(gracePeriodMs, 800) + 10);

      holdCleanupRef.current = () => {
        timeouts.forEach(clearTimeout);
        clearTimeout(cleanupTimeout);
        document.removeEventListener("pointerdown", stopOnPointer);
      };
    },
    [fieldId, inputRef]
  );

  return { focusInput, focusAndHold, cancelFocus, doFocus };
}
