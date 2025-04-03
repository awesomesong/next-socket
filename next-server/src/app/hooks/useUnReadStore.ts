import { create } from 'zustand';

interface UnreadStore {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    incrementUnread: () => void;
    resetUnread: () => void;
}

const useUnreadStore = create<UnreadStore>((set) => ({
    unreadCount: 0,
    setUnreadCount: (count) => set({ unreadCount: count }),
    incrementUnread: () =>
        set((state) => ({ unreadCount: state.unreadCount + 1 })),
    resetUnread: () => set({ unreadCount: 0 }),
}));

export default useUnreadStore;