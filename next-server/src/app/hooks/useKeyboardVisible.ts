import { useEffect, useState } from 'react';

export const useKeyboardVisible = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // width < 768 여부

  // 내부 상태 추적용
  let lastFocused = false;

  // ✅ 최초 렌더링 시 디바이스 width 체크
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile(); // 초기 체크
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // ✅ focusin / focusout 기반 감지
  useEffect(() => {
    if (!isMobile) return;

    const handleFocusIn = () => {
      lastFocused = true;
      setKeyboardVisible(true);
    };

    const handleFocusOut = () => {
      lastFocused = false;
      setTimeout(() => {
        if (!lastFocused) setKeyboardVisible(false);
      }, 100);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, [isMobile]);

  // ✅ visualViewport 기반 감지
  useEffect(() => {
    if (!isMobile) return;

    const handleViewportChange = () => {
      const heightDiff = window.innerHeight - window.visualViewport?.height!;
      if (heightDiff > 100) {
        setKeyboardVisible(true);
      } else {
        if (!document.activeElement || (document.activeElement as HTMLElement).blur) {
          setKeyboardVisible(false);
        }
      }
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleViewportChange);
      vv.addEventListener('scroll', handleViewportChange);
    }

    window.addEventListener('resize', handleViewportChange); // Android 대응

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleViewportChange);
        vv.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [isMobile]);

  return keyboardVisible;
};
