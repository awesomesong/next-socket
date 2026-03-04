type Props = {
    noticeId: string;
    commentId: string;
    text: string;
}

export const updateNoticesComments = async ({ noticeId, commentId, text }: Props) => {
    const res = await fetch(`/api/notice/comments/${noticeId}/${commentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    return res.json();
}
