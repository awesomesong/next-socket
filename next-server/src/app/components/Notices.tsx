'use client';
import { Fragment, useEffect, memo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getNotices } from '@/src/app/lib/getNotices';
import { Notice as INotice } from "@/src/app/types/notice";
import { useInView } from "react-intersection-observer";
import NoticeCard from "./NoticeCard";
import NoticeCardSkeleton from "./skeleton/NoticeCardSkeleton";
import CircularProgress from "./CircularProgress";
import StatusMessage from "./StatusMessage";

const Notices = () => {

    const {
        data,
        status,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        error,
    } = useInfiniteQuery({
        queryKey: ['notices'],
        queryFn: getNotices,
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

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
        triggerOnce: false,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            requestAnimationFrame(() => {
                fetchNextPage();
            });
        }
    }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

    return status === 'error' ? (
        <StatusMessage error={error ?? undefined} />
      ) :
        <>
            {status === 'pending' ? (
                <NoticeCardSkeleton />
            ) : status === 'success' && data?.pages[0]?.length === 0 ? (
                <StatusMessage fallbackMessage="작성된 공지사항이 없습니다."/>
            ) : (
                <>
                    <div className="notice-grid">
                        {data?.pages.map((page, i) => (
                            <Fragment key={page[0]?.id ?? i}>
                                {page.map((notice: INotice) => (
                                    <NoticeCard key={notice.id} notice={notice} />
                                ))}
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

export default memo(Notices);