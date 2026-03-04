interface Props {
  id: string;
  text: string;
}

export const createFragranceReviews = async ({ id, text }: Props) => {
  const res = await fetch(`/api/fragrance/review/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data && (data.message || data.error)) || "리뷰 등록에 실패했습니다."
    );
  }
  return data;
};
