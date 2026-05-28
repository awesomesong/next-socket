'use client';

import { useRef } from 'react';
import { HiOutlinePhoto } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Button from '@/src/app/components/Button';

interface Props {
  onCapture: (blob: Blob) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUploadFallback({ onCapture }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있어요.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('이미지는 10MB 이하 크기로 올려 주세요.');
      return;
    }

    onCapture(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // 모바일에서 후면 카메라 직접 호출 (getUserMedia 권한 없어도 작동)
        capture="environment"
        onChange={handleFile}
        className="hidden"
        aria-label="향수 사진 선택"
      />
      {/* ghostButtonClassName이 이미 px-10을 포함 → 자연 폭 + 가운데 정렬 */}
      <div className="flex justify-center">
        <Button
          variant="ghostLavender"
          onClick={() => inputRef.current?.click()}
        >
          <HiOutlinePhoto className="size-4" aria-hidden />
          파일 선택
        </Button>
      </div>
    </>
  );
}
