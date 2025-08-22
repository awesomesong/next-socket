import type { QueryClient } from '@tanstack/react-query';
import type { Blog as IBlog, BlogCommentsDataProps, BlogCommentPage, CommentType } from '@/src/app/types/blog';

export const BLOG_LIST_KEY = ['blogs', 'recommends'] as const;
export const blogDetailKey = (blogId: string) => ['blogDetail', String(blogId)] as const;
export const blogsCommentsKey = (blogId: string) => ['blogsComments', String(blogId)] as const;

type BlogCard = Pick<IBlog, 'id' | 'title' | 'image' | 'createdAt' | 'author' | '_count' | 'viewCount'> & Record<string, unknown>;

type BlogCardPatch = { id: string } & Partial<Pick<IBlog, 'title' | 'image' | 'createdAt' | 'author' | '_count' | 'viewCount'>> & Record<string, unknown>;

export type BlogListInfinite = { pages: BlogCard[][]; pageParams?: unknown[] };

function withBlogListCache(
  queryClient: QueryClient,
  updater: (old: BlogListInfinite | undefined) => BlogListInfinite | undefined
): void {
  queryClient.setQueriesData({ queryKey: BLOG_LIST_KEY, exact: true }, (old: BlogListInfinite | undefined) => updater(old));
}

function withBlogListCacheAllPages(
  queryClient: QueryClient,
  transform: (pages: BlogCard[][]) => BlogCard[][]
): void {
  withBlogListCache(queryClient, (old) => {
    if (!old || !Array.isArray(old.pages)) return old;
    const pages = old.pages.map((p) => (Array.isArray(p) ? p : []));
    const nextPages = transform(pages);
    return { ...old, pages: nextPages };
  });
}

export function prependBlogCard(
  queryClient: QueryClient,
  blog: BlogCard
): void {
  withBlogListCache(queryClient, (old) => {
    if (!old || !Array.isArray(old.pages)) {
      return { pages: [[blog]], pageParams: Array.isArray(old?.pageParams) ? old.pageParams : [''] } as BlogListInfinite;
    }
    const first = Array.isArray(old.pages[0]) ? old.pages[0] : [];
    return { ...old, pages: [[blog, ...first], ...old.pages.slice(1)] };
  });
}

export function upsertBlogCardById(
  queryClient: QueryClient,
  blog: BlogCardPatch
): void {
  withBlogListCacheAllPages(queryClient, (pages) => {
    const nextPages = pages.map((page) => {
      const idx = page.findIndex((b) => b?.id === blog.id);
      if (idx === -1) return page;
      const next = [...page];
      next[idx] = { ...next[idx], ...blog };
      return next;
    });
    return nextPages;
  });
}

export function removeBlogCardById(
  queryClient: QueryClient,
  blogId: string
): void {
  withBlogListCacheAllPages(queryClient, (pages) => pages.map((p) => p.filter((b) => b?.id !== blogId)));
}

export function incrementBlogCommentsCountById(
  queryClient: QueryClient,
  blogId: string,
  delta: number = 1
): void {
  withBlogListCacheAllPages(queryClient, (pages) =>
    pages.map((page) =>
      page.map((b) => {
        if (!b || b.id !== String(blogId)) return b;
        const prev = b?._count?.comments ?? 0;
        return { ...b, _count: { ...(b._count || {}), comments: Math.max(0, prev + delta) } };
      })
    )
  );
}

// ===== Snapshot / Restore utilities for optimistic delete =====
export type BlogCardBackup = { pageIndex: number; itemIndex: number; item: BlogCard } | undefined;

export function snapshotBlogCardPosition(
  queryClient: QueryClient,
  blogId: string
): BlogCardBackup {
  const snapshot = queryClient.getQueryData(BLOG_LIST_KEY) as BlogListInfinite | undefined;
  if (!snapshot?.pages || !Array.isArray(snapshot.pages)) return undefined;
  for (let pi = 0; pi < snapshot.pages.length; pi++) {
    const page = snapshot.pages[pi];
    if (!Array.isArray(page)) continue;
    const idx = page.findIndex((b) => b?.id === String(blogId));
    if (idx !== -1) return { pageIndex: pi, itemIndex: idx, item: page[idx] };
  }
  return undefined;
}

