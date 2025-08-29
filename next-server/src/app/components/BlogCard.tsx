'use client';
import Link from "next/link";
import { Blog } from "@/src/app/types/blog";
import dayjs from '@/src/app/lib/day';
import { PiUserCircleFill } from "react-icons/pi";
import { formatNumber } from "@/src/app/utils/formatNumber";
import FallbackNextImage from "./FallbackNextImage";
import { memo, useMemo } from "react";

const BlogCard = ({ blog } : { blog: Blog }) => {
    const blogImage = useMemo(() => {
        try {
            return JSON.parse(blog?.image || '[]');
        } catch {
            return [];
        }
    }, [blog?.image]);

    return (<Link
                key={blog.id} 
                href={`/blogs/${blog.id}`}
                className='
                    flex
                    flex-col
                    gap-2
                    h-fit
                    p-4 
                    bg-neutral-100  
                    dark:bg-neutral-900
                    dark:border-neutral-800
                    dark:shadow-neutral-800/30
                    dark:border-[1px]
                    shadow-md
                    rounded-md 
                '
            >
                {blogImage?.length > 0 && 
                    <div className="
                        overflow-hidden 
                        relative
                        h-[190px]
                        md:h-[230px]
                        lg:h-[210px]
                        rounded-md
                    ">
                        <FallbackNextImage
                            src={blogImage[0].url} 
                            alt={blog.title+' 글의 대표 이미지'}
                            fill
                            sizes="100%"
                            unoptimized={false}
                            priority={true}
                            className="object-cover"
                        />
                    </div>
                }
                <div className="flex flex-col">
                    <h2 className='mb-1 text-xl font-bold line-clamp-2 break-words'>
                        {blog.title}
                    </h2>
                    <div className="flex flex-row gap-2 overflow-hidden">
                        <p className="shrink-0 w-[30px] h-[30px]">
                            {blog.author?.image ? 
                                (<span className="block
                                                    overflow-hidden
                                                    relative
                                                    w-full
                                                    h-full
                                                    rounded-full
                                                ">
                                    <FallbackNextImage
                                        src={blog.author?.image}
                                        alt={blog.author?.name +' 이미지'}
                                        fill
                                        sizes='100%'
                                        unoptimized={false}
                                        className="object-cover"
                                    />
                                </span>)
                                : <PiUserCircleFill className="w-full h-full"/>
                            }
                        </p>
                        <div className="overflow-hidden">
                            <p>
                                {blog.author?.name}
                            </p>
                            <p className="flex flex-row flex-wrap">
                                <span>{dayjs(blog.createdAt).fromNow()}</span>
                                <span className='mx-2'>·</span>
                                <span>조회수 {formatNumber({count: blog.viewCount, type: 'view'})}</span>
                                <span className='mx-2'>·</span>
                                <span>댓글 {formatNumber({count: blog._count.comments})}</span>
                            </p>
                        </div>
                    </div>
                </div>
        </Link>)
}

export default memo(BlogCard, (prevProps, nextProps) => {
    return prevProps.blog.id === nextProps.blog.id &&
           prevProps.blog.title === nextProps.blog.title &&
           prevProps.blog.viewCount === nextProps.blog.viewCount &&
           prevProps.blog._count.comments === nextProps.blog._count.comments &&
           prevProps.blog.image === nextProps.blog.image &&
           prevProps.blog.author?.image === nextProps.blog.author?.image;
});
