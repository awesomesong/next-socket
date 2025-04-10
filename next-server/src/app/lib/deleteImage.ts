export const deleteImage = async (url: string, folderName?: string) => {
    const res = await fetch('/api/cloudinary', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, folderName }),
    });

    const { data } = await res.json();
    
    return data.result === 'ok';
};
