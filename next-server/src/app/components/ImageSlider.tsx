import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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
  className?: string;
  imageClassName?: string;
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
  /** prev/next 클릭 시 이벤트 전파 막기 (Link 안의 카드용) */
  stopPropagation?: boolean;
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const ImageSlider = ({
  images,
  currentIndex,
  onSelectIndex,
  alt,
  className = 'relative w-full h-full',
  imageClassName = 'object-contain p-4 md:p-8 transition-transform duration-700 group-hover:scale-105 pointer-events-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.1)]',
  sizes,
  onZoom,
  showAnalyzeButton = false,
  onAnalyze,
  analyzeDisabled = false,
  isAnalyzing = false,
  variant = 'default',
  stopPropagation = false,
}: ImageSliderProps) => {
  const [[page, direction], setPage] = useState([currentIndex, 0]);

  useEffect(() => {
    if (currentIndex !== page) {
      setPage([currentIndex, currentIndex > page ? 1 : -1]);
    }
  }, [currentIndex, page]);

  if (images.length === 0) return null;

  const current = images[currentIndex];
  const src = getImageSrc(current);
  const safeIndex = Math.max(0, Math.min(currentIndex, images.length - 1));

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
  const chevronInset = isCompact ? 'inset-x-2' : 'inset-x-4';
  const chevronBtnClass = isCompact
    ? 'p-1 rounded-full bg-[#1a1625]/90 dark:bg-[#f8f7ff]/95 text-white dark:text-[#2d2040] shadow-md hover:bg-[#1a1625] dark:hover:bg-white transition-all pointer-events-auto'
    : 'p-1.5 rounded-full bg-[#1a1625]/90 dark:bg-[#f8f7ff]/95 text-white dark:text-[#2d2040] shadow-md hover:bg-[#1a1625] dark:hover:bg-white transition-all pointer-events-auto';
  const chevronIconClass = isCompact ? 'w-4 h-4' : 'w-5 h-5';

  const imageNode = (
    <AnimatePresence initial={false} custom={direction} mode="popLayout">
      <motion.div
        key={page}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={currentIndex === 0}
          className={imageClassName}
        />
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className={`card-image-slider ${className} overflow-hidden`}>
      {onZoom ? (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center cursor-zoom-in focus:outline-none z-0"
          onClick={onZoom}
          aria-label="이미지 확대"
        >
          {imageNode}
        </button>
      ) : (
        <div className="absolute inset-0 z-0">
          {imageNode}
        </div>
      )}

      {variant === 'default' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      {showAnalyzeButton && onAnalyze && (
        <button
          type="button"
          onClick={() => onAnalyze(src)}
          disabled={analyzeDisabled}
          aria-label="AI 이미지 분석"
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/50 text-[#5c4a7a] dark:text-[#c8b4ff] shadow-md text-[10px] uppercase tracking-widest font-medium hover:bg-[#f1ecfe] dark:hover:bg-[#2d2040] transition-all opacity-0 group-hover:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <HiSparkles className="w-3.5 h-3.5" />
          {isAnalyzing ? '분석 중...' : 'AI 분석'}
        </button>
      )}

      {images.length > 1 && (
        <div
          className={`absolute inset-y-0 ${chevronInset} flex items-center justify-between pointer-events-none z-10`}
        >
          <button
            type="button"
            className={clsx(chevronBtnClass, safeIndex === 0 && 'opacity-30 cursor-not-allowed')}
            onClick={handlePrev}
            disabled={safeIndex === 0}
            aria-label={isCompact ? '이전 이미지' : 'Previous'}
          >
            <HiChevronLeft className={chevronIconClass} />
          </button>
          <button
            type="button"
            className={clsx(chevronBtnClass, safeIndex === images.length - 1 && 'opacity-30 cursor-not-allowed')}
            onClick={handleNext}
            disabled={safeIndex === images.length - 1}
            aria-label={isCompact ? '다음 이미지' : 'Next'}
          >
            <HiChevronRight className={chevronIconClass} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
export { ImageSlider as FragranceImageSlider };
