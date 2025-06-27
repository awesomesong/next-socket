export const deleteDrinkReview = async (id: string) => {
    const res = await fetch(`/api/drinks/review/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return res.json();
};
