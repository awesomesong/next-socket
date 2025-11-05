'use client';
import { use, useMemo, useRef, useEffect, useState } from 'react';
import Comments from '@/src/app/components/Comments';
import FormComment from '@/src/app/components/FormComment';
import BlogDelete from '@/src/app/components/BlogDelete';
import BlogEdit from '@/src/app/components/BlogEdit';
import getBlog from '@/src/app/lib/getBlog';
import BlogList from '@/src/app/components/BlogList';
import dayjs from '@/src/app/utils/day';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { addBlogViewCount } from '@/src/app/lib/addBlogViewCount';
import { upsertBlogCardById, blogDetailKey, BLOG_LIST_KEY } from '@/src/app/lib/react-query/blogsCache';
import type { BlogDetailQueryData } from '@/src/app/types/blog';
import { PiUserCircleFill } from 'react-icons/pi';
import { BlogSkeleton } from '@/src/app/components/skeleton/BlogSkeleton';
import FallbackNextImage from '@/src/app/components/FallbackNextImage';
import DOMPurify from 'dompurify';

const BlogDetailPage = ({ params } : {
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
        queryKey: blogDetailKey(id),
        queryFn: () => getBlog(id),
        staleTime: 3 * 60_000,        // ✅ 3분 캐시 유지 (적당한 수준)
        gcTime: 10 * 60_000,          // ✅ 10분 메모리 유지
        refetchOnMount: false,             // ✅ 마운트 시 재요청 안함
        refetchOnWindowFocus: true,        // ✅ 포커스 시 재요청 (사용자 활동 감지)
        refetchOnReconnect: true,         // ✅ 재연결 시 재요청 (네트워크 복구 시)
    });

    const { mutate: addBlogViewCountMutaion } = useMutation({
        mutationFn: addBlogViewCount,
        onMutate: async ({ id: blogId }: { id: string; viewCount?: number }) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: blogDetailKey(blogId), exact: true }),
                queryClient.cancelQueries({ queryKey: BLOG_LIST_KEY, exact: true }),
            ]);

            const prevDetail = queryClient.getQueryData(blogDetailKey(blogId));
            const prevList = queryClient.getQueryData(BLOG_LIST_KEY);
            const prevViewCount = viewCount;

            const base = (prevViewCount || data?.blog?.viewCount || 0);
            const next = base + 1;
            setViewCount(next);
            try { upsertBlogCardById(queryClient, { id: blogId, viewCount: next }); } catch {}
            try {
                queryClient.setQueryData(blogDetailKey(blogId), (old: BlogDetailQueryData) => {
                    if (!old?.blog) return old;
                    return { ...old, blog: { ...old.blog, viewCount: next } };
                });
            } catch {}

            return { prevDetail, prevList, prevViewCount } as const;
        },
        onError: (_err, _vars, ctx) => {
            if (ctx?.prevDetail) queryClient.setQueryData(blogDetailKey(id), ctx.prevDetail);
            if (ctx?.prevList) queryClient.setQueryData(BLOG_LIST_KEY, ctx.prevList);
            setViewCount(ctx?.prevViewCount || (data?.blog?.viewCount || 0));
        },
    });

    useEffect(() => {
        if (!isSuccess || !data?.blog) return;
        
        // ✅ 초기 렌더에서 서버 값 동기화 (1회만)
        if (data.blog.viewCount >= 0 && viewCount === 0) {
          setViewCount(data.blog.viewCount);
        }
        
        // ✅ 이미 증가 시도했으면 스킵
        if (viewCountIncrementedRef.current) return;
        
        // 내 글이면 증가 호출 스킵
        const isAuthorSelf = !!session?.user?.email && session.user.email === data.blog.author?.email;
        if (isAuthorSelf) return;
        
        // 하루 1회만 증가 (로컬 스토리지 기준)
        const key = `vc:${id}`;
        const today = dayjs().format('YYYY-MM-DD');
        if (typeof window !== 'undefined') {
          const last = localStorage.getItem(key);
          if (last !== today) {
            viewCountIncrementedRef.current = true;
            addBlogViewCountMutaion({ id, viewCount: data.blog.viewCount });
            try { localStorage.setItem(key, today); } catch {}
          }
        }
    }, [isSuccess, id, data?.blog, session?.user?.email, addBlogViewCountMutaion, viewCount]);

    const hasEditPermission = useMemo(() => {
        // ✅ 더 안전한 권한 체크
        if (!session?.user?.email || !data?.blog?.author?.email) {
            return false;
        }
        
        const isAuthor = session.user.email === data.blog.author.email;
        const isAdmin = session?.user?.role === 'admin';
        
        return isAuthor || isAdmin;
    }, [session?.user?.email, session?.user?.role, data?.blog?.author?.email]);

    // ✅ DOMPurify 동적 import + 클라이언트 사이드 체크
    const sanitizedContent = useMemo(() => {
        if (typeof window === 'undefined') {
            // SSR에서는 원본 콘텐츠 반환 (sanitize 없이)
            return data?.blog?.content || '';
        }
        
        // 클라이언트에서만 DOMPurify 사용
        try {
            return DOMPurify.sanitize(data?.blog?.content || '', {
                ADD_ATTR: ['target', 'rel'],
            });
        } catch (error) {
            console.warn('DOMPurify 로드 실패:', error);
            return data?.blog?.content || '';
        }
    }, [data?.blog?.content]);

    if (status === 'error') {
        return (<div className='flex justify-center align-middle mt-10'>
            <h1 className='text-2xl'>해당 글을 찾을 수 없습니다.</h1>
        </div>)
    }
    
    return (
        <div className='max-w-[1440px] h-full mx-auto px-4 py-8 md:p-8'>
            {status === 'pending'
                ? (<BlogSkeleton />)
                : status === 'success' && data?.blog 
                    ? (<>
                        <div className='flex justify-end gap-2 mb-3'>
                            <BlogList />
                            {hasEditPermission && <BlogEdit blogId={id} /> }
                            {hasEditPermission && <BlogDelete blogId={id} blogTitle={data?.blog?.title} /> }
                        </div>
                        <h1 className='mb-2'>
                            {data?.blog?.title}
                        </h1>
                        <div className="overflow-hidden">
                        <div className='flex flex-row gap-2 items-center mb-1'>
                            <p className="shrink-0 w-[30px] h-[30px]">
                                {data?.blog?.author?.image ? 
                                    (<span className="block
                                                        overflow-hidden
                                                        relative
                                                        w-full
                                                        h-full
                                                        rounded-full
                                                    ">
                                        <FallbackNextImage
                                            src={data?.blog?.author?.image}
                                            alt={data?.blog?.author?.name +' 이미지'}
                                            fill
                                            sizes='100%'
                                            unoptimized={false}
                                            className="object-cover"
                                        />
                                    </span>)
                                    : <PiUserCircleFill className="w-full h-full"/>
                                }
                            </p>
                            <span>{data?.blog?.author?.name}</span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="flex flex-row flex-wrap">
                                <span>{dayjs(data?.blog?.createdAt).fromNow()}</span>
                                <span className='mx-2'>·</span>
                                <span>조회수 {viewCount}회</span>
                                <span className='mx-2'>·</span>
                                <span>댓글 {data?.blog?._count?.comments}</span>
                            </p>
                        </div>
                        </div>
                        <article
                            dangerouslySetInnerHTML={{ __html : sanitizedContent }}
                            className='
                                mt-4  
                                text-sm
                                scrollbar-thin
                                [&_pre]:overflow-x-auto
                                [&_pre]:whitespace-pre
                                [&_code]:break-keep
                                [&_code]:text-sm
                            '
                        />
                        {session?.user && <FormComment blogId={id} user={session.user} />}
                        <Comments blogId={id} user={session?.user ?? undefined}/>
                    </>) 
                    : 
                    <div className="flex justify-center min-h-screen">블로그를 찾을 수 없습니다.</div>
                }
        </div>
    )
}

export default BlogDetailPage;