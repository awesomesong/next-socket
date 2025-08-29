type Props = {
    blogId: string;
    commentId: string;
}

export const deleteBlogsComments = async ({ blogId, commentId }: Props) => {
    const res = await fetch(`/api/blogs/comments/${blogId}/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return res.json();
}
