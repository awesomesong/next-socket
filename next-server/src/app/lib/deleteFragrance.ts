export type DeleteFragranceResponse = {
  success: boolean;
  message?: string;
};

export const deleteFragrance = async (id: string): Promise<DeleteFragranceResponse> => {
  const res = await fetch(`/api/fragrance/${id}`, {
    method: 'DELETE',
    headers: { "Content-Type": "application/json" },
  });

  const responseData = await res.json();

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error("해당 향수를 삭제할 권한이 없습니다.");
    }
    throw new Error(responseData.message || "향수 삭제 중 오류가 발생했습니다.");
  }

  return {
    success: true,
    message: "향수가 삭제되었습니다.",
  };
};
