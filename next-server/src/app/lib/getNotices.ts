import toast from "react-hot-toast";

type ParamProps = {
    pageParam: string;
}

export const getNotices = async (
    { pageParam }: ParamProps
) => {

    const searchParams =  pageParam !== '' ? '?cursor='+pageParam : '';
    const res = await fetch(`/api/notice${searchParams}`, {
        next: {
            tags: ['notices']
        },
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const { noticePosts } = await res.json();

    if (!res.ok) {
        toast.error('공지사항에 대한 내용을 찾지 못했습니다.');
    }

    return noticePosts;
};
