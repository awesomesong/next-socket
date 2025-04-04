'use client';
import TextareaAutosize from 'react-textarea-autosize';
import React, { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBlogsComments } from '@/src/app/lib/createBlogsComments';
import { Author, BlogCommentPage, BlogCommentsDataProps, BlogOldComments, BlogOldCommentsCount, CommentType } from '@/src/app/types/blog';
import { text } from 'stream/consumers';

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

    const { 
        mutate : createBlogsCommentsMutation,
        data: BlogCommets,
    } = useMutation({
        mutationFn: createBlogsComments,
        onSuccess: (newData) => {
            setComment('');
            queryClient.setQueriesData({ queryKey: ['blogsComments', blogId]},
                (oldData: BlogCommentsDataProps | undefined): BlogCommentsDataProps => {
                    const newCommentData = newData.newComment;
                    newCommentData.author = user;

                    // 만약 oldData가 없으면 초기 구조 반환
                    if (!oldData || oldData.pages.length === 0) {
                        return {
                          pages: [[
                            { comments: [newCommentData] },
                            { commentsCount: 1 }
                          ]],
                          pageParams: [undefined],
                        };
                      }

                    const currentPage = oldData.pages[0];
                    const commentsObj = currentPage.find((p) => 'comments' in p) as { comments: CommentType[] };
                    const countObj = currentPage.find((p) => 'commentsCount' in p) as { commentsCount: number };
                
                    const updatedPage: [ { comments: CommentType[] }, { commentsCount: number } ] = [
                        { comments: [newCommentData, ...commentsObj.comments] },
                        { commentsCount: countObj.commentsCount + 1 }
                    ];
                  
                    return {
                        ...oldData,
                        pages: [updatedPage, ...oldData.pages.slice(1)],
                    };
                }
            )
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