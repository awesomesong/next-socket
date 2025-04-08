'use client';
import { Fragment, useEffect } from "react";
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
        isFetching,
        isPending,
        isLoading, // isPending && isFetching
        isFetchingNextPage,
        error, 
    } = useInfiniteQuery({
        queryKey: ['blogs', 'recommends'],
        queryFn: getBlogs,
        initialPageParam: '', 
        getNextPageParam: (lastPage) => { 
            return lastPage?.at(-1)?.id
        },
    });

    const { ref, inView } = useInView({
        /* Optional options */
        threshold: 0.2,
        delay: 100,
    });

    useEffect(() => {
        if (inView && !isFetching && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, isFetching, hasNextPage, fetchNextPage]);

    return status === 'error' ? (
        <p>Error: {error?.message}</p>
      ) : 
        <>
            {status === 'pending'
                ? ( <BlogCardSkeleton /> )
                : (<div className="layout-card"> 
                        {data?.pages.map((page, i) => (
                            <Fragment key={i}>
                                {page.map((blog: IBlog) => <BlogCard key={blog.id} blog={blog} />)}
                            </Fragment>
                        ))}
                    </div>)
            }
            <div ref={ref} >
                {isFetchingNextPage && (
                    // <BlogCardSkeleton />
                    <CircularProgress aria-label="로딩중" />
                )}
            </div>
            {data?.pages[0].length === 0 && <StatusMessage message="작성된 글이 없습니다." />}
        </>
    
}

export default Blogs
