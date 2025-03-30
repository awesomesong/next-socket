'use client';
import { FormBlog } from '@/components/FormBlog';
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
    const { data: session } = useSession();
    const { 
        data, 
        status,
        isSuccess
    } = useQuery({
        queryKey: [ 'blogDetailEdit', id ],
        queryFn: () => getBlog(id),
        enabled: !!session?.user?.email,
    });

    // 비로그인 시, 로그인 후에 수정할 수 있도록 설정
    useEffect(() => {
        if(!data && !isSuccess) {
            router.push(`/api/auth/signin?callbackUrl=${pathname}`);
        }
    }, [isSuccess]);

    return (
        <>
            { status === 'success' && 
                <FormBlog id={id} initialData={data?.blog} message={data?.message} isEdit={true}/>
            }
        </>
    )
}

export default BlogEditpage;
