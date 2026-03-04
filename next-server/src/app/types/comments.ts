import type { Author } from "@/src/app/types/notice";

/**
 * 댓글 타입
 */
export type CommentType = {
  id: string;
  text: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  authorEmail: string | null;
  noticeId: string | null;
  author: Author;
};

/**
 * 댓글 페이지 구조
 * [comments, commentsCount] 형태
 */
export type CommentPage = [
  { comments: CommentType[] },
  { commentsCount: number },
];

/**
 * Partial 댓글 타입 (낙관적 업데이트용)
 */
export type PartialCommentType = Partial<CommentType>;

/**
 * 댓글 API 응답 타입
 */
export type UpdateCommentResponse = {
  updatedComment: CommentType;
};

/**
 * 댓글 삭제 응답 타입
 */
export type DeleteCommentResponse = {
  message: string;
};

/**
 * 댓글 수정 API 요청 타입
 */
export type UpdateCommentRequest = {
  noticeId: string;
  commentId: string;
  text: string;
};

/**
 * 댓글 삭제 API 요청 타입
 */
export type DeleteCommentRequest = {
  noticeId: string;
  commentId: string;
};

/**
 * React Query에 사용되는 페이지 데이터 타입
 */
export type CommentPageItem =
  | { comments: CommentType[] }
  | { commentsCount: number };

/**
 * 인라인으로 추출되는 댓글/카운트 객체 타입
 */
export type ExtractedCommentData = {
  commentsObj?: { comments: CommentType[] };
  countObj?: { commentsCount: number };
};

/**
 * 소켓 이벤트 페이로드 타입
 */
export type NoticeCommentUpdatedPayload = {
  noticeId: string;
  comment: CommentType;
};

export type NoticeCommentDeletedPayload = {
  noticeId: string;
  commentId: string;
};
