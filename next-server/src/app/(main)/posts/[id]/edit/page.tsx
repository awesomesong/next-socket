"use client"
import { GET_POST } from '@/graphql/queries';
import { useQuery } from '@apollo/client';
import FormPost from '@/src/app/components/FormPost';

type ParamsProps = {
    params: {
        id: string;
    }
}

const PostsCreatePage = ({ params } : ParamsProps) => {
    const { id } = params;

    return (
        <>
           <FormPost id={id} isEdit={true} />
        </>
    )
}

export default PostsCreatePage;
