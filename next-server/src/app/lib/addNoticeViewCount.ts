type Props = {
  id: string;
};

export const addNoticeViewCount = async ({ id }: Props) => {
    const res = await fetch(`/api/notice/${id}/viewCount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
    });

    return res.json();
}