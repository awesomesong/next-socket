import { useEffect } from 'react';

export const useLayoutHeight = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const update = () => {
      if (window.innerWidth >= 768 || !window.visualViewport) {
        el.style.height = ""; // desktop이거나 지원 안되면 초기화
        el.scrollTop = 0; // 스크롤 초기화
        return;
      }

      const { height } = window.visualViewport;
      el.style.height = `${height}px`;

      // ✅ 스크롤을 맨 위로 이동시킴
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    };

    // 초기 적용
    update();

    // 옵셔버 등록
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update); 

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [ref]);
};
