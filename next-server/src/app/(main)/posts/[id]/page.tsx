"use client";
import { ADD_POSTCOMMENT, DELETE_POSTCOMMENT, UPDATE_POST } from "@/graphql/mutations";
import { GET_POST } from "@/graphql/queries";
import { IPost } from "@/typings";
import { FormPostData } from '../../../types/blog';
import { InitFormData } from '../../../types/init';
import { useMutation, useQuery } from "@apollo/client";
import dayjs from '@/src/app/lib/day';
import TextareaAutosize from 'react-textarea-autosize';
import { FormEvent, useState } from "react";
import { AiFillMinusCircle } from "react-icons/ai";
import { useRouter } from "next/navigation";
import { Button, Tooltip } from "@heroui/react";
import PostDeleteButton from "@/src/app/components/PostDeleteButton";
import CategoryBadge from "@/src/app/components/CategoryBadge";
import AvatarWithName from "@/src/app/components/AvatarWithName";
import FallbackNextImage from "@/src/app/components/FallbackNextImage";
import { useSession } from "next-auth/react";
import PostSkeleton from "@/src/app/components/skeleton/PostSkeleton";
import StatusMessage from "@/src/app/components/StatusMessage";
import DOMPurify from "dompurify";

type Props = {
    params : {
        id: string;
    }
}

