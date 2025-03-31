'use client';
import { useRouter } from 'next/navigation';
import LargeButton from './LargeButton';

const BlogList = () => {
    const router = useRouter();
    const onClick = () => {
        router.push(`/blogs`)
    }

    return (
        <LargeButton onClick={onClick}>
            목록
        </LargeButton>
    )
}

export default BlogList
