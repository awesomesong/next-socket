export async function uploadFileToCloudinary(
  file: File
): Promise<{ url: string } | { error: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/cloudinary", { method: "POST", body: formData });
  const data = await res.json();
  if (res.ok && data.url) return { url: data.url };
  return { error: data.message || "업로드에 실패했습니다." };
}