const Post = ({params : {id}}: Props) => {
    const {data: session} = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState<FormPostData>(InitFormData);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [comment, setComment] = useState("");
    const [stateComment, setStateComment] = useState(false);

    const {data, loading, error} = useQuery(GET_POST, {
        variables: {id},
    });
    const post: IPost = data?.post;

    // const [updatePost] = useMutation(UPDATE_POST, {
    //     variables: {id: id, title: title, image: url},
    //     refetchQueries: [{query: GET_POST, variables: {id}}],
    // })

    const [deletePostComment] = useMutation(DELETE_POSTCOMMENT, {
        refetchQueries: [{query: GET_POST, variables: {id}}],
    })

    const [addPostComment, { loading: isSubmitting }] = useMutation(ADD_POSTCOMMENT, {
        variables: { postId: id, text: comment },
        refetchQueries: [{ query: GET_POST, variables: {id}}],
        onCompleted: () => {
            setComment("");
            setStateComment(false);
        }
    });

    // const handleUpdatePost = (e: FormEvent<HTMLFormElement>) => {
    //     e.preventDefault();
    //     if (title === "" || url === "") return alert("Please Enter fields");

    //     updatePost({
    //         variables: { id: id, title: title, image: url }
    //     });

    //     setTitle("");
    //     setUrl("");
    // }

    const handleAddComment = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(comment === "") return alert("댓글을 입력해주세요.");
        if (isSubmitting) return;

        addPostComment({ variables: {postId: id, comment: comment.trim()}});
    };

    const onFocus = () => {
        if(!session?.user?.email) return;
        setStateComment(true);
    ;}

    const deletePostCommentHandler = ({id, text }: {id: string, text: string}) => {
        const result = confirm(`${text} 댓글을 삭제하시겠습니까?`);
        if(result) deletePostComment({ variables: {id}});
        return; 
    }

    const isAuthor = session?.user?.email === post?.writer.email;
    const isDisabled = loading || !isAuthor;
    
    return (
        <article className="content-wrap flex-col">
            {loading && <PostSkeleton />}
            {!loading && post && 
                <div className="flex flex-col">
                    <div className="flex justify-end gap-2 mb-3">
                        <Button
                            isDisabled={loading}
                            type="button"
                            color='default'
                            variant='bordered'
                            radius='sm'
                            className='btn-bg min-w-[30px]'
                            onPress={() => router.push('/posts')}
                        >
                            목록
                        </Button>
                        <Button
                            isDisabled={isDisabled}
                            type="button"
                            color='default'
                            variant='bordered'
                            radius='sm'
                            className='btn-bg min-w-[30px]'
                            onPress={() => router.push(`/posts/${post?.id}/edit`)}
                        >
                            수정
                        </Button>
                        <PostDeleteButton 
                            ids={[post?.id]} 
                            postTitle={post?.title}
                            variant="text"
                            isDisabled={isDisabled}
                        />
                    </div>

                    <section className="flex flex-col lg:flex-row gap-4 sm:gap-8">
                        {post?.image && (
                            <div className="
                                flex 
                                flex-col 
                                gap-3 
                                relative
                                w-full 
                                lg:w-[330px] 
                                shrink-0
                            ">
                                <FallbackNextImage 
                                    src={post.image}
                                    alt={post.imageName!}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="w-full h-fit object-cover rounded-md shadow-md"
                                    priority={true}
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-4 w-full break-all">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <CategoryBadge text={post.category}/>
                                    <span className="flex flex-row items-center flex-wrap">
                                        <AvatarWithName 
                                            image={post.writer?.image} 
                                            name={post.writer?.name}
                                        />
                                        <span className='mx-2'>·</span>
                                        <span>
                                            {dayjs(new Date(Number(post?.createdAt))).fromNow()}
                                        </span>
                                        <span className='mx-2'>·</span>
                                        <span>댓글 {post.postComments.length || 0}</span>
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-2xl mb-1">{post?.title}</h1>
                                    <pre 
                                        className="
                                            text-neutral-500 
                                            dark:text-neutral-400 
                                            whitespace-pre-wrap
                                        "
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post?.description || '') }} 
                                    />
                                </div>
                                <form 
                                    onSubmit={handleAddComment} 
                                    className="
                                        flex 
                                        flex-col 
                                        gap-2 
                                        items-end
                                        w-full
                                    "
                                >
                                    <TextareaAutosize 
                                        disabled={session?.user?.email ? false : true}
                                        placeholder={session?.user?.email ? '댓글을 입력해주세요.' : '로그인 후에 댓글을 작성할 수 있습니다.'}
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        onFocus={onFocus}
                                        className='
                                            w-full 
                                            p-2
                                            border
                                            border-neutral-500
                                            rounded-lg
                                        '
                                    />
                                    {stateComment && <button
                                            type="submit"
                                            className="
                                                w-fit
                                                p-2 
                                                text-neutral-200
                                                bg-blue-500 
                                                hover:bg-blue-600
                                                rounded-lg 
                                            "
                                        >
                                            {isSubmitting ? '등록 중' : '댓글'}
                                        </button>
                                }
                                </form>
                            </div>
                            <div className="flex flex-col gap-4">
                                <h4>댓글 {post.postComments.length || 0}개</h4>
                                {post?.postComments.map(postComment => (
                                    <div 
                                        key={postComment.id}
                                        className="flex flex-col gap-1"
                                    >
                                        <div className="flex flex-row">
                                            <div className="flex flex-row gap-2 items-center flex-wrap">
                                                <AvatarWithName 
                                                    image={postComment.writer?.image} 
                                                    name={postComment.writer?.name}
                                                />
                                                <span>{dayjs(new Date(Number(postComment.createdAt))).fromNow()}</span>
                                            </div>
                                            {session?.user.email === postComment.writer?.email && 
                                                <span 
                                                    className="inline-flex shrink-0 p-2 cursor-pointer"
                                                    onClick={() => deletePostCommentHandler({id: postComment.id, text: postComment.text})}
                                                >
                                                    <Tooltip
                                                        showArrow={true} 
                                                        content="삭제"
                                                        size='lg'
                                                    >
                                                        <span className="inline-block">
                                                            <AiFillMinusCircle color="red" />
                                                        </span>
                                                    </Tooltip>
                                                </span>
                                            }
                                        </div>
                                        <pre 
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(postComment.text || '') }} 
                                            className="whitespace-pre-wrap"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    {/* update form */}
                    {/* <form 
                        onSubmit={handleUpdatePost} 
                        className="flex justify-center gap-2 mt-4"
                    >
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            type="text"
                            placeholder="Enter new title"
                            className="bg-transparent border text-white p-2 rounded-lg"
                        />
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            type="text"
                            placeholder="new url"
                            className="bg-transparent border text-white p-2 rounded-lg"
                        />
                        <button
                            type="submit"
                            className="bg-yellow-500 rounded-lg p-2"
                        >
                            Update
                        </button>
                    </form> */}
                </div>
            }
            {error && <StatusMessage message="예상치 못한 오류가 발생했습니다." />}
        </article>
    )
}

export default Post;
