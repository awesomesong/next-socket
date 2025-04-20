
const getConversationById = async ( conversationId: string) => {
    
    const res = await fetch(`/api/conversations/${conversationId}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 

    if (!res.ok) {
        const errorData = await res.json();
        return errorData; 
    }

    const { conversation, message } = await res.json();
    return { conversation, message };
};

export default getConversationById;