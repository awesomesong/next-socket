/**
 * In-memory sliding window 레이트 리밋 (분당 5회/key).
 * Vercel serverless 환경에서는 instance 단위 — 분산 환경에선 한계 있지만
 * 베타 단계 비용 방어용으로 충분. 운영 확장 시 Redis 검토.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const store = new Map<string, number[]>();

export function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
} {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetInMs: WINDOW_MS - (now - oldest),
    };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - timestamps.length,
    resetInMs: WINDOW_MS,
  };
}

export function getClientKey(req: Request): string {
  // x-forwarded-for (Vercel) > x-real-ip > fallback
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
