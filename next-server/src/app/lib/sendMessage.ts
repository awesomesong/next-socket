import { FieldValues } from "react-hook-form";

type sendMessageProps = {
    conversationId: string;
    data?: FieldValues;
    image?: string;
    messageId: string;
}

export const sendMessage = async ({ conversationId, data, image, messageId }: sendMessageProps) => {
    const inferredType: "text" | "image" = image ? 'image' : 'text';
    const messageType = (data as { type?: "text" | "image" | "system" })?.type || inferredType;
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
            type: messageType,
        }),
    });

    if (!res.ok) {
        throw new Error(`메시지 전송 실패 (status: ${res.status})`);
    }

    return res.json();
}