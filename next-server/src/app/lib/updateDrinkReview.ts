interface Props {
    id: string;
    text: string;
}

export const updateDrinkReview = async ({ id, text }: Props) => {
    const res = await fetch(`/api/drinks/reviews/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    return res.json();
};
