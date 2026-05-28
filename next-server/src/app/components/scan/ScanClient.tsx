'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PointsLoading from '@/src/app/components/PointsLoading';
import CameraCapture from './CameraCapture';
import FileUploadFallback from './FileUploadFallback';
import ScanPreview from './ScanPreview';

type Stage = 'idle' | 'previewing' | 'analyzing';

export default function ScanClient() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('idle');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  // CameraCapture의 active 상태 — idle 영역 폭/디바이더 표시 분기
  const [cameraActive, setCameraActive] = useState(false);
  // ?camera=true 파라미터 감지 — 뒤로가기 / "다른 향수 스캔하기" 진입 시 카메라 자동 시작
  const [autoStartCamera, setAutoStartCamera] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('camera') === 'true') setAutoStartCamera(true);
  }, []);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  const handleCapture = (blob: Blob) => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(blob);
    setCapturedUrl(URL.createObjectURL(blob));
    setStage('previewing');
  };

  const resetAll = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setStage('idle');
  };

  const handleAnalyze = async () => {
    if (!capturedBlob) return;
    setStage('analyzing');
    try {
      const formData = new FormData();
      formData.append('file', capturedBlob, 'scan.png');
      const res = await fetch('/api/scan/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message ?? '분석에 실패했어요. 잠시 후 다시 시도해 주세요.');
        setStage('previewing');
        return;
      }

      if (!data.isFragrance || !data.brand || !data.name) {
        toast.error(data.message ?? '향수를 인식하지 못했어요.');
        setStage('previewing');
        return;
      }

      // 현재 /scan 히스토리 항목을 ?camera=true로 교체 — 결과 페이지에서 뒤로가기 시 카메라 자동 시작
      router.replace('/scan?camera=true');
      router.push(`/scan/result/${data.scanId}`);
    } catch (err) {
      console.error('[ScanClient] analyze error:', err);
      toast.error('네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
      setStage('previewing');
    }
  };

  return (
    <>
      {/*
        페이지 컨테이너(px / max-w / 제목)는 page.tsx에서 처리.
        여기서는 stage별 컨텐츠 레이아웃만 담당.
      */}
      <section className="mt-6 md:mt-10">
        {stage === 'idle' && (
          /*
            카메라 비활성: max-w-sm(384px) — 버튼/디바이더/안내가 같은 좁은 컬럼에 깔끔히 정렬
            카메라 활성: max-w-2xl(672px) — 비디오 폭 확보 (디바이더·파일선택은 숨김)
          */
          <div
            className={`flex flex-col mx-auto w-full ${
              cameraActive ? 'max-w-2xl' : 'max-w-sm'
            }`}
          >
            <p className="text-center text-[13px] md:text-sm text-stone-500 dark:text-stone-400 leading-[1.8] font-light tracking-wide mb-8 md:mb-10">
              카메라로 향수병을 촬영하거나 갤러리에서 사진을 선택하면
              <br />
              AI가 어떤 향수인지 알려드려요.
            </p>

            <CameraCapture
              onCapture={handleCapture}
              onActiveChange={setCameraActive}
              autoStart={autoStartCamera}
            />

            {!cameraActive && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-stone-200/60 dark:bg-stone-700/40" />
                  <span className="text-xs uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
                    또는
                  </span>
                  <div className="flex-1 h-px bg-stone-200/60 dark:bg-stone-700/40" />
                </div>

                <FileUploadFallback onCapture={handleCapture} />

                <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-8 text-center leading-[1.8] font-light tracking-wide">
                  촬영한 사진은 분석 후 안전하게 보관돼요.
                  <br />
                  본인이 직접 촬영한 사진만 올려 주세요.
                </p>
              </>
            )}
          </div>
        )}

        {stage === 'previewing' && capturedUrl && (
          <ScanPreview
            imageUrl={capturedUrl}
            onRetake={resetAll}
            onAnalyze={handleAnalyze}
          />
        )}
      </section>

      {stage === 'analyzing' && (
        <PointsLoading loadingMessage="AI가 향수를 분석하고 있어요 (약 10~15초)" />
      )}
    </>
  );
}
