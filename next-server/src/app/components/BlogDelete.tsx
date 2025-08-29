'use client';
import { useRouter } from 'next/navigation';
import { BlogIdProps } from '@/src/app/types/blog';
import LargeButton from './LargeButton';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/socketContext';
import { removeBlogCardById, snapshotBlogCardPosition, restoreBlogCardPosition, snapshotBlogDetail, restoreBlogDetail, BLOG_LIST_KEY, blogDetailKey, type BlogListInfinite } from '@/src/app/lib/blogsCache';
import { SOCKET_EVENTS } from "@/src/app/lib/utils";

type BlogTitleProps = {
    blogTitle: String;
}


const BlogDelete = ({ blogId, blogTitle } : BlogIdProps & BlogTitleProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const socket = useSocket();

    const handleDeleteBlog = async (blogId :String, blogTitle: String) => {
        const result = confirm(`"${blogTitle}" 글을 삭제하겠습니까?`);
        if(!result) return; 

        // 낙관적 업데이트(정밀 롤백 대비): 대상 위치/데이터 백업 후 제거
        const blogIdStr = String(blogId);
        const prevDetail = snapshotBlogDetail(queryClient, blogIdStr);
        const snapshot = queryClient.getQueryData(BLOG_LIST_KEY) as BlogListInfinite | undefined;
        const backup = snapshotBlogCardPosition(queryClient, blogIdStr);

        // 목록에서 대상 카드 제거 (유틸 사용)
        removeBlogCardById(queryClient, blogIdStr);

        const res = await fetch(`/api/blogs/${blogId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    
        if(res.status === 200) {
            // 상세 캐시 제거
            queryClient.removeQueries({ queryKey: blogDetailKey(blogIdStr), exact: true });
            // 소켓 브로드캐스트: 삭제 알림
            try { socket?.emit(SOCKET_EVENTS.BLOG_DELETED, { blogId: blogIdStr }); } catch {}
            router.push(`/blogs`);
        }else {
            // 롤백: 목록/상세 복원
            restoreBlogCardPosition(queryClient, backup, snapshot);
            restoreBlogDetail(queryClient, blogIdStr, prevDetail);
        }
    }

    return (
        <>
            <LargeButton
                onClick={() => handleDeleteBlog(blogId, blogTitle)}
            >
                삭제
            </LargeButton>
        </>
    )
}

export default BlogDelete