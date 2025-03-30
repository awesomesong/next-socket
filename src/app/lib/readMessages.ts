import { BASE_URL } from "@/config";

export const readMessages = async (conversationId: string) => {

    const res = await fetch(`${BASE_URL}/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversationId
        })
    });

    return res.json();
}