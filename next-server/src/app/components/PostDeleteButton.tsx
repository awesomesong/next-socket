import { DELETE_POST } from '@/graphql/mutations';
import { GET_POSTS } from '@/graphql/queries';
import { useMutation } from '@apollo/client';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { PiDotsThreeVerticalBold } from "react-icons/pi";
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
    postId?: string;
    postTitle?: string;
    ids?: String[];
    setCheckItems?: (items: string[]) => void;
    variant?: 'icon' | 'text';
    isDisabled?: boolean;
    selectedPosts?: { id: string; writerEmail: string }[]; 
    myEmail?: string;
};

const PostDeleteButton = ({ 
    postId, 
    postTitle, 
    ids, 
    setCheckItems, 
    variant,
    isDisabled,
    selectedPosts,
    myEmail 
}: Props) => {

    const router = useRouter();
    const [deletePost] = useMutation(DELETE_POST, {
        refetchQueries: [{ query: GET_POSTS }],
    });

    const onPressDelete = useCallback(() => {
        if (selectedPosts && myEmail) {
            const hasOtherAuthors = selectedPosts.some(post => post.writerEmail !== myEmail);
            if (hasOtherAuthors) {
                alert("선택한 글 중 내가 작성하지 않은 글이 포함되어 있어 삭제할 수 없습니다.");
                return;
            }
        }

        const result = confirm(
            ids && ids.length > 0
                ? `선택한 ${ids.length}개의 항목을 삭제하시겠습니까?`
                : `${postTitle}을(를) 삭제하시겠습니까?`
        );

        if (!result) return;

        deletePost({ variables: { id: postId ?? ids } });
        setCheckItems?.([]);
        if(variant === 'text') router.push('/posts');
    }, [deletePost, postId, postTitle, ids, setCheckItems, selectedPosts, myEmail, router]);

    return postId ? (
        // ✅ 단일 삭제 버튼 (아이콘)
        <Dropdown>
            <DropdownTrigger>
                <Button 
                    type='button'
                    variant='bordered'
                    radius='sm'
                    className='
                        min-w-6 
                        h-6 
                        p-0 
                        bg-gray-100 
                        dark:bg-neutral-800 
                        dark:border-neutral-600

                '>
                    <PiDotsThreeVerticalBold size={21} />
                </Button>
            </DropdownTrigger>
            <DropdownMenu>
                <DropdownItem 
                    key="edit"
                    onPress={() => {
                        router.push(`/posts/${postId}/edit`);
                    }}
                >
                    수정
                </DropdownItem>
                <DropdownItem 
                    key="delete" 
                    className="text-danger" 
                    color="danger"
                    onPress={(e) => {
                        onPressDelete();
                    }}
                >
                    삭제
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    ) : (
        // 삭제 버튼 (텍스트)
        <Button 
            isDisabled={isDisabled}
            type='button'
            color='default'
            variant='bordered'
            radius='sm'
            className='min-w-[30px] btn-bg'
            onPress={(e) => {
                onPressDelete();
            }}
        >
            삭제
        </Button>
    );
};

export default PostDeleteButton;
