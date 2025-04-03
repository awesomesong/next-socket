import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { arraysEqualUnordered } from '../utils/arraysEqualUnordered';

interface ConversationProps {
    conversationId: string;
    userIds: string[];
}

interface ConversationUserListProps {
    conversationUsers: ConversationProps[];
    add: (data: ConversationProps) => void;
    remove: (id: string) => void;
    set: (data: ConversationProps) => void; 
}

export const useConversationUserList = create<ConversationUserListProps>()(
      (set) => ({
        conversationUsers: [],
        add: (data) => set((state) => ({ 
            conversationUsers: 
                state.conversationUsers.some((_data) => 
                    _data.conversationId === data.conversationId && arraysEqualUnordered(_data.userIds, data.userIds)
                )
                ? [...state.conversationUsers] 
                : [...state.conversationUsers, data] 
        })),
        remove: (id) => set((state)=> ({ conversationUsers: state.conversationUsers.filter((_data) => _data.conversationId !== id)})),
        set: (data) => set((state) => ({
            conversationUsers: state.conversationUsers.map((conv) =>
                conv.conversationId === data.conversationId
                    ? { ...conv, userIds: data.userIds }
                    : conv
            ),
        }))
      }),
  );

export default useConversationUserList;