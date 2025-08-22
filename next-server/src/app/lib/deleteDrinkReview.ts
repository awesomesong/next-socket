export const deleteDrinkReview = async (id: string) => {
    const res = await fetch(`/api/drinks/review/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error((data && (data.message || data.error)) || '리뷰 삭제에 실패했습니다.');
    }
    return data;
};
