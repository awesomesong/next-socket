export const addBlogViewCount = async ({ id, viewCount }) => {
    const res = await fetch(`/api/blogs/${id}/viewCount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
    });

    return res.json();
}