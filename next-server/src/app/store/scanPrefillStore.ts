import { create } from 'zustand';

export type ScanPrefill = {
  brand: string;
  name: string;
  description: string;
  notes: string;
  imageUrl: string;
};

type ScanPrefillStore = {
  prefill: ScanPrefill | null;
  set: (data: ScanPrefill) => void;
  clear: () => void;
};

export const useScanPrefillStore = create<ScanPrefillStore>((setState) => ({
  prefill: null,
  set: (data) => setState({ prefill: data }),
  clear: () => setState({ prefill: null }),
}));
