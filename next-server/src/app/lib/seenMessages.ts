type seenMessagesProps = {
    conversationId: string;
    messageId: string;
}

export const seenMessages = async ({ conversationId, messageId }: seenMessagesProps) => {

    const res = await fetch(`/api/conversations/${conversationId}/seen/${messageId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return res.json();
}