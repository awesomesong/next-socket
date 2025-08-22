'use client';
import { getTotalUnreadCount } from "@/src/app/lib/getUnReadCount";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useUnreadStore from "@/src/app/hooks/useUnReadStore";
import { useEffect, useRef } from "react";
import { useSocket } from "../context/socketContext";
import useConversation from "../hooks/useConversation";
import useConversationUserList from "../hooks/useConversationUserList";
import { prependBlogCard, upsertBlogCardById, removeBlogCardById, incrementBlogCommentsCountById, upsertBlogDetailPartial, incrementBlogDetailCommentsCount, prependBlogCommentFirstPage, blogDetailKey } from "@/src/app/lib/blogsCache";
import type { BlogCommentNewPayload, BlogNewPayload, BlogUpdatedPayload, BlogDeletedPayload, BlogCardForPrependPayload } from "@/src/app/types/blog";

const SocketState = () => {
    const socket = useSocket();
    const { conversationId } = useConversation();
    const { set } = useConversationUserList();
    const { incrementUnread, setUnreadCount } = useUnreadStore();
    const queryClient = useQueryClient();

    // 공통 유틸: 대화 리스트로부터 전역 미읽음 합계 계산 후 저장
    const computeTotalUnread = (list: any) => {
        const total = list?.conversations?.reduce((sum: number, c: any) => sum + (Number(c.unReadCount) || 0), 0) ?? 0;
        return Number.isFinite(total) ? total : 0;
    };

    const updateUnreadFromCache = () => {
        const list = queryClient.getQueryData(['conversationList']) as any;
        if (!list?.conversations) return;
        setUnreadCount(computeTotalUnread(list));
    };

    const { 
        data, 
        refetch,
    } = useQuery({
        queryKey: ['unReadCount', conversationId],
        queryFn: () => getTotalUnreadCount(conversationId), // ✅ 현재 대화방을 제외한 전체 unReadCount
        staleTime: 30000,
        gcTime: 300000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: false, // 수동으로만 호출
    });

    // 초기 1회: 캐시 우선 → 없으면 서버에서 하이드레이션
    const hydratedOnceRef = useRef(false);
    useEffect(() => {
        if (hydratedOnceRef.current) return;
        hydratedOnceRef.current = true;
        const list = queryClient.getQueryData(['conversationList']) as any;
        if (list?.conversations?.length) {
            setUnreadCount(computeTotalUnread(list));
            return;
        }
        refetch();
    }, [queryClient, setUnreadCount, refetch]);

    // 쿼리 성공 시 전역 뱃지 업데이트
    useEffect(() => {
        if (typeof data?.unReadCount === 'number') {
            setUnreadCount(data.unReadCount);
        }
    }, [data?.unReadCount, setUnreadCount]);

    // 중복 이벤트 방지용: 최근 처리한 메시지 ID 캐시
    const processedMessageIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if(!socket) return;

        const handleReceiveConversation = (message: any, targetEmail: string) => {
            const messageConversationId = message?.conversationId;
            const isMyMessage = message.sender.email === targetEmail;
            // 현재 방이면 리스트/배지 갱신 불필요
            if (isMyMessage || messageConversationId === conversationId) return;

            // 동일 메시지 ID에 대한 중복 처리 방지 (서버/네트워크 중복 이벤트 대비)
            const mid = message?.id as string | undefined;
            if (mid) {
                if (processedMessageIdsRef.current.has(mid)) return;
                processedMessageIdsRef.current.add(mid);
                // 메모리 누수 방지: 일정 시간 후 자동 제거
                setTimeout(() => processedMessageIdsRef.current.delete(mid), 5 * 60 * 1000);
            }

            // SocketState.tsx - handleReceiveConversation 내부 갱신 로직 (upsert 최소 필드만)
            const next = queryClient.setQueryData(['conversationList'], (old: any) => {
                const lastAt = new Date(message.createdAt);
              
                if (!old?.conversations) {
                  return {
                    conversations: [
                      { id: messageConversationId, lastMessageAt: lastAt, unReadCount: 1, messages: [message] },
                    ],
                  };
                }
              
                const idx = old.conversations.findIndex((c: any) => c.id === messageConversationId);
              
                const conversations = 
                    idx === -1
                    ? [
                        { id: messageConversationId, lastMessageAt: lastAt, unReadCount: 1, messages: [message] },
                        ...old.conversations,
                      ]
                    : old.conversations.map((c: any) =>
                        c.id === messageConversationId
                          ? {
                              ...c,
                              lastMessageAt: lastAt,
                              unReadCount: (c.unReadCount || 0) + 1,
                              messages: [message, ...(c.messages || [])].slice(0, 15), 
                            }
                          : c
                      );
              
                conversations.sort(
                  (a: any, b: any) =>
                    new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
                );
              
                return { conversations };
            }) as any;

            // 최신 전역 뱃지 즉시 반영 (로컬 합계)
            if (next) setUnreadCount(computeTotalUnread(next));
        };

        // 다른 클라이언트의 읽음 처리 브로드캐스트에 맞춰 전역 합계 재계산
        const handleReadMessage = () => {
            updateUnreadFromCache();
        };

        const handleExit = (data: { conversationId: string; userIds: string[] }) => {
            const { conversationId, userIds } = data;
            set({ conversationId, userIds });
            
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId], exact: true });
            queryClient.invalidateQueries({ queryKey: ['conversation', conversationId], exact: true });
            queryClient.invalidateQueries({ queryKey: ['conversationList'], exact: true });

            // invalidate 직후, 캐시가 있다면 즉시 전역 unReadCount를 재계산하여 깜빡임/복원 방지
            updateUnreadFromCache();
        };

        // 블로그 댓글 신규 생성 이벤트 → 목록/상세 댓글 수 동기화
        const handleBlogCommentNew = (payload: BlogCommentNewPayload) => {
            if (!payload?.blogId) return;
            // 목록 카드 댓글 수 +1
            incrementBlogCommentsCountById(queryClient, String(payload.blogId), 1);

            // 상세 페이지 댓글 수 +1
            incrementBlogDetailCommentsCount(queryClient, String(payload.blogId), 1);

            // 댓글 목록 첫 페이지만 prepend (무한스크롤 비용 절감)
            if (payload?.comment) {
                prependBlogCommentFirstPage(queryClient, String(payload.blogId), payload.comment);
            }
        };

        // 블로그 신규 생성 → 목록 첫 페이지 prepend
        const handleBlogNew = (payload: BlogNewPayload) => {
            const blog = payload?.blog;
            if (!blog?.id) return;
            const createdAt = blog.createdAt instanceof Date ? blog.createdAt : new Date(blog.createdAt);
            prependBlogCard(queryClient, { ...blog, createdAt });
        };

        // 블로그 수정 → 목록/상세 갱신
        const handleBlogUpdated = (payload: BlogUpdatedPayload) => {
            const blog = payload?.blog;
            if (!blog?.id) return;
            // 목록 upsert (카드 필드만)
            const patch: any = { id: String(blog.id) };
            if (blog.title !== undefined) patch.title = blog.title;
            if (blog.image !== undefined) patch.image = blog.image;
            if (blog.createdAt !== undefined) patch.createdAt = blog.createdAt;
            if (blog.author !== undefined) patch.author = blog.author;
            if (blog._count !== undefined) patch._count = blog._count;
            if (blog.viewCount !== undefined) patch.viewCount = blog.viewCount;
            upsertBlogCardById(queryClient, patch);
            // 상세 upsert
            const partial: Record<string, any> = {};
            if (blog.title !== undefined) partial.title = blog.title;
            if (blog.content !== undefined) partial.content = blog.content;
            if (blog.image !== undefined) partial.image = blog.image;
            if (Object.keys(partial).length > 0) {
                upsertBlogDetailPartial(queryClient, String(blog.id), partial);
            }
        };

        const handleBlogDeleted = (payload: BlogDeletedPayload) => {
            if (!payload?.blogId) return;
            const id = String(payload.blogId);
            removeBlogCardById(queryClient, id);
            queryClient.removeQueries({ queryKey: blogDetailKey(id), exact: true });
        };
      
        socket.on("receive:conversation", handleReceiveConversation);
        socket.on("exit:user", handleExit);
        socket.on("read:message", handleReadMessage);
        socket.on("blog:comment:new", handleBlogCommentNew);
        socket.on("blog:new", handleBlogNew);
        socket.on("blog:updated", handleBlogUpdated);
        socket.on("blog:deleted", handleBlogDeleted);
        return() => {
            socket.off("receive:conversation", handleReceiveConversation);
            socket.off("exit:user", handleExit);
            socket.off("read:message", handleReadMessage);
            socket.off("blog:comment:new", handleBlogCommentNew);
            socket.off("blog:new", handleBlogNew);
            socket.off("blog:updated", handleBlogUpdated);
            socket.off("blog:deleted", handleBlogDeleted);
        }
    }, [socket, conversationId, queryClient, set]);

    return null;
}

export default SocketState;