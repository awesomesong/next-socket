type Props = {
    noticeId: string;
    comment: string;
}

export const createNoticesComments = async ({noticeId, comment}: Props) => {
    const res = await fetch(`/api/notice/comments/${noticeId}`, {
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