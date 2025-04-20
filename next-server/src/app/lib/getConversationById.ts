
const getConversationById = async ( conversationId: string) => {
    
    const res = await fetch(`/api/conversations/${conversationId}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Unknown error');
    }

    const { conversation, message } = await res.json();
    return { conversation, message };
};

export default getConversationById;