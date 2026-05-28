'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlineCamera } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Button from '@/src/app/components/Button';

interface Props {
  onCapture: (blob: Blob) => void;
  /** 카메라 active 상태 변화 알림 — 상위에서 entry 영역 layout 분기에 사용 */
  onActiveChange?: (active: boolean) => void;
  /** true면 마운트 시 카메라 자동 시작 (뒤로가기 / "다른 향수 스캔하기" 흐름) */
  autoStart?: boolean;
}

export default function CameraCapture({ onCapture, onActiveChange, autoStart }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);

  // active 변화를 상위에 알림 — 디바이더·파일 업로드 숨김/표시 분기용
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);
  // 카메라 stream native aspect ratio. metadata 로드 전 4/3 기본값.
  // 이 값으로 wrapper 폭을 계산해 video와 아래 버튼 영역 너비를 일치시킴.
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  const handleVideoMetadata = () => {
    const v = videoRef.current;
    if (v?.videoWidth && v?.videoHeight) {
      setAspectRatio(v.videoWidth / v.videoHeight);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  };

  const startCamera = useCallback(async () => {
    setStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('이 브라우저는 카메라 기능을 지원하지 않아요.');
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = s;
      setActive(true);
    } catch (e) {
      console.error('[CameraCapture] getUserMedia failed:', e);
      const err = e as { name?: string; message?: string };
      const name = err.name ?? '';
      const msg = err.message ?? String(e);
      if (name === 'NotAllowedError' || msg.includes('Permission')) {
        toast.error(
          '카메라 권한이 거부됐어요. 브라우저 설정에서 권한을 허용한 뒤 다시 시도하거나, 아래 "파일 선택"을 이용해 주세요.',
          { duration: 6000 },
        );
      } else if (name === 'NotFoundError') {
        toast.error('연결된 카메라를 찾을 수 없어요.');
      } else if (name === 'NotReadableError') {
        toast.error('다른 앱에서 카메라를 사용 중이에요.');
      } else {
        toast.error(`카메라 오류가 발생했어요: ${msg}`);
      }
    } finally {
      setStarting(false);
    }
  }, []);

  // autoStart: 뒤로가기 / "다른 향수 스캔하기" 진입 시 카메라 자동 시작
  const didAutoStart = useRef(false);
  useEffect(() => {
    if (autoStart && !didAutoStart.current) {
      didAutoStart.current = true;
      void startCamera();
    }
  }, [autoStart, startCamera]);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch((err) => {
      console.error('[CameraCapture] video.play failed:', err);
      toast.error('카메라 화면을 불러오지 못했어요. 페이지를 새로고침해 주세요.');
    });
  }, [active]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      toast.error('카메라가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('사진을 저장하지 못했어요. 다시 시도해 주세요.');
          return;
        }
        stopCamera();
        onCapture(blob);
      },
      'image/png',
      0.95,
    );
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!active) {
    return (
      // 비활성 entry는 자연 폭 + 가운데 정렬 (active 시 비디오가 부모 폭을 채움).
      <div className="flex justify-center">
        <Button
          variant="scent"
          onClick={startCamera}
          disabled={starting}
          className="px-10"
        >
          <HiOutlineCamera className="size-4" aria-hidden />
          {starting ? '카메라 켜는 중...' : '카메라 켜기'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {/*
        wrapper 폭을 video 렌더 폭과 일치시켜 아래 버튼 영역과 너비를 맞춤.
          - width = calc(70vh × aspectRatio): 세로 비디오면 좁아지고, 가로 비디오면 부모 폭에서 clamp
          - max-w-full로 부모 폭 초과 방지
          - video는 w-full + style.aspectRatio → wrapper 폭을 그대로 따름
        디바이스마다 카메라 비율이 다름 (PC 16:9, 모바일 세로 9:16 등).
        예전처럼 aspect-[4/3] + object-cover로 강제하면 라벨이 잘릴 수 있어 native 비율 유지.
      */}
      <div
        className="flex flex-col gap-3 max-w-full"
        style={{ width: `calc(70vh * ${aspectRatio})` }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={handleVideoMetadata}
          className="block bg-black rounded-2xl border border-lavender-border w-full"
          style={{ aspectRatio }}
        />
        {/* FormSubmitActions 패턴 — 주요(촬영) flex-1, 보조(취소) 자연 폭 */}
        <div className="flex flex-row gap-2 sm:gap-4">
          <Button
            variant="scent"
            onClick={capture}
            className="flex-1"
          >
            <HiOutlineCamera className="size-4" aria-hidden />
            촬영
          </Button>
          <Button variant="ghostLavender" onClick={stopCamera}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
