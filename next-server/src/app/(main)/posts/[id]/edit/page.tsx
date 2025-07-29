"use client"
import FormPost from '@/src/app/components/FormPost';
import { use } from 'react';

type ParamsProps = {
    params: Promise<{
        id: string;
    }>
}

const PostsCreatePage = ({ params } : ParamsProps) => {
    const { id } = use(params);

    return (
        <>
           <FormPost id={id} isEdit={true} />
        </>
    )
}

export default PostsCreatePage;
