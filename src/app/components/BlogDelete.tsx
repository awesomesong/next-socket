'use client';
import { BASE_URL } from '@/config';
import { useRouter } from 'next/navigation';
import { BlogIdProps } from '@/src/app/types/blog';
import LargeButton from './LargeButton';

type BlogTitleProps = {
    blogTitle: String;
}


const BlogDelete = ({ blogId, blogTitle } : BlogIdProps & BlogTitleProps) => {
    const router = useRouter();

    const handleDeleteBlog = async (blogId :String, blogTitle: String) => {
        const result = confirm(`"${blogTitle}" 글을 삭제하겠습니까?`);
        if(!result) return; 

        const res = await fetch(`${BASE_URL}/api/blogs/${blogId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    
        if(res.status === 200) {
            router.push(`/blogs`);
            router.refresh();
        }else {
            
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