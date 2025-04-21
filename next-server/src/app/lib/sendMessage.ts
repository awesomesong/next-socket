import { FieldValues } from "react-hook-form";

type sendMessageProps = {
    conversationId: string;
    data?: FieldValues;
    image?: string;
    clientGeneratedId: string;
}

export const sendMessage = async ({ conversationId, data, image, clientGeneratedId }: sendMessageProps) => {
    const res = await fetch(`/api/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            image,
            conversationId,
            clientGeneratedId
        }),
    });

    return res.json();
}