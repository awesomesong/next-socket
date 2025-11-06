'use client';
import { Fragment, useEffect, memo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getBlogs } from '@/src/app/lib/getBlogs';
import { Blog as IBlog  } from "@/src/app/types/blog";
import { useInView } from "react-intersection-observer";
import BlogCard from "./BlogCard";
import BlogCardSkeleton from "./skeleton/BlogCardSkeleton";
import CircularProgress from "./CircularProgress";
import StatusMessage from "./StatusMessage";

const Blogs = () => {

    const { 
        data,
        status,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        error, 
    } = useInfiniteQuery({
        queryKey: ['blogs', 'recommends'],
        queryFn: getBlogs,
        initialPageParam: '', 
        getNextPageParam: (lastPage) => { 
            return lastPage?.at(-1)?.id
        },
        staleTime: 2 * 60_000,        // ✅ 2분 캐시 유지 (적당한 수준)
        gcTime: 5 * 60_000,           // ✅ 5분 메모리 유지
        refetchOnMount: false,            // ✅ 마운트 시 재요청 안함
        refetchOnReconnect: true,         // ✅ 재연결 시 재요청 (네트워크 복구 시)
        refetchOnWindowFocus: true,       // ✅ 포커스 시 재요청 (사용자 활동 감지)
    });

    // ✅ 사파리 호환성을 위한 useInView 설정
    // threshold: 0 (더 민감하게 반응), rootMargin: 100px (미리 트리거)
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
        triggerOnce: false,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            // ✅ 사파리에서 즉시 실행되도록 requestAnimationFrame 사용
            requestAnimationFrame(() => {
                fetchNextPage();
            });
        }
    }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

    return status === 'error' ? (
        <p>Error: {error?.message}</p>
      ) : 
        <>
            {status === 'pending' ? (
                <BlogCardSkeleton />
            ) : status === 'success' && data?.pages[0]?.length === 0 ? (
                <StatusMessage message="작성된 글이 없습니다." />
            ) : (
                <>
                    <div className="layout-card"> 
                        {data?.pages.map((page, i) => (
                            <Fragment key={page[0]?.id || i}>
                                {page.map((blog: IBlog) => <BlogCard key={blog.id} blog={blog} />)}
                            </Fragment>
                        ))}
                    </div>
                    <div ref={ref}>
                        {isFetchingNextPage && (
                            <CircularProgress aria-label="로딩중" />
                        )}
                    </div>
                </>
            )}
        </>
    
}

export default memo(Blogs);
