'use client';
import TextareaAutosize from 'react-textarea-autosize';
import { useRef, useState, FormEvent, useEffect, useCallback } from 'react';
import useComposition from '@/src/app/hooks/useComposition';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBlogsComments } from '@/src/app/lib/createBlogsComments';
import { CommentType } from '@/src/app/types/blog';
import { useSocket } from "../context/socketContext";
import toast from 'react-hot-toast';
import { prependBlogCommentFirstPage, replaceCommentById, removeCommentById, blogsCommentsKey, incrementBlogDetailCommentsCount } from '@/src/app/lib/blogsCache';
import { SOCKET_EVENTS } from '../lib/utils';

type FormCommentProps = {
    blogId: string;
    user: {
        role?: string;
        id: string;
        name?: string | null | undefined;
        email?: string | null | undefined;
        image?: string | null | undefined;
    };
    /** 초기 표시할 댓글 내용. 수정 폼에서 사용 */
    initialText?: string;
    /** 저장 버튼 텍스트 */
    submitLabel?: string;
    /** 저장 동작을 직접 처리하고 싶을 때 전달 */
    onSubmit?: (text: string) => Promise<unknown> | void;
    /** 취소 버튼 클릭 시 호출 */
    onCancel?: () => void;
    /** 컴포넌트가 나타날 때 자동으로 포커스 */
    autoFocus?: boolean;
};

const FormComment = ({ 
    blogId, 
    user, 
    initialText = '', 
    submitLabel = '확인', 
    onSubmit, 
    onCancel,
    autoFocus = false
}: FormCommentProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [comment, setComment] = useState<string>(initialText);
    const [stateComment, setStateComment] = useState(Boolean(onSubmit) ? true : false);
    const queryClient = useQueryClient();
    const socket = useSocket();
    
    // 한글 입력 조합 상태 관리
    const {
        isComposing,
        handleCompositionStart,
        handleCompositionEnd
    } = useComposition();

    // useMutation을 사용한 낙관적 업데이트
    const { mutate: createCommentMutation } = useMutation({
        mutationFn: createBlogsComments,
        onMutate: async ({ blogId: bid, comment: text }) => {
            await queryClient.cancelQueries({ queryKey: blogsCommentsKey(bid), exact: true });
            const previousComments = queryClient.getQueryData(blogsCommentsKey(bid));
            const optimisticId = `temp-${Date.now()}-${Math.random()}`;
            const optimisticComment: CommentType = {
                id: optimisticId,
                blogId: bid,
                text,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                authorEmail: user.email ?? null,
                author: { 
                    id: user.id, 
                    name: user.name ?? '', 
                    email: user.email ?? '', 
                    image: user.image ?? null 
                } as any,
            };
            
            // 즉시 UI에 추가
            prependBlogCommentFirstPage(queryClient, bid, optimisticComment);
            incrementBlogDetailCommentsCount(queryClient, bid, 1);
            
            // 스크롤
            setTimeout(() => {
                document.getElementById(`comment-${optimisticId}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }, 100);
            
            return { previousComments, optimisticId };
        },
        onSuccess: (result, { blogId: bid }, context) => {
            if (!context?.optimisticId) return;
            // 임시 댓글을 실제 댓글로 교체
            replaceCommentById(queryClient, bid, context.optimisticId, { 
                ...result.newComment, 
                author: user as any 
            });
            
            // 소켓 브로드캐스트 (다른 사용자들에게만)
            try {
                socket?.emit(SOCKET_EVENTS.BLOG_COMMENT_NEW, {
                    blogId: bid,
                    comment: {
                        ...result.newComment,
                        author: {
                            name: user.name ?? '',
                            email: user.email ?? '',
                            image: user.image ?? null,
                        },
                    },
                });
            } catch {}
        },
        onError: (error, { blogId: bid, comment }, context) => {
            // 에러 시 롤백
            if (context?.previousComments) {
                queryClient.setQueryData(blogsCommentsKey(bid), context.previousComments);
            }
            if (context?.optimisticId) {
                removeCommentById(queryClient, bid, context.optimisticId);
                incrementBlogDetailCommentsCount(queryClient, bid, -1);
            }
            
            // 입력창 복원
            setComment(comment);
            
            const message = error instanceof Error ? error.message : '댓글 등록에 실패했습니다.';
            toast.error(message);
        },
    });
    
    useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [autoFocus]);

    const onFocus = useCallback(() => {
        if(!user.email) return;
        setStateComment(true);
    }, [user?.email]);

    const submitComment = useCallback((text: string) => {
        if (text.trim() === '') {
            textareaRef.current?.focus();
            return alert('댓글을 입력해주세요.');
        }

        setComment(''); // 즉시 입력창 비우기

        if (onSubmit) {
            // 커스텀 onSubmit 함수 사용
            Promise.resolve()
                .then(() => onSubmit(text))       
                .then(() => {
                    // 댓글 수정의 경우 Comments.tsx에서 이미 처리하므로 여기서는 캐시 업데이트하지 않음
                    onCancel?.();
                })
                .catch((error) => {
                    // 실패 시 입력창 복원
                    setComment(text);
                    console.error('댓글 저장 실패:', error);
                });
        } else {
            // useMutation을 사용한 낙관적 업데이트
            createCommentMutation({ blogId, comment: text });
        }
    }, [onSubmit, onCancel, createCommentMutation, queryClient, blogId, user]);

    // 버튼 클릭 이벤트 핸들러
    const handleSubmitComment = useCallback((e: FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        submitComment(comment);
    }, [comment, submitComment]);

    // Enter 키 이벤트 핸들러
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // 한글 입력 조합 중이면 제출하지 않음
        if (isComposing()) return;
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            
            // 이벤트 객체에서 직접 값을 가져와서 정확한 텍스트 전달
            submitComment(e.currentTarget.value);
        }
    }, [submitComment, isComposing]);

    return (
        <div className='my-4'>
            <TextareaAutosize
                ref={textareaRef}
                disabled={user?.email ? false : true}
                placeholder={user?.email ? '댓글을 입력해주세요.' : '로그인 후에 댓글을 작성할 수 있습니다.'}
                value={comment}
                onChange={e => setComment(e.target.value)}
                onFocus={onFocus}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className='w-full p-2 box-border border-solid border-b-[1px]'
            />
            {stateComment && (
                <div className='flex gap-2 mt-2'>
                    <button
                        onClick={handleSubmitComment}
                        type='submit'
                        className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md'
                    >
                        {submitLabel}
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            type='button'
                            className='px-4 py-2 bg-gray-600 rounded-md text-white'
                        >
                            취소
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default FormComment;