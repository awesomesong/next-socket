import { useCallback, useRef } from "react";

/**
 * 입력 필드 포커스 공통 훅
 * - focusInput: 단순 포커스
 * - focusAndHold: 즉시 포커스 + rAF 폴링으로 상시 복구
 *   · cross-origin iframe 포커스 탈취도 감지 (이벤트 미발생 케이스 대응)
 *   · 사용자 터치에 의한 포커스 이동(form 밖 터치 후 100ms 이내) → 허용
 *   → 모바일 키보드 깜빡임 없이 포커스 유지
 * - cancelFocus: 복구 폴링 해제
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
   * 즉시 포커스 + requestAnimationFrame 폴링:
   * - 매 프레임 document.activeElement를 확인하여 포커스 탈취 감지
   *   · blur/focusin 이벤트가 발생하지 않는 cross-origin iframe도 감지
   *   · ~16ms 이내 복구 → 모바일 키보드 hide 애니메이션 시작 전 복구
   * - form 밖 터치 → 복구 중단 / form 안 터치 → 복구 재개
   * - cancelFocus() 또는 컴포넌트 언마운트 시 폴링 중단
   */
  const focusAndHold = useCallback(() => {
    const el =
      internalRef.current ??
      (document.getElementById(fieldId) as HTMLTextAreaElement | null);
    if (!el) return;

    el.focus();
    holdCleanupRef.current?.();

    const form = el.closest("form");

    // form 안 터치 → 복구 재개, form 밖 터치 → 복구 중단
    let paused = false;
    const handlePointer = (e: Event) => {
      const target = e.target as Node;
      if (form?.contains(target)) {
        paused = false;
        return;
      }
      paused = true;
    };
    document.addEventListener("pointerdown", handlePointer, { passive: true });

    // rAF 폴링: 매 프레임 activeElement 확인 → 탈취 시 즉시 복구
    let rafId: number;
    const checkFocus = () => {
      if (!paused && document.activeElement !== el) {
        const target = document.activeElement;
        if (!target || !form?.contains(target)) {
          el.focus();
        }
      }
      rafId = requestAnimationFrame(checkFocus);
    };
    rafId = requestAnimationFrame(checkFocus);

    holdCleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("pointerdown", handlePointer);
      paused = true;
    };
  },
    [fieldId]
  );

  return { focusInput, focusAndHold, cancelFocus, doFocus, setTextareaRef };
}
