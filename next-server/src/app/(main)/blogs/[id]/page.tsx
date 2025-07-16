'use client';
import { use } from 'react';
import Comments from '@/src/app/components/Comments';
import FormComment from '@/src/app/components/FormComment';
import BlogDelete from '@/src/app/components/BlogDelete';
import BlogEdit from '@/src/app/components/BlogEdit';
import getBlog from '@/src/app/lib/getBlog';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import BlogList from '@/src/app/components/BlogList';
import dayjs from '@/src/app/lib/day';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { addBlogViewCount } from '@/src/app/lib/addBlogViewCount';
import { PiUserCircleFill } from 'react-icons/pi';
import { BlogSkeleton } from '@/src/app/components/skeleton/BlogSkeleton';
import FallbackNextImage from '@/src/app/components/FallbackNextImage';
import DOMPurify from 'dompurify';

const BlogDetailPage = ({ params } : {
    params: Promise<{ id: string }> 
}) => { 
    const { id } = use(params);
    const [ viewCount, setViewCount] = useState(0);
    const { data: session } = useSession();

    const { 
        data, 
        status,
        isSuccess,
    } = useQuery({
        queryKey: ['blogDetail', id],
        queryFn: () => getBlog(id),
    });

    const { mutate: addBlogViewCountMutaion } = useMutation({
        mutationFn: addBlogViewCount,
        onSettled: (newData) => {
            if( newData?.viewCountIncremented ) {
                setViewCount((prevViewCount => prevViewCount + 1));
            }
        },
    });

    // ✅ highlight.js 실행
    useEffect(() => {
        if (isSuccess && data?.blog?.content) {
            hljs.highlightAll();
        }
    }, [isSuccess, data?.blog?.content]);

    useEffect(() => {
        if (isSuccess && data?.blog?.viewCount >= 0 && viewCount === 0) {
          setViewCount(data.blog.viewCount);
          addBlogViewCountMutaion({ id, viewCount: data.blog.viewCount });
        }
    }, [isSuccess, data?.blog?.viewCount, viewCount]);

    const isAuthor = session?.user?.email && session?.user?.email === data?.blog?.author.email;
    const isAdmin = session?.user?.role === 'admin';

    const hasEditPermission = isAuthor || isAdmin;

    if (status === 'error') {
        return (<div className='flex justify-center align-middle mt-10'>
            <h1 className='text-2xl'>{data?.message || '해당 글을 찾을 수 없습니다.'}</h1>
        </div>)
    }
    
    return (
        <div className='max-w-[1440px] h-full mx-auto px-4 py-8 md:p-8'>
            {status === 'pending'
                ? (<BlogSkeleton />)
                : (<>
                    <div className='flex justify-end gap-2 mb-3'>
                        <BlogList />
                        {hasEditPermission && <BlogEdit blogId={id} /> }
                        {hasEditPermission && <BlogDelete blogId={id} blogTitle={data?.blog?.title} /> }
                    </div>
                    <h1 className='mb-2'>
                        {data?.blog?.title}
                    </h1>
                    <div className="overflow-hidden">
                      <div className='flex flex-row gap-2 items-center mb-1'>
                        <p className="shrink-0 w-[30px] h-[30px]">
                            {data?.blog?.author?.image ? 
                                (<span className="block
                                                    overflow-hidden
                                                    relative
                                                    w-full
                                                    h-full
                                                    rounded-full
                                                ">
                                    <FallbackNextImage
                                        src={data?.blog?.author?.image}
                                        alt={data?.blog?.author?.name +' 이미지'}
                                        fill
                                        sizes='100%'
                                        unoptimized={false}
                                        className="object-cover"
                                    />
                                </span>)
                                : <PiUserCircleFill className="w-full h-full"/>
                            }
                        </p>
                        <span>{data?.blog?.author?.name}</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="flex flex-row flex-wrap">
                            <span>{dayjs(data?.blog?.createdAt).fromNow()}</span>
                            <span className='mx-2'>·</span>
                            <span>조회수 {viewCount}회</span>
                            <span className='mx-2'>·</span>
                            <span>댓글 {data?.blog?._count?.comments}</span>
                        </p>
                      </div>
                    </div>
                    <article
                        dangerouslySetInnerHTML={{ __html : DOMPurify.sanitize(data?.blog?.content || '', {
                            ADD_ATTR: ['target', 'rel'],
                          }) 
                        }}
                        className='
                            mt-4  
                            text-sm
                            scrollbar-thin
                            [&_pre]:overflow-x-auto
                            [&_pre]:whitespace-pre
                            [&_code]:break-keep
                            [&_code]:text-sm
                        '
                    />

                    <FormComment blogId={id} user={session?.user!} />
                    <Comments blogId={id} />
                </>)}
        </div>
    )
}

export default BlogDetailPage;