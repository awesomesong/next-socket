import { useEffect } from 'react';

export const useLayoutHeight = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!ref.current || !window.visualViewport) return;

    const el = ref.current;
    const vv = window.visualViewport;

    const update = () => {
      const height = vv.height;
      el.style.height = `${height}px`;
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [ref]);
};
