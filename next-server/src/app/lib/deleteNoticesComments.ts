type Props = {
    noticeId: string;
    commentId: string;
}

export const deleteNoticesComments = async ({ noticeId, commentId }: Props) => {
    const res = await fetch(`/api/notice/comments/${noticeId}/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return res.json();
}
