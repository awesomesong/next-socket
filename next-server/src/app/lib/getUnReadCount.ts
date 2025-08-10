// 1. 특정 대화방의 unReadCount 가져오기
const getUnReadCount = async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}/unreadCount`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 
    
    if (!res.ok) throw new Error('Failed to fetch unread count');
    const { unReadCount } = await res.json();

    return { unReadCount };
};

// 2. 현재 대화방을 제외한 전체 unReadCount 가져오기 (SocketState용)
const getTotalUnreadCount = async (excludeConversationId?: string) => {
    const query = excludeConversationId ? `?exclude=${excludeConversationId}` : '';
    
    const res = await fetch(`/api/conversations/totalUnreadCount${query}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 
    
    if (!res.ok) throw new Error('Failed to fetch total unread count');
    const { unReadCount } = await res.json();

    return { unReadCount };
};

export default getUnReadCount;
export { getTotalUnreadCount };