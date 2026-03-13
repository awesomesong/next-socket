'use client';
import { use, useMemo, useRef, useEffect, useState } from 'react';
import Comments from '@/src/app/components/Comments';
import FormComment from '@/src/app/components/FormComment';
import NoticeDelete from '@/src/app/components/NoticeDelete';
import NoticeEdit from '@/src/app/components/NoticeEdit';
import getNotice from '@/src/app/lib/getNotice';
import NoticeList from '@/src/app/components/NoticeList';
import dayjs from '@/src/app/utils/day';
import { formatNumber } from '@/src/app/utils/formatNumber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { addNoticeViewCount } from '@/src/app/lib/addNoticeViewCount';
import { upsertNoticeCardById, noticeDetailKey, NOTICE_LIST_KEY } from '@/src/app/lib/react-query/noticeCache';
import type { NoticeDetailQueryData } from '@/src/app/types/notice';
import { NoticeDetailSkeleton } from '@/src/app/components/skeleton/NoticeDetailSkeleton';
import FallbackNextImage from '@/src/app/components/FallbackNextImage';
import ScentUserAvatar from '@/src/app/components/ScentUserAvatar';
import DOMPurify from 'dompurify';
import StatusMessage from '@/src/app/components/StatusMessage';

const NoticeDetailPage = ({ params } : {
    params: Promise<{ id: string }> 
}) => { 
    const { id } = use(params);
    const [ viewCount, setViewCount] = useState(0);
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const viewCountIncrementedRef = useRef(false);

    const { 
        data, 
        status,
        isSuccess,
    } = useQuery({
        queryKey: noticeDetailKey(id),
        queryFn: () => getNotice(id),
        staleTime: 3 * 60_000,        // ✅ 3분 캐시 유지 (적당한 수준)
        gcTime: 10 * 60_000,          // ✅ 10분 메모리 유지
        refetchOnMount: false,             // ✅ 마운트 시 재요청 안함
        refetchOnWindowFocus: true,        // ✅ 포커스 시 재요청 (사용자 활동 감지)
        refetchOnReconnect: true,         // ✅ 재연결 시 재요청 (네트워크 복구 시)
    });

    const { mutate: addNoticeViewCountMutaion } = useMutation({
        mutationFn: addNoticeViewCount,
        onMutate: async ({ id: noticeId }: { id: string }) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: noticeDetailKey(noticeId), exact: true }),
                queryClient.cancelQueries({ queryKey: NOTICE_LIST_KEY, exact: true }),
            ]);

            const prevDetail = queryClient.getQueryData(noticeDetailKey(noticeId));
            const prevList = queryClient.getQueryData(NOTICE_LIST_KEY);
            const prevViewCount = viewCount;

            const base = (prevViewCount || data?.notice?.viewCount || 0);
            const next = base + 1;
            setViewCount(next);
            try { upsertNoticeCardById(queryClient, { id: noticeId, viewCount: next }); } catch {}
            try {
                queryClient.setQueryData(noticeDetailKey(noticeId), (old: NoticeDetailQueryData) => {
                    if (!old?.notice) return old;
                    return { ...old, notice: { ...old.notice, viewCount: next } };
                });
            } catch {}

            return { prevDetail, prevList, prevViewCount } as const;
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prevDetail) queryClient.setQueryData(noticeDetailKey(id), ctx.prevDetail);
            if (ctx?.prevList) queryClient.setQueryData(NOTICE_LIST_KEY, ctx.prevList);
            setViewCount(ctx?.prevViewCount || (data?.notice?.viewCount || 0));
        },
    });

    useEffect(() => {
        if (!isSuccess || !data?.notice) return;
        
        // ✅ 초기 렌더에서 서버 값 동기화 (1회만)
        if (data.notice.viewCount >= 0 && viewCount === 0) {
          setViewCount(data.notice.viewCount);
        }
        
        // ✅ 이미 증가 시도했으면 스킵
        if (viewCountIncrementedRef.current) return;
        
        // 내 글이면 증가 호출 스킵
        const isAuthorSelf = !!session?.user?.email && session.user.email === data.notice.author?.email;
        if (isAuthorSelf) return;
        
        // 하루 1회만 증가 (로컬 스토리지 기준)
        const key = `vc:${id}`;
        const today = dayjs().format('YYYY-MM-DD');
        if (typeof window !== 'undefined') {
          const last = localStorage.getItem(key);
          if (last !== today) {
            viewCountIncrementedRef.current = true;
            addNoticeViewCountMutaion({ id });
            try { localStorage.setItem(key, today); } catch {}
          }
        }
    }, [isSuccess, id, data?.notice, session?.user?.email, addNoticeViewCountMutaion, viewCount]);

    const hasEditPermission = useMemo(() => {
        // ✅ 더 안전한 권한 체크
        if (!session?.user?.email || !data?.notice?.author?.email) {
            return false;
        }
        
        const isAuthor = session.user.email === data.notice.author.email;
        const isAdmin = session?.user?.role === 'admin';
        
        return isAuthor || isAdmin;
    }, [session?.user?.email, session?.user?.role, data?.notice?.author?.email]);

    // ✅ DOMPurify 동적 import + 클라이언트 사이드 체크
    const sanitizedContent = useMemo(() => {
        if (typeof window === 'undefined') {
            // SSR에서는 원본 콘텐츠 반환 (sanitize 없이)
            return data?.notice?.content || '';
        }
        
        // 클라이언트에서만 DOMPurify 사용
        try {
            let sanitized = DOMPurify.sanitize(data?.notice?.content || '', {
                ADD_ATTR: ['target', 'rel'],
            });
            
            // 외부 링크를 새 탭에서 열리도록 처리
            sanitized = sanitized.replace(
                /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
                (match, attributes, href) => {
                    // 절대 URL인 경우 새 탭에서 열기
                    if (href.startsWith('http://') || href.startsWith('https://')) {
                        // 이미 target이 있으면 유지, 없으면 추가
                        if (!attributes.includes('target=')) {
                            return `<a ${attributes} target="_blank" rel="noopener noreferrer">`;
                        }
                    }
                    return match;
                }
            );
            
            return sanitized;
        } catch (error) {
            console.warn('DOMPurify 로드 실패:', error);
            return data?.notice?.content || '';
        }
    }, [data?.notice?.content]);

    if (status === 'error') {
        return <StatusMessage fallbackMessage="공지사항을 불러오는 중 오류가 발생했습니다." className="mt-10" />;
    }
    
    return (
        <div className='max-w-[1440px] h-full mx-auto px-4 py-8 md:p-8'>
            {status === 'pending'
                ? (
                    <>
                        <NoticeDetailSkeleton />
                        <div className="mt-4">
                            <Comments noticeId={id} user={session?.user ?? undefined} />
                        </div>
                    </>
                )
                : status === 'success' && data?.notice 
                    ? (<>
                        <div className="detail-action-bar">
                            <NoticeList />
                            {hasEditPermission && <NoticeEdit noticeId={id} /> }
                            {hasEditPermission && <NoticeDelete noticeId={id} noticeTitle={data?.notice?.title} /> }
                        </div>
                        <h1 className="notice-detail__title">
                            <span className="text-gradient-scent">{data?.notice?.title}</span>
                        </h1>
                        <div className="notice-card__meta">
                          <span className="notice-meta__avatar">
                            {data?.notice?.author?.image ? (
                              <FallbackNextImage
                                src={data.notice.author.image}
                                alt={(data.notice.author.name ?? "작성자") + " 이미지"}
                                fill
                                sizes="28px"
                                unoptimized={false}
                                className="object-cover"
                              />
                            ) : (
                              <ScentUserAvatar className="drop-shadow-lg" />
                            )}
                          </span>
                          <span>{data?.notice?.author?.name ?? "알 수 없음"}</span>
                          <span aria-hidden>·</span>
                          <span>{dayjs(data?.notice?.createdAt).fromNow()}</span>
                          <span aria-hidden>·</span>
                          <span>조회 {formatNumber({ count: viewCount, type: "view" })}</span>
                          <span aria-hidden>·</span>
                          <span>댓글 {formatNumber({ count: data?.notice?._count?.comments ?? 0 })}</span>
                        </div>
                        <article
                            dangerouslySetInnerHTML={{ __html : sanitizedContent }}
                            className='
                                mt-4 min-w-0 break-words
                                text-sm
                                scrollbar-thin
                                [&_pre]:overflow-x-auto
                                [&_pre]:whitespace-pre
                                [&_code]:break-keep
                                [&_code]:text-sm
                            '
                        />
                        {session?.user && <FormComment noticeId={id} user={session.user} />}
                        <Comments noticeId={id} user={session?.user ?? undefined}/>
                    </>) 
                    : 
                    <StatusMessage fallbackMessage="공지사항을 찾을 수 없습니다." minHeight="min-h-screen" />
                }
        </div>
    )
}

export default NoticeDetailPage;