/**
 * 라우터 이동 후 목적지 페이지에서 토스트를 띄우기 위한 URL 생성 헬퍼.
 * router.push(withToastParams('/path', 'success', '메시지')) 형태로 사용.
 */
export type ToastType = "success" | "error" | "custom";

export function withToastParams(
  path: string,
  type: ToastType,
  message: string
): string {
  const params = new URLSearchParams();
  params.set("toast", type);
  params.set("message", message);
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${params.toString()}`;
}
