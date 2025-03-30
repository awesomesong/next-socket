import { BASE_URL } from '@/config';

const getConversationById = async ( conversationId: string) => {
    
    const res = await fetch(`${BASE_URL}/api/conversations/${conversationId}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 

    const { conversation, message } = await res.json();

    return { conversation, message };
};

export default getConversationById;