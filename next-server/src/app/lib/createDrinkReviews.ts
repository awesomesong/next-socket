interface Props {
    slug: string;
    text: string;
}

export const createDrinkReviews = async ({ slug, text }: Props) => {
    const res = await fetch(`/api/drinks/reviews/${slug}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    return res.json();
};
