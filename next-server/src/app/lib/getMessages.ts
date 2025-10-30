type getMessagesProps = {
    conversationId: string;
    pageParam: null | string;
}

const getMessages = async ({conversationId, pageParam} :getMessagesProps) => {
    const cursor =  pageParam !== null ? '?cursor='+pageParam : '';

    const res = await fetch(`/api/messages/${conversationId}${cursor}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 
    
    const { messages, nextCursor, message, seenUsersForLastMessage } = await res.json();

    return { messages, nextCursor, message, seenUsersForLastMessage };
};

export default getMessages;