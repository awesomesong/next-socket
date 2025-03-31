import { FieldValues } from "react-hook-form";

type createChatProps = {
    data?: FieldValues;
    isGroup?: boolean;
    userId: string;
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

    return res.json();
}