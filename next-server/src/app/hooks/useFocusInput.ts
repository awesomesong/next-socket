import { useCallback, useRef } from "react";

/**
 * 입력 필드 포커스 공통 훅
 * - focusInput: 단순 포커스
 * - focusAndHold: 즉시 포커스 + focusout 이벤트 기반 자동 복구
 *   · composition 중에는 복구 건너뛰기 (한글 IME 보호)
 * - cancelFocus: 복구 해제
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

  const focusAndHold = useCallback(() => {
    const el =
      internalRef.current ??
      (document.getElementById(fieldId) as HTMLTextAreaElement | null);
    if (!el) return;

    el.focus();
    holdCleanupRef.current?.();

    // composition 중에는 focus() 호출을 건너뛰어 한글 IME 보호
    let composing = false;
    const onCompStart = () => { composing = true; };
    const onCompEnd = () => { composing = false; };

    // focusout 이벤트 기반: 포커스를 잃었을 때만 복구 시도 (rAF 폴링 대비 배터리 절약)
    const onFocusOut = (e: FocusEvent) => {
      if (composing) return;
      // relatedTarget이 있으면 사용자가 버튼/링크 등을 의도적으로 클릭한 것 → 복구 안 함
      if (e.relatedTarget) return;
      requestAnimationFrame(() => {
        if (!composing && document.activeElement !== el) {
          el.focus();
        }
      });
    };

    el.addEventListener("compositionstart", onCompStart);
    el.addEventListener("compositionend", onCompEnd);
    el.addEventListener("focusout", onFocusOut);

    holdCleanupRef.current = () => {
      el.removeEventListener("compositionstart", onCompStart);
      el.removeEventListener("compositionend", onCompEnd);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [fieldId]);

  return { focusInput, focusAndHold, cancelFocus, doFocus, setTextareaRef };
}
