import { UpdateFragranceRequest, UpdateFragranceResponse } from "@/src/app/types/fragrance";

export const updateFragrance = async (id: string, data: UpdateFragranceRequest): Promise<UpdateFragranceResponse> => {
    const res = await fetch(`/api/fragrance/${id}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.message || "향수 수정 중 오류가 발생했습니다.");
    }

    return {
        success: true,
        updatedFragrance: responseData.updatedFragrance,
        message: "향수 정보가 수정되었습니다.",
    };
};
