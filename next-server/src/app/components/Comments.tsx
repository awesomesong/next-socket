'use client';
import dayjs from '@/src/app/lib/day';
import { useInfiniteQuery } from "@tanstack/react-query";
import { PiUserCircleFill } from 'react-icons/pi';
import { getBlogsComments } from '@/src/app/lib/getBlogsComments';
import { Fragment, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { BlogCommentsProps, CommentType } from '@/src/app/types/blog';
import CommentSkeleton from './skeleton/CommentSkeleton';
import CircularProgress from './CircularProgress';
import FallbackNextImage from './FallbackNextImage';
import DOMPurify from 'dompurify';

type CommentsProps = {
    blogId: string
}

const Comments = ({ blogId } : CommentsProps) => {
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
        queryKey: ['blogsComments', blogId],
        queryFn:getBlogsComments,
        initialPageParam: '', 
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            const commentsPage = lastPage.find((item) => 'comments' in item) as { comments: { id: string }[] } | undefined;
            if (!commentsPage || !commentsPage.comments.length) return undefined;
            const lastCommentId = commentsPage.comments.at(-1)?.id;
            return lastCommentId || undefined;
        },
        staleTime: 60 * 1000,
        refetchOnMount: false,
        refetchOnReconnect: true,
    });
  
    const { ref, inView } = useInView({
        /* Optional options */
        threshold: 0.2,
        delay: 100,
    });

    useEffect(() => {
        if (!inView || isFetching || !hasNextPage) return;
            
        fetchNextPage();
    }, [inView, isFetching, hasNextPage, fetchNextPage]);
    
    return (
        <>
            {data?.pages[0]?.flat().map((page, i) => (
                <Fragment key={i}>
                    {Object.keys(page)[0] === 'commentsCount' && 
                        <h4>댓글 {page.commentsCount}개</h4>
                    }
                </Fragment>
            ))}
            {status === 'pending' ? ( 
                    <div className='flex flex-col gap-3'>
                        <CommentSkeleton />
                        <CommentSkeleton />
                        <CommentSkeleton />
                        <CommentSkeleton />
                    </div>)
                : (
                    <>  
                        <ul className='mt-2'>
                            {data?.pages?.flat().map((page, i) => (
                                <li key={i}>
                                    {page?.comments && page.comments.length > 0 && Object.keys(page)[0] === 'comments' &&
                                        page.comments?.map((comment: CommentType) => (
                                            <div key={comment.id}
                                                className='flex flex-row gap-3 py-1'
                                            >
                                                <span className='
                                                    shrink-0
                                                    overflow-hidden
                                                    relative
                                                    w-10 
                                                    h-10
                                                    mt-1
                                                    rounded-full
                                                '>
                                                    {comment.author?.image 
                                                        ? (<FallbackNextImage
                                                                src={comment.author?.image} 
                                                                alt={`${comment.author?.name} 이미지`} 
                                                                fill
                                                                className="object-cover"
                                                                unoptimized={false}
                                                            />)
                                                        : (<PiUserCircleFill className="w-full h-full"/>)
                                                    }    
                                                </span>
                                                <div>
                                                <div>
                                                    <span className='break-all mr-2'>
                                                        {comment.author?.name}
                                                    </span>
                                                    <span className='text-gray-400'>
                                                        {dayjs(comment.createdAt).fromNow()}
                                                    </span>
                                                </div>
                                                <pre 
                                                    className="whitespace-pre-wrap" 
                                                    dangerouslySetInnerHTML={{ __html : DOMPurify.sanitize(comment?.text || '') }} 
                                                />
                                            </div>
                                        </div>
                                        ))
                                    }
                                </li>
                            ))}
                        </ul>
                    </>
            )}
            <div ref={ref}>
                {isFetchingNextPage && (
                    <CircularProgress aria-label="로딩중" />
                )}
            </div>
        </>
    )
}

export default Comments;