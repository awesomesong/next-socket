export const readMessages = async (conversationId: string) => {

    const res = await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return res.json();
}