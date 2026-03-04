import { CreateFragranceRequest, CreateFragranceResponse } from "@/src/app/types/fragrance";

export const createFragrance = async (data: CreateFragranceRequest): Promise<CreateFragranceResponse> => {
    const res = await fetch('/api/fragrance', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
        throw new Error(responseData.message || "향수 등록 중 오류가 발생했습니다.");
    }

    return {
        success: true,
        newFragrance: responseData.newFragrance,
        message: "향수가 등록되었습니다.",
    };
};
