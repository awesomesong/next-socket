'use client';
import { FormBlog } from '@/src/app/components/FormBlog';
import getBlog from '@/src/app/lib/getBlog';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

type IdProps = {
    id: string
}

type ParamsProps = {
    params: IdProps
}

const BlogEditpage = ({ params } : ParamsProps) => {
    const { id } = params;
    const router = useRouter();
    const pathname = usePathname();

    // const { blog, message } = await getBlog(id);
    const { data: session, status: sessionStatus } = useSession();
    const { 
        data, 
        status,
        isSuccess
    } = useQuery({
        queryKey: [ 'blogDetailEdit', id ],
        queryFn: () => getBlog(id),
        enabled: !!session?.user?.email,
    });

    // 세션 로딩 후, 비로그인인 경우 로그인 페이지로 이동
    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.push(`/auth/signin?callbackUrl=${pathname}`);
        }
    }, [sessionStatus]);


    return (
        <>
            { status === 'success' && 
                <FormBlog id={id} initialData={data?.blog} message={data?.message} isEdit={true}/>
            }
        </>
    )
}

export default BlogEditpage;
