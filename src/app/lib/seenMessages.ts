import { BASE_URL } from "@/config";

type seenMessagesProps = {
    conversationId: string;
    messageId: string;
}

export const seenMessages = async ({ conversationId, messageId }: seenMessagesProps) => {

    const res = await fetch(`${BASE_URL}/api/conversations/${conversationId}/seen/${messageId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messageId
        })
    });

    return res.json();
}