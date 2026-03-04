import { redirect } from 'next/navigation';
import toast from "react-hot-toast";

const getNotice = async (id: string) => {
    const res = await fetch(`/api/notice/${id}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 

    const { notice } = await res.json();
    
    if(!notice) redirect('/not-found');

    if (!res.ok) {
        toast.error('공지사항에 대한 내용을 찾지 못했습니다.');
    }

    return { notice };
};

export default getNotice;