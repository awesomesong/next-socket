import { BASE_URL } from "@/config";

export const addBlogViewCount = async ({ id, viewCount }) => {
    const res = await fetch(`${BASE_URL}/api/blogs/${id}/viewCount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
    });

    return res.json();
}