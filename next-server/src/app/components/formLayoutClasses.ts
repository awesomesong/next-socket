/** 리뷰/댓글 폼 등 텍스트 입력 폼의 공통 레이아웃 클래스 */
export const formInputLayout = {
  /** 폼 래퍼 (전체 너비, 세로 여백) */
  wrapper: "w-full my-4",
  /** 제출/취소 버튼 영역 */
  actions: "flex gap-2 mt-4",
  /** 공통 라벨 스타일 */
  label: "block text-[0.75rem] uppercase tracking-[0.2em] !text-[var(--scent-gradient-mid)] dark:!text-[var(--color-lavender-light)] font-bold mb-2",
} as const;
