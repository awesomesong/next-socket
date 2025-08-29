type Props = {
    blogId: string;
    commentId: string;
    text: string;
}

export const updateBlogsComments = async ({ blogId, commentId, text }: Props) => {
    const res = await fetch(`/api/blogs/comments/${blogId}/${commentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    return res.json();
}
