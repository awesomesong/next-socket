import { useEffect } from 'react';

export const useLayoutHeight = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const update = () => {
      // 터치 디바이스가 아니거나 visualViewport 미지원 시 데스크탑 처리
      const isTouchDevice = navigator.maxTouchPoints > 0;
      if (!isTouchDevice || !window.visualViewport) {
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
        el.style.height = "";
        el.scrollTop = 0;
        return;
      }

      const vv = window.visualViewport;
      // position: fixed로 iOS 인앱 브라우저의 주소창/키보드 툴바 대응
      // offsetTop으로 키보드 열림 시 visual viewport 스크롤 보정
      el.style.position = "fixed";
      el.style.top = `${vv.offsetTop}px`;
      el.style.left = "0";
      el.style.width = "100%";
      el.style.height = `${vv.height}px`;
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
