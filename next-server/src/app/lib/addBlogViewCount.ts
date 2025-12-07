type Props = {
  id: string;
};

export const addBlogViewCount = async ({ id }: Props) => {
    const res = await fetch(`/api/blogs/${id}/viewCount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
    });

    return res.json();
}