type Props = {
    blogId: string;
    comment: string;
}

export const createBlogsComments = async ({blogId, comment}: Props) => {
    const res = await fetch(`/api/blogs/comments/${blogId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: comment,
        }),
    });

    return res.json();
}