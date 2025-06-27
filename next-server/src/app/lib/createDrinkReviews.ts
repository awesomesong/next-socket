interface Props {
    id: string;
    text: string;
}

export const createDrinkReviews = async ({ id, text }: Props) => {
    const res = await fetch(`/api/drinks/reviews/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    return res.json();
};
