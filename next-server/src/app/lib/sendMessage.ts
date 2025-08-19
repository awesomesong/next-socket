import { FieldValues } from "react-hook-form";

type sendMessageProps = {
    conversationId: string;
    data?: FieldValues;
    image?: string;
    messageId: string;
}

export const sendMessage = async ({ conversationId, data, image, messageId }: sendMessageProps) => {
    const inferredType = image ? 'image' : 'text';
    const res = await fetch(`/api/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            image,
            conversationId,
            messageId,
            type: (data as any)?.type || inferredType,
        }),
    });

    if (!res.ok) {
        // 서버에서 에러 텍스트를 보낸 경우 읽어서 throw
        let errorText = '';
        try {
            errorText = await res.text();
        } catch (_) {}
        throw new Error(errorText || `메시지 전송 실패 (status: ${res.status})`);
    }

    return res.json();
}