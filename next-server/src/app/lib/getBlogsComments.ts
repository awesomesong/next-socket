import toast from "react-hot-toast";

type QueryKeyProps = {
    [key: string]: string
}

type ParamProps = {
    queryKey: any[] | QueryKeyProps[];
    pageParam?: any;
}

export const getBlogsComments = async (
    { queryKey, pageParam}: ParamProps
) => {
    const [_key, blogId ] = queryKey;
    const cursor = pageParam ?? null;

    try {   
        const res = await fetch(`/api/blogs/comments/${blogId}?cursor=${cursor}`,{
            next: {
                tags: [_key]
            },
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const { comments, commentsCount, message, status } = await res.json();

        if(!res.ok) {
            toast.error('해당 글의 댓글을 찾지 못했습니다.');
        }

        return [{comments}, {commentsCount}];

    } catch (error) {
        console.log('error');
    }
};
