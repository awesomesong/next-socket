import { useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { uploadImage } from "@/src/app/lib/uploadImage";

/**
 * 채팅 이미지 업로드 공통 훅
 * - hidden file input + Cloudinary Upload API 직접 호출
 * - Cloudinary SDK(CldUploadButton) 미사용 → IME 간섭 없음
 */
export function useChatImageUpload(
  onUpload: (url: string) => void | Promise<void>,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      try {
        const result = await uploadImage(file, "chat");
        if (!result.url) {
          toast.error(result.message);
          return;
        }
        await onUpload(result.url);
      } catch {
        toast.error("이미지 업로드에 실패했습니다.");
      }
    },
    [onUpload],
  );

  return { fileInputRef, handleUploadClick, handleFileChange };
}
