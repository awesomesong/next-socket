
export const uploadImage = async (file: File, folderName = 'blogs') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folderName);

  const res = await fetch('/api/cloudinary', {
    method: 'POST',
    body: formData,
  });

  const { url, message } = await res.json();

  if(res.status === 200 ) return { url, message };
  else return { message };
}
