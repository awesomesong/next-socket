const getUnReadCount = async ( excludeConversationId?: string ) => {
    const query = excludeConversationId ? `?exclude=${excludeConversationId}` : '';
    const res = await fetch(`/api/messages/unReadCount${query}`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }); 
        
        if (!res.ok) throw new Error('Failed to fetch unread count');
        const { unReadCount, message } = await res.json();
    
        return { unReadCount, message };
};

export default getUnReadCount;