// 공통 상수
export const MESSAGE_ID_CLEANUP_DELAY = 2 * 60 * 1000;
export const SOCKET_EVENTS = {
  RECEIVE_CONVERSATION: "receive:conversation",
  EXIT_USER: "exit:user",
  READ_STATE: "read:state",
  CONVERSATION_NEW: "conversation:new",
  ROOM_EVENT: "room.event",
  NOTICE_COMMENT_NEW: "notice:comment:new",
  NOTICE_COMMENT_UPDATED: "notice:comment:updated",
  NOTICE_COMMENT_DELETED: "notice:comment:deleted",
  NOTICE_NEW: "notice:new",
  NOTICE_UPDATED: "notice:updated",
  NOTICE_DELETED: "notice:deleted",
  FRAGRANCE_REVIEW_NEW: "fragrance:review:new",
  FRAGRANCE_REVIEW_UPDATED: "fragrance:review:updated",
  FRAGRANCE_REVIEW_DELETED: "fragrance:review:deleted",
} as const;


/**
 * 날짜 정규화 함수
 * @param date - 정규화할 날짜 (Date 객체 또는 문자열)
 * @returns 정규화된 Date 객체
 */
export const normalizeDate = (date: Date | string): Date => {
  return date instanceof Date ? date : new Date(date);
};

/**
 * 에러 메시지 포맷팅 함수
 * @param error - 에러 객체
 * @param fallback - 기본 메시지
 * @returns 포맷된 에러 메시지
 */
export function formatErrorMessage(error: unknown, fallback: string): string {
  // AbortError 친화적 메시지
  if (error instanceof DOMException && error.name === "AbortError") {
    return "요청이 취소되었습니다";
  }
  
  if (error instanceof Error && typeof error.message === "string")
    return error.message;
  const msg = (error as { message?: string })?.message;
  return typeof msg === "string" ? msg : fallback;
}