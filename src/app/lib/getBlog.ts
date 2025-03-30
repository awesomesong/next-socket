import { BASE_URL } from '@/config';
import { redirect } from 'next/navigation';
import toast from "react-hot-toast";

const getBlog = async ( id : string) => {
    const res = await fetch(`${BASE_URL}/api/blogs/${id}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        // cache: 'no-store'
    }); 

    const { blog, message } = await res.json();
    
    if(!blog) redirect('/not-found');

    if (!res.ok) {
        toast.error('블로그에 대한 내용을 찾지 못했습니다.');
    }

    return { blog, message };
};

export default getBlog;