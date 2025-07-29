import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ActiveListProps {
    members: string[];
    add: (id: string) => void;
    remove: (id: string) => void;
    set: (id: string[]) => void; 
}

export const useActiveList = create<ActiveListProps>()(
      (set) => ({
        members: [],
        add: (id) => set((state) => {
          // 이미 존재하는지 확인하고, 없다면 새로운 배열을 반환
          if (state.members.includes(id)) { // includes()도 O(n)이지만, 불필요한 복사 방지
              return state; // 상태 변경 없음 (동일한 참조 반환)
          }
          return { members: [...state.members, id] }; // 새로운 ID 추가 시에만 복사
        }),
        remove: (id) => set((state)=> ({ members: state.members.filter((memberId) => memberId !== id)})),
        set: (ids) => set({members: ids})
      }),
      // {
      //   name: "user-storage",
      //   // storage: createJSONStorage(() => sessionStorage)
      // }
  );

export default useActiveList;