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
        add: (id) => set((state) => ({ members: state.members.some((member) => member === id) ? [...state.members] : [...state.members, id] })),
        remove: (id) => set((state)=> ({ members: state.members.filter((memberId) => memberId !== id)})),
        set: (ids) => set({members: ids})
      }),
      // {
      //   name: "user-storage",
      //   // storage: createJSONStorage(() => sessionStorage)
      // }
  );

export default useActiveList;