'use client';
import { FormBlog } from '@/src/app/components/FormBlog';
import getBlog from '@/src/app/lib/getBlog';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, use } from 'react';

type IdProps = {
    id: string
}

type ParamsProps = {
    params: Promise<IdProps>
}

const BlogEditpage = ({ params } : ParamsProps) => {
    const { id } = use(params);
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
    
    return (
        <>
            { status === 'success' && 
                <FormBlog id={id} initialData={data?.blog} message={data?.message} isEdit={true}/>
            }
        </>
    )
}

export default BlogEditpage;
