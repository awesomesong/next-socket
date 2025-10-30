export const uploadImage = async (file: File, folderName = "blogs") => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET!;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folderName);
  formData.append("upload_preset", preset);
  formData.append("cloud_name", cloudName);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await res.json();

  if (res.status === 200 && data.secure_url) {
    return {
      url: data.secure_url,
      message: "이미지 업로드에 성공했습니다.",
    };
  }

  return {
    message: data?.error?.message || "이미지 업로드에 실패했습니다.",
  };
};
