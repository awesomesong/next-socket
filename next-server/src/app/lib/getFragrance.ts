import { FragranceType } from "@/src/app/types/fragrance";

export const getFragrance = async (idOrSlug: string): Promise<{ fragrance: FragranceType }> => {
    const res = await fetch(`/api/fragrance/${idOrSlug}`, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.message || "향수 정보를 가져오는데 실패했습니다.");
    }

    return responseData;
};
