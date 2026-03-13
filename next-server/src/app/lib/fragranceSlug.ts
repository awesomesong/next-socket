import prisma from '../../../prisma/db';

export function normalizeBrandForSlug(brand: string): string {
    const base = (brand ?? "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return base || "brand";
}

/**
 * 브랜드 기준으로 slug 자동 생성.
 * - 첫 번째: "diptyque"
 * - 두 번째부터: "diptyque-2", "diptyque-3" ...
 * - 삭제로 생긴 갭 없이 다음 빈 번호를 찾아 반환.
 */
export async function generateBrandIndexSlug(brand: string): Promise<string> {
    const base = normalizeBrandForSlug(brand);

    // base 정확 일치 + "base-숫자" 패턴만 수집 (과다 매칭 방지)
    const existing = await prisma.fragrance.findMany({
        where: {
            OR: [
                { slug: base },
                { slug: { startsWith: `${base}-` } },
            ],
        },
        select: { slug: true },
    });

    if (existing.length === 0) return base;

    const slugSet = new Set(existing.map((f) => f.slug));

    if (!slugSet.has(base)) return base;

    // 삭제 갭을 고려해 다음 빈 번호 탐색
    let n = 2;
    while (slugSet.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}