export function restoreBlogCardPosition(
  queryClient: QueryClient,
  backup: BlogCardBackup,
  fallbackSnapshot?: BlogListInfinite
): void {
  if (!backup) {
    if (fallbackSnapshot) {
      queryClient.setQueryData(BLOG_LIST_KEY, fallbackSnapshot);
    }
    return;
  }
  withBlogListCache(queryClient, (old) => {
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

export function snapshotBlogDetail(queryClient: QueryClient, blogId: string) {
  return queryClient.getQueryData(blogDetailKey(blogId));
}

export function restoreBlogDetail(
  queryClient: QueryClient,
  blogId: string,
  prevDetail: unknown
): void {
  if (!prevDetail) return;
  queryClient.setQueryData(blogDetailKey(blogId), prevDetail);
}

// ===== blogDetail helpers =====
export function upsertBlogDetailPartial(
  queryClient: QueryClient,
  blogId: string,
  partial: Record<string, unknown>
): void {
  queryClient.setQueryData(blogDetailKey(blogId), (old: any) => {
    if (!old?.blog) return old;
    return { ...old, blog: { ...old.blog, ...partial } };
  });
}

export function incrementBlogDetailCommentsCount(
  queryClient: QueryClient,
  blogId: string,
  delta: number = 1
): void {
  queryClient.setQueryData(blogDetailKey(blogId), (old: any) => {
    if (!old?.blog) return old;
    const prev = old.blog?._count?.comments ?? 0;
    return { ...old, blog: { ...old.blog, _count: { ...(old.blog._count || {}), comments: Math.max(0, prev + delta) } } };
  });
}

// ===== blogsComments helpers (first page only to reduce cost) =====
function withBlogsCommentsFirstPage(
  queryClient: QueryClient,
  blogId: string,
  transform: (comments: CommentType[], count: number) => { comments: CommentType[]; count: number }
): void {
  queryClient.setQueriesData({ queryKey: blogsCommentsKey(blogId), exact: true }, (old: BlogCommentsDataProps | undefined) => {
    if (!old || !Array.isArray(old.pages) || old.pages.length === 0) return old;
    const first = old.pages[0] as BlogCommentPage;
    const commentsObj = first.find((p) => 'comments' in p) as { comments: CommentType[] } | undefined;
    const countObj = first.find((p) => 'commentsCount' in p) as { commentsCount: number } | undefined;
    const res = transform(commentsObj?.comments ?? [], countObj?.commentsCount ?? 0);
    const nextFirst: BlogCommentPage = [
      { comments: res.comments },
      { commentsCount: res.count },
    ];
    return { ...old, pages: [nextFirst, ...old.pages.slice(1)] };
  });
}

export function prependBlogCommentFirstPage(
  queryClient: QueryClient,
  blogId: string,
  comment: any
): void {
  if (!comment) return;
  withBlogsCommentsFirstPage(queryClient, blogId, (comments, count) => ({
    comments: [comment, ...comments],
    count: count + 1,
  }));
}

export function incrementBlogCommentsCountFirstPage(
  queryClient: QueryClient,
  blogId: string,
  delta: number = 1
): void {
  withBlogsCommentsFirstPage(queryClient, blogId, (comments, count) => ({
    comments,
    count: Math.max(0, count + delta),
  }));
}

export function replaceTempCommentFirstPage(
  queryClient: QueryClient,
  blogId: string,
  serverComment: CommentType
): void {
  withBlogsCommentsFirstPage(queryClient, blogId, (comments, count) => {
    const next = comments.map((c) => (typeof c?.id === 'string' && c.id.startsWith('temp-') ? serverComment : c));
    return { comments: next, count };
  });
}