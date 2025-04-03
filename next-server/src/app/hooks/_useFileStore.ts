import { create } from "zustand";

type File = {
    id: string;
    isFile: number;
}

interface FileStateStore {
    files: File[];
    addFile: (file: File) => void;
    removeFile: (id: string) => void;
    setFile: (id: File[]) => void; 
}

const useFileStore = create<FileStateStore>((set) => ({
    files: [],
    addFile: (file: File) => set((state) => ({ files: [...state.files, file]})),
    removeFile: (id) => ({}),
    setFile: (file: File[]) => ({file}),
}));

export default useFileStore;