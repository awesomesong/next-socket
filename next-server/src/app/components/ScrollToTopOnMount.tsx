'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 향수 상세 라우트(/fragrance/[name]) 진입 시 스크롤을 상단으로 고정.
 * 레이아웃에서 사용해, 리뷰/폼 등 다른 컴포넌트의 scrollIntoView보다 먼저·나중에 여러 번 실행해 덮어씀.
 */
export default function ScrollToTopOnMount() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith('/fragrance/')) return;

    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);
    const t3 = setTimeout(scrollToTop, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  return null;
}
