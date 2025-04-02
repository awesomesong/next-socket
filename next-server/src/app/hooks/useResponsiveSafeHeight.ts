import { useEffect, useCallback } from 'react';
import { useKeyboardSafeHeight } from './useKeyboardSafeHeight';

/**
 * ref로 전달된 요소에 대해 window 사이즈/키보드에 따라 height를 자동 조절합니다.
 *
 * @param ref - height를 조절할 대상 요소의 ref
 * @param offsetMobile - 모바일일 때 빼줄 여백 (기본값 55px)
 * @param offsetGlobal - visualViewport 기준에서 항상 빼줄 여백 (기본값 0)
 * @param breakpoint - 모바일/데스크탑 기준 width (기본값 768px)
 */
export const useResponsiveSafeHeight = (
  ref: React.RefObject<HTMLElement>,
  offsetMobile: number = 0,
  offsetGlobal: number = 0,
  breakpoint: number = 768
) => {
  const safeHeight = useKeyboardSafeHeight(offsetGlobal);

  const applyHeight = useCallback(() => {
    if (safeHeight && ref.current) {
      const screenWidth = window.innerWidth;

      const height =
        screenWidth < breakpoint
          ? safeHeight - offsetMobile
          : safeHeight;

      ref.current.style.height = `${height}px`;
    }
  }, [safeHeight, ref, offsetMobile, breakpoint]);

  useEffect(() => {
    applyHeight();

    window.addEventListener('resize', applyHeight);

    return () => {
      window.removeEventListener('resize', applyHeight);
    };
  }, [applyHeight]);
}; 
