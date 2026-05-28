'use client';

import { useState } from 'react';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import Button from '@/src/app/components/Button';

interface Props {
  imageUrl: string;
  onRetake: () => void;
  onAnalyze: () => void;
}

export default function ScanPreview({ imageUrl, onRetake, onAnalyze }: Props) {
  // 캡처된 이미지의 native aspect ratio — onLoad에서 측정.
  // CameraCapture와 동일한 패턴으로 wrapper 폭을 이미지 비율에 맞춰서
  // 카메라 영상 크기 = 미리보기 크기 일치 (정사각형 강제 letterbox 제거).
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  return (
    <div className="flex justify-center">
      {/*
        wrapper 폭 = calc(70vh × aspectRatio) — CameraCapture와 동일한 계산.
        그러면 미리보기 박스가 카메라 영상과 같은 크기로 표시되고
        아래 버튼 영역도 그 폭에 자연스럽게 맞춰짐.
      */}
      <div
        className="flex flex-col gap-5 max-w-full"
        style={{ width: `calc(70vh * ${aspectRatio})` }}
      >
        <p className="text-center text-sm md:text-[15px] font-medium text-stone-700 dark:text-stone-200">
          이 사진으로 분석할까요?
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="촬영한 향수 사진"
          onLoad={handleImgLoad}
          className="block rounded-2xl bg-[var(--color-card-bg)] w-full"
          style={{ aspectRatio }}
        />

        <p className="text-[13px] text-stone-400 dark:text-stone-500 text-center font-light tracking-wide">
          향수병이 선명하게 보일수록 더 정확하게 인식할 수 있어요.
        </p>

        <div className="flex flex-row gap-2 sm:gap-4">
          <Button
            variant="scent"
            onClick={onAnalyze}
            className="flex-1"
          >
            <HiOutlineMagnifyingGlass className="size-4" aria-hidden />
            분석하기
          </Button>
          <Button variant="ghostLavender" onClick={onRetake}>
            다시 찍기
          </Button>
        </div>
      </div>
    </div>
  );
}
