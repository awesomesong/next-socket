import { FragranceType, FragranceWithAuthor } from "@/src/app/types/fragrance";
import prisma from "@/prisma/db";

// ─────────────────────────────────────────────
// Server-only functions (Prisma 직접 조회)
// Server Components, generateStaticParams에서만 사용
// ─────────────────────────────────────────────

export const getFragranceSlugsServer = async (): Promise<string[]> => {
    const fragrances = await prisma.fragrance.findMany({
        select: { slug: true },
        orderBy: { createdAt: "asc" },
    });
    
    return fragrances.map((f) => f.slug);
};

export const getFragranceBySlugServer = async (
    slug: string
): Promise<{ fragrance: FragranceWithAuthor }> => {
    const fragrance = await prisma.fragrance.findUnique({
        where: { slug },
        include: {
            author: { select: { id: true, name: true, email: true, image: true, profileImage: true, role: true } }
        },
    });

    if (!fragrance) {
        throw new Error("해당 향수를 찾을 수 없습니다.");
    }

    return { fragrance };
};

type FragranceListParam = {
    pageParam: string;
};

export const getFragrances = async (
    { pageParam }: FragranceListParam
): Promise<FragranceType[]> => {
    const searchParams = '?cursor=' + encodeURIComponent(pageParam ?? '');
    const res = await fetch(`/api/fragrance${searchParams}`, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.message || "향수 목록을 가져오는데 실패했습니다.");
    }

    return responseData.fragrances;
};

export const getFragranceBySlug = async (slug: string): Promise<{ fragrance: FragranceWithAuthor }> => {
    const res = await fetch(`/api/fragrance?slug=${slug}`, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.message || "향수 정보를 가져오는데 실패했습니다.");
    }

    return responseData;
};

export const getFragranceBrands = async (): Promise<string[]> => {
    const res = await fetch('/api/fragrance/brands', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.message || '브랜드 목록을 가져오는데 실패했습니다.');
    }

    return responseData.brands;
};

/** 슬러그 존재 여부만 확인 (중복 체크 등). 전체 fragrance 데이터 불필요할 때 사용 */
export const checkFragranceSlugExists = async (
    slug: string
): Promise<{ exists: boolean; id?: number }> => {
    const res = await fetch(
        `/api/fragrance/slug-exists?slug=${encodeURIComponent(slug)}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || '슬러그 확인에 실패했습니다.');
    }
    return { exists: data.exists ?? false, id: data.id };
};
