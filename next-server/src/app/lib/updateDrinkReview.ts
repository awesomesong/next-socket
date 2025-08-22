interface Props {
    id: string;
    text: string;
}

export const updateDrinkReview = async ({ id, text }: Props) => {
    const res = await fetch(`/api/drinks/review/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data && (data.message || data.error)) || '리뷰 수정에 실패했습니다.');
    }
    return data;
};
