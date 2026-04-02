/**
 * iOS Safari 키보드 유지 유틸리티
 *
 * iOS Safari는 사용자 제스처 이벤트 핸들러 내에서만 input.focus()로
 * 키보드를 열 수 있다. 페이지 네비게이션 시 제스처 컨텍스트가 소실되어
 * 자동 포커스가 작동하지 않는 문제를 우회하기 위해,
 * 네비게이션 직전에 임시 input을 생성·포커스하여 키보드를 유지한다.
 *
 * 사용법:
 *   1. 대화방 네비게이션 onClick 핸들러에서 captureIOSKeyboard() 호출
 *   2. 대상 페이지의 textarea가 마운트되면 useFocusInput의 focusAndHold()가
 *      실제 textarea로 포커스를 이전하고 releaseIOSKeyboard()로 정리
 */

let tempInput: HTMLInputElement | null = null;

export function captureIOSKeyboard() {
  if (typeof navigator === "undefined" || navigator.maxTouchPoints <= 0) return;

  releaseIOSKeyboard();

  tempInput = document.createElement("input");
  tempInput.setAttribute("type", "text");
  tempInput.setAttribute("aria-hidden", "true");
  tempInput.setAttribute("tabindex", "-1");
  Object.assign(tempInput.style, {
    position: "fixed",
    top: "0",
    left: "-9999px",
    width: "1px",
    height: "1px",
    opacity: "0",
    fontSize: "16px", // iOS 확대 방지
    pointerEvents: "none",
  });
  document.body.appendChild(tempInput);
  tempInput.focus();
}

export function releaseIOSKeyboard() {
  if (tempInput) {
    tempInput.remove();
    tempInput = null;
  }
}
