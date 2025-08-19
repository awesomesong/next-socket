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
        add: (data) => set((state) => { 
            const exists = state.conversationUsers.some((_data) => 
                _data.conversationId === data.conversationId && arraysEqualUnordered(_data.userIds, data.userIds)
            );
            
            // 대화가 이미 존재하면 **기존 상태 객체를 그대로 반환**하여 불필요한 업데이트를 방지합니다.
            if (exists) {
                return state; 
            }
            // 존재하지 않으면 새 데이터를 추가한 **새 배열을 반환**합니다.
            return { conversationUsers: [...state.conversationUsers, data] }; 
        }),
        remove: (id) => set((state)=> ({ conversationUsers: state.conversationUsers.filter((_data) => _data.conversationId !== id)})),
        set: (data) => set((state) => {
            // 대상 대화방이 존재하는지 먼저 확인
            const existingIndex = state.conversationUsers.findIndex(
                (conv) => conv.conversationId === data.conversationId
            );

            // 존재하지 않으면 새로 추가 (소켓으로 처음 동기화되는 경우를 위해)
            if (existingIndex === -1) {
                return { conversationUsers: [...state.conversationUsers, data] };
            }

            // 존재하면 변경 사항이 있는 경우에만 업데이트
            const existing = state.conversationUsers[existingIndex];
            if (arraysEqualUnordered(existing.userIds, data.userIds)) {
                // 동일하면 기존 상태 유지 (얕은 비교 최적화)
                return state;
            }

            const newConversationUsers = state.conversationUsers.slice();
            newConversationUsers[existingIndex] = { ...existing, userIds: data.userIds };
            return { conversationUsers: newConversationUsers };
        })
      }),
  );

export default useConversationUserList;