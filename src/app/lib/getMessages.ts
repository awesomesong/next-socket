import { BASE_URL } from '@/config';

type getMessagesProps = {
    conversationId: string;
    pageParam: null | string;
}

const getMessages = async ({conversationId, pageParam} :getMessagesProps) => {
    const cursor =  pageParam !== null ? '?cursor='+pageParam : '';

    const res = await fetch(`${BASE_URL}/api/messages/${conversationId}${cursor}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 
    
    const { messages, nextCursor, message } = await res.json();

    return { messages, nextCursor, message };
};

export default getMessages;