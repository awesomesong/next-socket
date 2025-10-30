import { create } from "zustand";

interface ActiveListState {
  members: string[];          // UI 전달용 (순서/직렬화-friendly)
  memberSet: Set<string>;     // 내부 연산용 (O(1))
  add: (id: string) => void;
  remove: (id: string) => void;
  set: (ids: string[]) => void;
  addMany: (ids: string[]) => void;  // 대량 추가 (배치 처리)
  removeMany: (ids: string[]) => void; // 대량 제거 (배치 처리)
  isActive: (id: string) => boolean; // 셀렉터 없이도 빠르게 확인
}

// 집합 동등성 체크 (순서 무시)
const sameSet = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  for (const x of b) if (!s.has(x)) return false;
  return true;
};

export const useActiveList = create<ActiveListState>()((set, get) => ({
  members: [],
  memberSet: new Set(),

  add: (id) =>
    set((state) => {
      if (state.memberSet.has(id)) return state;         // 변화 없음 → 리렌더 X
      const nextSet = new Set(state.memberSet);
      nextSet.add(id);
      return {
        memberSet: nextSet,
        members: [...state.members, id],                 // 끝에 추가 (정렬 유지하려면 정렬 규칙 적용)
      };
    }),

  remove: (id) =>
    set((state) => {
      if (!state.memberSet.has(id)) return state;        // 없으면 변화 없음 → 리렌더 X
      const nextSet = new Set(state.memberSet);
      nextSet.delete(id);
      // 기존 배열 재사용 + 한 번만 필터
      return {
        memberSet: nextSet,
        members: state.members.filter((x) => x !== id),
      };
    }),

  set: (ids) =>
    set((state) => {
      // 중복 제거 + 집합 동등성 체크로 불필요한 교체 방지
      const dedup = Array.from(new Set(ids));
      if (sameSet(dedup, state.members)) return state; // 순서 무시 동등성
      return {
        members: dedup,
        memberSet: new Set(dedup),
      };
    }),

  addMany: (ids) =>
    set((state) => {
      let changed = false;
      const nextSet = new Set(state.memberSet);
      for (const id of ids) {
        if (!nextSet.has(id)) { 
          nextSet.add(id); 
          changed = true; 
        }
      }
      if (!changed) return state;
      return { 
        memberSet: nextSet, 
        members: Array.from(nextSet) 
      };
    }),

  removeMany: (ids) =>
    set((state) => {
      let changed = false;
      const nextSet = new Set(state.memberSet);
      for (const id of ids) {
        if (nextSet.delete(id)) changed = true;
      }
      if (!changed) return state;
      return { 
        memberSet: nextSet, 
        members: state.members.filter(x => nextSet.has(x)) 
      };
    }),

  isActive: (id) => get().memberSet.has(id),
}));

export default useActiveList;
