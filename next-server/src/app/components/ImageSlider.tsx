import { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { HiChevronLeft, HiChevronRight, HiSparkles } from 'react-icons/hi2';
import clsx from 'clsx';

export type ImageSliderItem = string | { src: string; name?: string } | { url: string };

function getImageSrc(item: ImageSliderItem): string {
  if (typeof item === 'string') return item;
  if ('url' in item) return item.url;
  return item.src;
}

export type ImageSliderProps = {
  images: ImageSliderItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  alt: string;
  sizes?: string;
  /** 클릭 시 라이트박스 열기 (Form용) */
  onZoom?: () => void;
  /** AI 분석 버튼 표시 (Form용) */
  showAnalyzeButton?: boolean;
  onAnalyze?: (src: string) => void;
  analyzeDisabled?: boolean;
  isAnalyzing?: boolean;
  /** 'default': Form 스타일(큰 버튼), 'compact': 카드 스타일 */
  variant?: 'default' | 'compact';
  /** 컨테이너 비율 (normal flow로 높이 확보). 예: '3/4', '16/10' */
  aspectRatio?: string;
  /** 이미지 채우기 방식 */
  fit?: 'contain' | 'cover';
  /** prev/next 클릭 시 이벤트 전파 막기 (Link 안의 카드용) */
  stopPropagation?: boolean;
};

const ImageSlider = ({
  images,
  currentIndex,
  onSelectIndex,
  alt,
  sizes,
  onZoom,
  showAnalyzeButton = false,
  onAnalyze,
  analyzeDisabled = false,
  isAnalyzing = false,
  variant = 'default',
  stopPropagation = false,
  aspectRatio = '3/4',
  fit = 'contain',
}: ImageSliderProps) => {
  const imagesLen = images.length;
  const safeIndex =
    imagesLen === 0 ? 0 : Math.max(0, Math.min(currentIndex, imagesLen - 1));

  const handlePrev = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (safeIndex > 0) {
      onSelectIndex(safeIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (safeIndex < images.length - 1) {
      onSelectIndex(safeIndex + 1);
    }
  };

  const isCompact = variant === 'compact';
  const chevronBtnClass = isCompact
    ? 'p-1 rounded-full bg-[#1a1625]/90 dark:bg-[#f8f7ff]/95 text-white dark:text-[#2d2040] shadow-md hover:bg-[#1a1625] dark:hover:bg-white transition-all'
    : 'p-1.5 rounded-full bg-[#1a1625]/90 dark:bg-[#f8f7ff]/95 text-white dark:text-[#2d2040] shadow-md hover:bg-[#1a1625] dark:hover:bg-white transition-all';
  const chevronIconClass = isCompact ? 'w-4 h-4' : 'w-5 h-5';

  const wrapperStyle = useMemo(() => ({ aspectRatio }), [aspectRatio]);
  const trackX = `-${safeIndex * 100}%`;
  const imgClassName = clsx(
    'pointer-events-none',
    fit === 'cover' ? 'object-cover' : 'object-contain',
    /* 640px(sm)+ 에서는 padding 제거 */
    fit === 'contain' && 'p-4 sm:p-0',
    fit === 'contain' && 'drop-shadow-[0_10px_25px_rgba(0,0,0,0.1)]'
  );
  const imgStyle = fit === 'cover'
    ? ({ width: '100%', height: '100%' } as React.CSSProperties)
    : ({ width: '100%', height: '100%' } as React.CSSProperties);

  if (imagesLen === 0) return null;

  return (
    <div className="card-image-slider w-full">
      <div
        className={clsx(
          'w-full overflow-hidden rounded-[inherit] grid grid-cols-1 grid-rows-1',
          isCompact && 'min-h-[160px] max-h-[260px]'
        )}
        style={wrapperStyle}
      >
        {onZoom ? (
          <button
            type="button"
            className="w-full h-full cursor-zoom-in focus:outline-none col-start-1 row-start-1 z-0"
            onClick={onZoom}
            aria-label="이미지 확대"
          >
            <motion.div
              className="flex w-full h-full"
              animate={{ x: trackX }}
              transition={{ type: 'spring', stiffness: 260, damping: 34 }}
            >
              {images.map((item, i) => (
                <div key={i} className="w-full h-full flex-[0_0_100%] flex items-center justify-center">
                  <Image
                    src={getImageSrc(item)}
                    alt={alt}
                    width={1200}
                    height={1200}
                    sizes={sizes}
                    priority={i === 0}
                    className={imgClassName}
                    style={imgStyle}
                  />
                </div>
              ))}
            </motion.div>
          </button>
        ) : (
          <motion.div
            className="flex w-full h-full col-start-1 row-start-1 z-0"
            animate={{ x: trackX }}
            transition={{ type: 'spring', stiffness: 260, damping: 34 }}
          >
            {images.map((item, i) => (
              <div key={i} className="w-full h-full flex-[0_0_100%] flex items-center justify-center">
                <Image
                  src={getImageSrc(item)}
                  alt={alt}
                  width={1200}
                  height={1200}
                  sizes={sizes}
                  priority={i === 0}
                  className={imgClassName}
                  style={imgStyle}
                />
              </div>
            ))}
          </motion.div>
        )}

        {imagesLen > 1 && (
          <div className="col-start-1 row-start-1 w-full h-full flex items-center justify-between px-2 pointer-events-none z-10">
            <button
              type="button"
              className={clsx(
                chevronBtnClass,
                'pointer-events-auto',
                safeIndex === 0 && 'opacity-60 cursor-not-allowed'
              )}
              onClick={handlePrev}
              disabled={safeIndex === 0}
              aria-label={isCompact ? '이전 이미지' : 'Previous'}
            >
              <HiChevronLeft className={chevronIconClass} />
            </button>
            <button
              type="button"
              className={clsx(
                chevronBtnClass,
                'pointer-events-auto',
                safeIndex === imagesLen - 1 && 'opacity-60 cursor-not-allowed'
              )}
              onClick={handleNext}
              disabled={safeIndex === imagesLen - 1}
              aria-label={isCompact ? '다음 이미지' : 'Next'}
            >
              <HiChevronRight className={chevronIconClass} />
            </button>
          </div>
        )}
      </div>

      {(imagesLen > 1 || (showAnalyzeButton && onAnalyze)) && (
        <div className={clsx('mt-2 flex items-center justify-between', isCompact ? 'px-1' : 'px-0')}>
          {imagesLen > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] tracking-widest text-[var(--color-text-secondary)]">
                {safeIndex + 1}/{imagesLen}
              </span>
            </div>
          ) : (
            <span />
          )}

          {showAnalyzeButton && onAnalyze && (
            <button
              type="button"
              onClick={() => onAnalyze(getImageSrc(images[safeIndex]))}
              disabled={analyzeDisabled}
              aria-label="AI 이미지 분석"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/50 text-[#5c4a7a] dark:text-[#c8b4ff] shadow-md text-[11px] uppercase tracking-widest font-medium hover:bg-[#f1ecfe] dark:hover:bg-[#2d2040] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <HiSparkles className="w-3.5 h-3.5" />
              {isAnalyzing ? '분석 중...' : 'AI 분석'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
export { ImageSlider as FragranceImageSlider };
