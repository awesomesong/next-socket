
export const uploadImage = async (file: File, folderName = 'blogs') => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET!;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folderName);
  formData.append("upload_preset", preset);
  formData.append("cloud_name", cloudName);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const { url, message } = await res.json();

  if(res.status === 200 ) return { url, message };
  else return { message };
}
