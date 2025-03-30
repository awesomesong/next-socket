
import { BASE_URL } from "@/config";
import { FieldValues } from "react-hook-form";

type sendMessageProps = {
    conversationId: string;
    data?: FieldValues;
    image?: string;
}

export const sendMessage = async ({ conversationId, data, image }: sendMessageProps) => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            image,
            conversationId
        }),
    });

    return res.json();
}