import type { QueryClient } from "@tanstack/react-query";
import type {
  Notice as INotice,
  NoticeDetailQueryData,
} from "@/src/app/types/notice";
import type {
  CommentType,
  CommentPage,
  PartialCommentType,
} from "@/src/app/types/comments";

// 타입 별칭 정의
type NoticeCommentsDataProps = { pages: CommentPage[]; pageParams?: unknown[] };

export const NOTICE_LIST_KEY = ["notices"] as const;
export const noticeDetailKey = (noticeId: string) =>
  ["noticeDetail", String(noticeId)] as const;
export const noticesCommentsKey = (noticeId: string) =>
  ["noticesComments", String(noticeId)] as const;

type NoticeCard = Pick<
  INotice,
  "id" | "title" | "image" | "createdAt" | "author" | "_count" | "viewCount"
> &
  Record<string, unknown>;

type NoticeCardPatch = { id: string } & Partial<
  Pick<
    INotice,
    "title" | "image" | "createdAt" | "author" | "_count" | "viewCount"
  >
> &
  Record<string, unknown>;

export type NoticeListInfinite = { pages: NoticeCard[][]; pageParams?: unknown[] };

function withNoticeListCache(
  queryClient: QueryClient,
  updater: (old: NoticeListInfinite | undefined) => NoticeListInfinite | undefined,
): void {
  queryClient.setQueriesData(
    { queryKey: NOTICE_LIST_KEY, exact: true },
    (old: NoticeListInfinite | undefined) => updater(old),
  );
}

function withNoticeListCacheAllPages(
  queryClient: QueryClient,
  transform: (pages: NoticeCard[][]) => NoticeCard[][],
): void {
  withNoticeListCache(queryClient, (old) => {
    if (!old || !Array.isArray(old.pages)) return old;
    const pages = old.pages.map((p) => (Array.isArray(p) ? p : []));
    const nextPages = transform(pages);
    return { ...old, pages: nextPages };
  });
}

export function prependNoticeCard(
  queryClient: QueryClient,
  notice: NoticeCard,
): void {
  withNoticeListCache(queryClient, (old) => {
    if (!old || !Array.isArray(old.pages)) {
      return {
        pages: [[notice]],
        pageParams: Array.isArray(old?.pageParams) ? old.pageParams : [""],
      } as NoticeListInfinite;
    }
    const first = Array.isArray(old.pages[0]) ? old.pages[0] : [];
    return { ...old, pages: [[notice, ...first], ...old.pages.slice(1)] };
  });
}

export function upsertNoticeCardById(
  queryClient: QueryClient,
  notice: NoticeCardPatch,
): void {
  withNoticeListCacheAllPages(queryClient, (pages) => {
    const nextPages = pages.map((page) => {
      const idx = page.findIndex((b) => b?.id === notice.id);
      if (idx === -1) return page;
      const next = [...page];
      next[idx] = { ...next[idx], ...notice };
      return next;
    });
    return nextPages;
  });
}

export function removeNoticeCardById(
  queryClient: QueryClient,
  noticeId: string,
): void {
  withNoticeListCacheAllPages(queryClient, (pages) =>
    pages.map((p) => p.filter((b) => b?.id !== noticeId)),
  );
}

export function incrementNoticeCommentsCountById(
  queryClient: QueryClient,
  noticeId: string,
  delta: number = 1,
): void {
  withNoticeListCacheAllPages(queryClient, (pages) =>
    pages.map((page) =>
      page.map((b) => {
        if (!b || b.id !== String(noticeId)) return b;
        const prev = b?._count?.comments ?? 0;
        return {
          ...b,
          _count: { ...(b._count || {}), comments: Math.max(0, prev + delta) },
        };
      }),
    ),
  );
}

// ===== Snapshot / Restore utilities for optimistic delete =====
export type NoticeCardBackup =
  | { pageIndex: number; itemIndex: number; item: NoticeCard }
  | undefined;

export function snapshotNoticeCardPosition(
  queryClient: QueryClient,
  noticeId: string,
): NoticeCardBackup {
  const snapshot = queryClient.getQueryData(NOTICE_LIST_KEY) as | NoticeListInfinite | undefined;
  if (!snapshot?.pages || !Array.isArray(snapshot.pages)) return undefined;
  for (let pi = 0; pi < snapshot.pages.length; pi++) {
    const page = snapshot.pages[pi];
    if (!Array.isArray(page)) continue;
    const idx = page.findIndex((b) => b?.id === String(noticeId));
    if (idx !== -1) return { pageIndex: pi, itemIndex: idx, item: page[idx] };
  }
  return undefined;
}

export function restoreNoticeCardPosition(
  queryClient: QueryClient,
  backup: NoticeCardBackup,
  fallbackSnapshot?: NoticeListInfinite,
): void {
  if (!backup) {
    if (fallbackSnapshot) {
      queryClient.setQueryData(NOTICE_LIST_KEY, fallbackSnapshot);
    }
    return;
  }
  withNoticeListCache(queryClient, (old) => {
    if (!old?.pages) return old ?? fallbackSnapshot;
    const pages = old.pages.map((page, i) => {
      if (i !== backup!.pageIndex || !Array.isArray(page)) return page;
      const next = [...page];
      next.splice(backup!.itemIndex, 0, backup!.item);
      return next;
    });
    return { ...old, pages };
  });
}

