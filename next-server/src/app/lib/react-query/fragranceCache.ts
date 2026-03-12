import { QueryClient, InfiniteData } from "@tanstack/react-query";
import { FragranceWithAuthor } from "@/src/app/types/fragrance";

export const fragranceListKey = ["fragrances"];
export const fragranceBrandsKey = ["fragrance-brands"];
export const fragranceDetailKey = (idOrSlug: string) => ["fragrance", idOrSlug];

/**
 * 향수 목록 캐시에 데이터 추가 (낙관적 업데이트 또는 수동 업데이트용)
 */
export const prependFragranceCard = (queryClient: QueryClient, newFragrance: FragranceWithAuthor) => {
    queryClient.setQueryData<InfiniteData<FragranceWithAuthor[]>>(fragranceListKey, (old) => {
        if (!old?.pages?.length) {
            return { pages: [[newFragrance]], pageParams: [''] };
        }
        const [first, ...rest] = old.pages;
        return {
            ...old,
            pages: [[newFragrance, ...(first ?? [])], ...rest],
        };
    });
};

/**
 * 향수 목록 캐시의 특정 항목 업데이트
 */
export const upsertFragranceCardById = (queryClient: QueryClient, updatedFragrance: Partial<FragranceWithAuthor> & { id: string }) => {
    queryClient.setQueryData<InfiniteData<FragranceWithAuthor[]>>(fragranceListKey, (old) => {
        if (!old) return old;
        return {
            ...old,
            pages: old.pages.map((page) =>
                (page ?? []).map((f) =>
                    f.id === updatedFragrance.id ? { ...f, ...updatedFragrance } : f
                )
            ),
        };
    });
};
