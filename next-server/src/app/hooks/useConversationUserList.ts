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
            let updated = false; // 실제로 업데이트가 발생했는지 추적하는 플래그
            const newConversationUsers = state.conversationUsers.map((conv) => {
                // 업데이트 대상 대화방을 찾으면
                if (conv.conversationId === data.conversationId) {
                    // **userIds가 실제로 변경되었는지 확인**합니다.
                    if (!arraysEqualUnordered(conv.userIds, data.userIds)) {
                        updated = true; // 변경이 발생했음을 표시
                        return { ...conv, userIds: data.userIds }; // 새로운 객체 반환
                    }
                    // userIds가 동일하면 **기존 객체를 그대로 반환**합니다.
                    return conv; 
                }
                return conv; // 대상이 아니면 기존 객체 반환
            });

            // 배열 내용이 변경되지 않았다면 **기존 상태 객체를 그대로 반환**합니다.
            if (!updated) {
                return state;
            }
            // 배열 내용이 변경되었다면 **새로 생성된 배열을 반환**합니다.
            return { conversationUsers: newConversationUsers };
        })
      }),
  );

export default useConversationUserList;