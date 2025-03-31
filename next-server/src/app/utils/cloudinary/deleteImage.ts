import sha1 from "sha1";

export const getPublicIdFromUrl = ({ url, folderName }: { url: string; folderName?: string }) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1].split('.')[0];
  const publicId = folderName ? `${folderName}/${filename}` : filename;
  return publicId;
};

export const deleteImage = async (url: string, folderName?: string) => {
  try {
    const timestamp = new Date().getTime().toString();
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
    const apiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET!;

    const public_id = getPublicIdFromUrl({ url, folderName });
    const signature = sha1(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`).toString();

    const formData = new FormData();
    formData.append('public_id', public_id);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    const { result } = await res.json();
    return result === 'ok';
  } catch (err) {
    console.error('Cloudinary 삭제 실패:', err);
    return false;
  }
};
