import { useEffect } from 'react';

export const useLayoutHeight = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    let isFirstMount = true;

    const update = () => {
      if (window.innerWidth >= 768 || !window.visualViewport) {
        el.style.height = ""; // desktop이거나 지원 안되면 초기화
        el.scrollTop = 0; // 스크롤 초기화
        return;
      }

      const { height } = window.visualViewport;
      el.style.height = `${height}px`;

      // ✅ 최초 진입 시, 아래로 스크롤 (최신 메시지 보기)
      if (isFirstMount) {
        isFirstMount = false;

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
          });
        });
      }
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
