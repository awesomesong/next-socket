import { create } from 'zustand';

interface UnreadStore {
    unReadCount: number;
    setUnreadCount: (count: number) => void;
    incrementUnread: () => void;
    resetUnread: () => void;
}

const useUnreadStore = create<UnreadStore>((set) => ({
    unReadCount: 0,
    setUnreadCount: (count) => set({ unReadCount: count }),
    incrementUnread: () =>
        set((state) => ({ unReadCount: state.unReadCount + 1 })),
    resetUnread: () => set({ unReadCount: 0 }),
}));

export default useUnreadStore;