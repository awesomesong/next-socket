import toast from "react-hot-toast";

type QueryKeyProps = {
    [key: string]: string
};

type ParamProps = {
    queryKey: any[] | QueryKeyProps[];
    pageParam?: any;
};

export const getDrinkReviews = async (
    { queryKey, pageParam }: ParamProps
) => {
    const [_key, slug ] = queryKey;
    const cursor = pageParam ?? null;

    try {
        const res = await fetch(`/api/drinks/reviews/${slug}?cursor=${cursor}`, {
            next: {
                tags: [_key]
            },
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const { reviews, reviewsCount } = await res.json();

        if(!res.ok) {
            toast.error('리뷰를 찾지 못했습니다.');
        }

        return [{ reviews }, { reviewsCount }];

    } catch (error) {
        console.log('error');
    }
};
