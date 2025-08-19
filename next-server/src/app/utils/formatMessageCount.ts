export const formatMessageCount = (count: number) => {
    const n = Number.isFinite(count) ? count : Number(count);
    const safe = Math.max(0, Number.isFinite(n) ? n : 0);
    return safe >= 100 ? "99+" : String(safe);
}