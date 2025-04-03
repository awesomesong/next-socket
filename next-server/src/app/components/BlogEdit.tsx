'use client';
import { useRouter } from 'next/navigation';
import { BlogIdProps } from '@/src/app/types/blog';
import LargeButton from './LargeButton';

const BlogEdit = ({ blogId } : BlogIdProps ) => {
    const router = useRouter();
    const onClick = () => {
        router.push(`/blogs/${blogId}/edit`)
    }

    return (
        <LargeButton onClick={onClick}>
            수정
        </LargeButton>
    )
}

export default BlogEdit