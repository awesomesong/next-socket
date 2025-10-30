import { FieldValues } from "react-hook-form";
import { toast } from "react-hot-toast";

type createChatProps = {
    data?: FieldValues;
    isGroup?: boolean;
    userId: string;
}

export const createChatConversation = async ({data, isGroup, userId}: createChatProps) => {
    try {
        const res = await fetch(`/api/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                isGroup,
                userId,
            }),
        });

        const payload = await res.json();

        if (!res.ok) {
            const msg = (payload && (payload.message || payload.error)) || `생성 실패 (HTTP ${res.status})`;
            toast.error(msg);
            return payload;
        }

        // ✅ 기존 대화방 vs 새 대화방에 따라 다른 토스트
        if (!payload.existingConversation) {
            toast.success("새 대화방이 생성되었습니다.");
        }
        
        // ✅ GroupChatModal.tsx에서 data.id를 사용할 수 있도록 id 필드 보장
        return { ...payload, id: payload.id || payload.conversationId };
    } catch (error) {
        console.error('대화방 생성 중 오류:', error);
        throw error;
    }
};  