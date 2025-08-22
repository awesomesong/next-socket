'use client';
import TextareaAutosize from 'react-textarea-autosize';
import React, { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBlogsComments } from '@/src/app/lib/createBlogsComments';
import { BlogCommentsDataProps, CommentType } from '@/src/app/types/blog';
import { prependBlogCommentFirstPage, incrementBlogDetailCommentsCount, incrementBlogCommentsCountById, blogsCommentsKey, replaceTempCommentFirstPage } from '@/src/app/lib/blogsCache';
import { useSocket } from "../context/socketContext";

type FormCommentProps = {
    blogId: String;
    user: {
        role?: string;
        id: string;
        name?: string | null | undefined;
        email?: string | null | undefined;
        image?: string | null | undefined;
    }
}

const FormComment = ({ blogId, user } : FormCommentProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [comment, setComment] = useState<string>('');
    const [stateComment, setStateComment] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const socket = useSocket();

    const { 
        mutate : createBlogsCommentsMutation,
        data: BlogCommets,
    } = useMutation({
        mutationFn: createBlogsComments,
        onMutate: async ({ blogId, comment }) => {
            const blogIdStr = String(blogId);
            await queryClient.cancelQueries({ queryKey: blogsCommentsKey(blogIdStr), exact: true });
            const prev = queryClient.getQueryData(blogsCommentsKey(blogIdStr)) as BlogCommentsDataProps | undefined;
            const optimistic: CommentType = {
                id: `temp-${Date.now()}`,
                text: comment,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                authorEmail: user.email ?? null,
                blogId: blogIdStr,
                author: user as any,
            };
            // 댓글 첫 페이지에 낙관적 prepend 및 카운트 증가
            prependBlogCommentFirstPage(queryClient, blogIdStr, optimistic);
            incrementBlogDetailCommentsCount(queryClient, blogIdStr, 1);
            incrementBlogCommentsCountById(queryClient, blogIdStr, 1);
            return { prev };
        },
        onError: (_err, variables, ctx) => {
            // 롤백
            const bid = String(variables.blogId);
            if (ctx?.prev) queryClient.setQueryData(blogsCommentsKey(bid), ctx.prev);
            // 카운트 롤백은 다음 refetch/소켓으로 정합 복구되므로 생략 가능
        },
        onSuccess: (newData, variables) => {
            setComment('');
            // temp → 서버 데이터 치환
            const bid = String(variables.blogId);
            replaceTempCommentFirstPage(queryClient, bid, { ...newData.newComment, author: user });
            // 소켓 브로드캐스트(본문 포함)
            try {
                socket?.emit('blog:comment:new', 
                    { 
                        blogId: bid, 
                        senderId: user.id, 
                        comment: { ...newData.newComment, author: user } 
                    }
                );
            } catch {}
        },
    })

    const onFocus = () => {
        if(!user.email) return;
        setStateComment(true);
    ;}

    const handleCommentChange = (e: ChangeEvent<HTMLInputElement>) => {
        setComment(e.target.value);
    };

    const handleSubmitComment = (e: FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if(comment.trim() === '') {
            textareaRef.current?.focus();
            return alert('댓글을 입력해주세요.')
        }; 

        if (isSubmitting) return; // 중복 방지
        setIsSubmitting(true);

        createBlogsCommentsMutation(
            {
                blogId,
                comment
            },
            {
                onSettled: () => {
                    setIsSubmitting(false); 
                }
            }
        );
    };

    return (
        <>
            <div className='my-4'>
                {/* <input 
                    ref={inputRef}
                    value={comment}
                    onChange={handleCommentChange}
                    type='text'
                    className='w-full py-2 px-3 border border-gray-300 rounded-md 
                                focus:outline-none focus:ring focus:border-blue-300'
                    name='comment'
                    placeholder='댓글 추가'
                    autoComplete='off'
                    onFocus={onFocus}
                /> */}
                <TextareaAutosize 
                    ref={textareaRef}
                    disabled={user?.email ? false : true}
                    placeholder={user?.email ? '댓글을 입력해주세요.' : '로그인 후에 댓글을 작성할 수 있습니다.'}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    onFocus={onFocus}
                    className='
                        w-full 
                        p-2
                        box-border
                        border-solid
                        border-b-[1px]
                    '
                />
                
                {stateComment && (
                    <button 
                        onClick={handleSubmitComment}
                        type='submit'
                        className='
                            bg-blue-500 
                            hover:bg-blue-600 
                            text-white 
                            font-bold 
                            py-2 
                            px-4 
                            mt-2 
                            rounded-md 
                        '
                    >
                        {isSubmitting ? '등록 중' : '댓글'}
                    </button>
                )}
            </div>
        </>
    )
};

export default FormComment;