export function snapshotNoticeDetail(queryClient: QueryClient, noticeId: string): NoticeDetailQueryData {
  return queryClient.getQueryData(noticeDetailKey(noticeId)) as NoticeDetailQueryData;
}

export function restoreNoticeDetail(
  queryClient: QueryClient,
  noticeId: string,
  prevDetail: NoticeDetailQueryData,
): void {
  if (!prevDetail) return;
  queryClient.setQueryData(noticeDetailKey(noticeId), prevDetail);
}

// ===== noticeDetail helpers =====
export function upsertNoticeDetailPartial(
  queryClient: QueryClient,
  noticeId: string,
  partial: Record<string, unknown>,
): void {
  queryClient.setQueryData(noticeDetailKey(noticeId), (old: NoticeDetailQueryData) => {
    if (!old?.notice) return old;
    return { ...old, notice: { ...old.notice, ...partial } };
  });
}

export function incrementNoticeDetailCommentsCount(
  queryClient: QueryClient,
  noticeId: string,
  delta: number = 1,
): void {
  // 블로그 상세페이지 댓글 수 업데이트
  queryClient.setQueryData(noticeDetailKey(noticeId), (old: NoticeDetailQueryData) => {
    if (!old?.notice) return old;
    const prev = old.notice?._count?.comments ?? 0;
    const newCount = Math.max(0, prev + delta);
    if (newCount === prev) return old; // 변경사항이 없으면 업데이트하지 않음
    return {
      ...old,
      notice: {
        ...old.notice,
        _count: { ...(old.notice._count || {}), comments: newCount },
      },
    };
  });

  // 블로그 리스트 페이지 댓글 수 업데이트
  incrementNoticeCommentsCountById(queryClient, noticeId, delta);
}
// --------------블로그 댓글 캐시 업데이트 함수 --------------
function withNoticesCommentsFirstPage(
  queryClient: QueryClient,
  noticeId: string,
  transform: (
    comments: CommentType[],
    count: number,
  ) => { comments: CommentType[]; count: number },
): void {
  queryClient.setQueriesData({ queryKey: noticesCommentsKey(noticeId), exact: true },
    (old: NoticeCommentsDataProps | undefined) => {
      if (!old || !Array.isArray(old.pages) || old.pages.length === 0)
        return old;
      const first = old.pages[0] as CommentPage;
      const { commentsObj, countObj } = extractPageData(first);
      const res = transform(
        commentsObj?.comments ?? [],
        countObj?.commentsCount ?? 0,
      );
      const nextFirst: CommentPage = createUpdatedPage(
        res.comments,
        res.count,
      );
      return { ...old, pages: [nextFirst, ...old.pages.slice(1)] };
    },
  );
}

export function prependNoticeCommentFirstPage(
  queryClient: QueryClient,
  noticeId: string,
  comment: CommentType,
): void {
  if (!comment) return;
  withNoticesCommentsFirstPage(queryClient, noticeId, (comments, count) => ({
    comments: [comment, ...comments],
    count: count + 1,
  }));
}

// 공통 헬퍼 함수: 댓글 캐시 업데이트
function withNoticesCommentsCache(
  queryClient: QueryClient,
  noticeId: string,
  transform: (
    old: NoticeCommentsDataProps | undefined,
  ) => NoticeCommentsDataProps | undefined,
): void {
  queryClient.setQueriesData(
    { queryKey: noticesCommentsKey(noticeId), exact: true },
    transform,
  );
}

// 공통 헬퍼 함수: 페이지 데이터 추출
function extractPageData(page: CommentPage) {
  const commentsObj = page.find((p) => "comments" in p) as
    | { comments: CommentType[] }
    | undefined;
  const countObj = page.find((p) => "commentsCount" in p) as
    | { commentsCount: number }
    | undefined;
  return { commentsObj, countObj };
}

// 공통 헬퍼 함수: 업데이트된 페이지 생성
function createUpdatedPage(
  comments: CommentType[],
  count: number,
): CommentPage {
  return [{ comments }, { commentsCount: count }] as CommentPage;
}

export function replaceCommentById(
  queryClient: QueryClient,
  noticeId: string,
  matchId: string,
  serverComment: PartialCommentType,
): void {
  withNoticesCommentsCache(queryClient, noticeId, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    const pages = old.pages.map((page: CommentPage) => {
      const { commentsObj, countObj } = extractPageData(page);
      if (!commentsObj) return page;

      const updatedComments = commentsObj.comments.map((comment) =>
        String(comment.id) === String(matchId)
          ? { ...comment, ...serverComment }
          : comment,
      );

      return createUpdatedPage(updatedComments, countObj?.commentsCount ?? 0);
    });

    return { ...old, pages };
  });
}

export function removeCommentById(
  queryClient: QueryClient,
  noticeId: string,
  matchId: string,
): void {
  withNoticesCommentsCache(queryClient, noticeId, (old) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;

    const pages = old.pages.map((page: CommentPage) => {
      const { commentsObj, countObj } = extractPageData(page);
      if (!commentsObj) return page;

      const updatedComments = commentsObj.comments.filter(
        (comment) => String(comment.id) !== String(matchId),
      );

      return createUpdatedPage(
        updatedComments,
        Math.max(0, (countObj?.commentsCount ?? 0) - 1),
      );
    });

    return { ...old, pages };
  });
}
