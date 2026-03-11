import { FieldValues } from "react-hook-form";
import { toast } from "react-hot-toast";

type createChatProps = {
    data?: FieldValues;
    isGroup?: boolean;
    userId?: string;
}

export const createChatConversation = async ({data, isGroup, userId}: createChatProps) => {
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

    // ✅ GroupChatModal.tsx에서 data.id를 사용할 수 있도록 id 필드 보장
    return { ...payload, id: payload.id || payload.conversationId };
};
