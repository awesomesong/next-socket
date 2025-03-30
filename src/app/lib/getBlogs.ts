import { BASE_URL } from "@/config";
import toast from "react-hot-toast";

type ParamProps = {
    pageParam?: any;
}

export const getBlogs = async (
    { pageParam }: ParamProps
) => {

    const searchParams =  pageParam !== '' ? '?cursor='+pageParam : '';
    const res = await fetch(`${BASE_URL}/api/blogs${searchParams}`, {
        next: {
            tags: ['blogs', 'recommends']
        },
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const { blogPosts }  = await res.json();

    if (!res.ok) {
        toast.error('블로그에 대한 내용을 찾지 못했습니다.');
    }

    return blogPosts;
};
