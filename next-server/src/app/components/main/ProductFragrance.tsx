'use client';
import { useRef, useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import Link from 'next/link';
import { HiPlus, HiChevronDown, HiChevronUp } from 'react-icons/hi2';
import { useInView } from 'react-intersection-observer';
import ImageSlider from '@/src/app/components/ImageSlider';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getFragrances, getFragranceBrands } from '@/src/app/lib/getFragrances';
import { fragranceListKey, fragranceBrandsKey } from '@/src/app/lib/react-query/fragranceCache';
import { useSession } from 'next-auth/react';
import { FragranceCardSkeleton, FragranceHeaderSkeleton, FragranceFilterSkeleton } from '../FragranceSkeleton';
import CircularProgress from '@/src/app/components/CircularProgress';
import StatusMessage from '@/src/app/components/StatusMessage';
import clsx from 'clsx';

const FRAGRANCE_MOTION_TRANSITION = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94],
} satisfies Transition;

// 스티키 감지: Intersection Observer로 센티널이 상단 62px 위로 나가면 스티키 (모든 화면 크기 공통)
const STICKY_TOP = 62;

// 스티키일 때 위로 SCROLL_HIDE_PX 이상 누적 스크롤 → 필터 바 숨김, 아래로 SCROLL_SHOW_PX 이상 → 다시 표시
const SCROLL_HIDE_PX = 15;
const SCROLL_SHOW_PX = 20;

// 필터 1줄 높이 폴백값 — 측정 div의 첫 pill 높이를 동적으로 쓰고, 유효하지 않을 때만 이 값 사용
const FALLBACK_ONE_LINE_HEIGHT_PX = 38;

/** 측정 div에서 전체 높이·1줄 높이 읽기. 유효할 때만 valid true.
 * 측정 div는 보이는 필터와 동일한 pill 목록을 absolute로 겹쳐 둔 영역이라, totalHeight = pill들이 감싸진 전체 높이.
 * offsetHeight=0이면 레이아웃이 아직 계산되지 않은 상태(리사이즈 직후 한두 프레임) → valid false. */
function getPillsMeasure(measureEl: HTMLDivElement | null): { valid: boolean; totalHeight: number; oneLinePx: number } {
  if (!measureEl) return { valid: false, totalHeight: 0, oneLinePx: FALLBACK_ONE_LINE_HEIGHT_PX };
  const totalHeight = measureEl.offsetHeight;
  const first = measureEl.firstElementChild as HTMLElement | null;
  const firstH = first?.offsetHeight ?? 0;
  const oneLinePx = firstH > 0 ? firstH : FALLBACK_ONE_LINE_HEIGHT_PX;
  const valid = totalHeight > 0 && firstH > 0;
  return { valid, totalHeight, oneLinePx };
}

// 그리드 열 개수: grid minmax(180px,1fr) + gap-5 + px-8 + max-w 1440 기준 (DOM 측정 없이 너비로 계산)
const GRID_MIN_COL_PX = 180;
const GRID_GAP_PX = 20;
const GRID_PADDING_X = 64; // px-8
const GRID_MAX_CONTENT = 1440 - GRID_PADDING_X;
function getColumnCount(width: number): number {
  if (width <= 0) return 1;
  const contentWidth = Math.min(width - GRID_PADDING_X, GRID_MAX_CONTENT);
  return Math.max(1, Math.floor((contentWidth + GRID_GAP_PX) / (GRID_MIN_COL_PX + GRID_GAP_PX)));
}

// 필터 변경 시 스크롤 없이도 카드가 애니메이션되도록 useInView + filterReveal 결합
function FragranceCardWrapper({
  filterReveal,
  delay,
  children,
  onHoverStart,
  onHoverEnd,
}: {
  filterReveal: boolean;
  delay: number;
  children: React.ReactNode;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const shouldReveal = filterReveal || inView;
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 48 }}
      animate={shouldReveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      exit={{ opacity: 0, scale: 0.88, y: -8 }}
      transition={{ ...FRAGRANCE_MOTION_TRANSITION, delay }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
    >
      {children}
    </motion.div>
  );
}

const ProductFragrance = () => {
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null); // 카드 그리드와 스티키 필터를 포함하는 섹션 루트 (모바일에서 스크롤 컨테이너 탐색 시 기준)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null); // 현재 호버 중인 향수 카드 slug (호버 애니메이션/스타일 제어)
  const [cardSliderIndices, setCardSliderIndices] = useState<Record<string, number>>({}); // 각 카드별 이미지 슬라이더 인덱스 저장
  const [selectedBrand, setSelectedBrand] = useState<string>('All'); // 현재 선택된 브랜드 필터 값
  const [numColumns, setNumColumns] = useState(1); // 그리드 열 개수 — 스태거 딜레이(왼쪽→오른쪽)용. 변경 시에만 setState로 리렌더 최소화
  const pillsRef = useRef<HTMLDivElement>(null); // 실제 브랜드 pill 버튼들이 렌더링되는 영역
  const pillsMeasureRef = useRef<HTMLDivElement>(null); // 자연 높이를 측정하기 위한 숨겨진 pill 영역 (1줄 초과 여부 계산, 모든 화면 크기 공통)
  const filterStickyBarRef = useRef<HTMLDivElement>(null); // 스크롤 시 상단에 고정되는 필터 바 컨테이너
  const filterStickySentinelRef = useRef<HTMLDivElement>(null); // 이 지점이 상단 임계점(STICKY_TOP)을 지나가는지로 스티키 여부 감지
  const [filterExpand, setFilterExpand] = useState({ showToggle: false, expanded: false }); // showToggle: pill이 2줄 이상일 때 펼치기 버튼 노출 / expanded: 필터 펼침 여부 (스티키 + 2줄일 때 활성화)
  const [isFilterSticky, setIsFilterSticky] = useState(false); // 현재 필터 바가 스티키 상태(상단에 고정)인지 여부
  const [stickyBarMounted, setStickyBarMounted] = useState(false); // 스티키 바 DOM이 실제로 마운트되었는지 (Observer/resize 세팅 타이밍 제어)
  const [stickyFilterVisible, setStickyFilterVisible] = useState(true); // 스크롤 방향에 따라 스티키 필터 바를 보여줄지/위로 숨길지 여부
  const [filterReveal, setFilterReveal] = useState(false); // 필터 변경 직후 카드가 스크롤 없이도 애니메이션되도록 하는 플래그
  const lastScrollYRef = useRef(0); // 마지막 스크롤 위치 저장 (Intersection Observer에서 stuck 시 사용)
  const lastScrollYForDirectionRef = useRef(0); // 스티키일 때만 스크롤 방향 계산용 — 이 effect에서만 갱신
  const ignoreStickyUnstickRef = useRef(false); // 강제 펼침/접기 직후 일시적으로 스크롤에 의한 숨김/해제를 무시하기 위한 플래그
  const lastResizeTimeRef = useRef(0); // 리사이즈 직후 Observer가 스티키 해제하지 않도록 무시 구간용
  const resizeMeasureTimeoutsRef = useRef<number[]>([]); // 리사이즈 후 지연 측정 타이머 정리용

  const {
    data,
    status,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: fragranceListKey,
    queryFn: getFragrances,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.at(-1)?.id ?? undefined,
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      requestAnimationFrame(() => {
        fetchNextPage();
      });
    }
  }, [inView, hasNextPage, fetchNextPage, isFetchingNextPage]);

  const fragrances = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p),
    [data]
  );

  // DB 전체 브랜드 목록 조회 (useInfiniteQuery와 별도)
  const { data: brandsData } = useQuery({
    queryKey: fragranceBrandsKey,
    queryFn: getFragranceBrands,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
  const ALL_BRANDS = useMemo(
    () => (brandsData?.length ? ['All', ...brandsData] : []),
  [brandsData]);

  // 측정용 div의 자연 높이가 1줄을 넘으면(2줄) showToggle=true. 리사이즈될 때마다 측정해 두면 스티키 됐을 때 버튼이 바로 나옴.
  // 먼저 동기로 측정해 보고, 유효하지 않으면(리사이즈 직후 등) rAF·setTimeout으로 재측정.
  const measurePillsHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    lastResizeTimeRef.current = Date.now(); // 리사이즈/측정 직후 Observer 언스티키 방지 (먼저 호출돼도 대비)
    const el = pillsMeasureRef.current;
    if (!el) return;

    const apply = () => {
      const el2 = pillsMeasureRef.current;
      if (!el2 || typeof window === 'undefined') return;
      const m = getPillsMeasure(el2);
      if (!m.valid) return;
      const overflows = m.totalHeight > m.oneLinePx;
      setFilterExpand((prev) => {
        if (prev.showToggle === overflows && (overflows || !prev.expanded)) return prev;
        return { showToggle: overflows, expanded: overflows ? prev.expanded : false };
      });
    };

    const m = getPillsMeasure(el);
    if (m.valid) {
      const overflows = m.totalHeight > m.oneLinePx;
      setFilterExpand((prev) => {
        if (prev.showToggle === overflows && (overflows || !prev.expanded)) return prev;
        return { showToggle: overflows, expanded: overflows ? prev.expanded : false };
      });
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(apply));
    window.setTimeout(apply, 60);
  }, []);

  // 스티키로 전환된 직후 호출 — 높이만 보고 펼치기 노출. 유효하지 않으면 한 번 재시도(레이아웃 지연 대비).
  const measureForSticky = useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = pillsMeasureRef.current;
    let m = getPillsMeasure(el);
    if (m.valid) {
      setFilterExpand((prev) => ({ ...prev, showToggle: m.totalHeight > m.oneLinePx }));
      return;
    }
    window.setTimeout(() => {
      const el2 = pillsMeasureRef.current;
      const m2 = getPillsMeasure(el2);
      if (m2.valid) setFilterExpand((prev) => ({ ...prev, showToggle: m2.totalHeight > m2.oneLinePx }));
    }, 80);
  }, []);

  // 측정 div가 DOM에 붙는 순간: 유효한 측정일 때 펼치기 노출 여부 갱신 (2줄이면 true, 스티키일 때만 버튼은 실제로 렌더됨).
  const setPillsMeasureRef = useCallback((el: HTMLDivElement | null) => {
    (pillsMeasureRef as { current: HTMLDivElement | null }).current = el;
    if (!el || typeof window === 'undefined') return;
    const check = () => {
      const m = getPillsMeasure(el);
      if (!m.valid) return;
      setFilterExpand((prev) => ({ ...prev, showToggle: m.totalHeight > m.oneLinePx }));
    };
    requestAnimationFrame(() => requestAnimationFrame(check));
    window.setTimeout(check, 100);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = pillsMeasureRef.current;
    if (!el) return;

    measurePillsHeight();
    const id = requestAnimationFrame(() => measurePillsHeight());
    const t = window.setTimeout(measurePillsHeight, 40);
    const ro = new ResizeObserver(measurePillsHeight);
    ro.observe(el);
    window.addEventListener('resize', measurePillsHeight);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(t);
      ro.disconnect();
      window.removeEventListener('resize', measurePillsHeight);
    };
  }, [ALL_BRANDS, measurePillsHeight, isLoading]);

  useEffect(() => {
    const sentinel = filterStickySentinelRef.current;
    const section = scrollRef.current;
    if (!sentinel || !section || typeof window === 'undefined') return;

    let scrollTarget: Window | Element = window;
    let getY: () => number = () => window.scrollY ?? document.documentElement.scrollTop ?? 0;
    for (let el: HTMLElement | null = section.parentElement; el; el = el.parentElement) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY || style.overflow;
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
        if (el.scrollHeight > el.clientHeight) {
          scrollTarget = el;
          getY = () => el.scrollTop;
          break;
        }
      }
    }

    lastScrollYRef.current = getY();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        // sentinel이 위쪽으로 나갔을 때만 stuck (아래 뷰포트 밖은 제외)
        const stuck = !entry.isIntersecting && entry.boundingClientRect.top < STICKY_TOP;
        if (stuck) {
          setIsFilterSticky(true);
          requestAnimationFrame(() => measureForSticky());
          setTimeout(measureForSticky, 0);
        } else if (entry.isIntersecting && !ignoreStickyUnstickRef.current) {
          // 리사이즈 직후 레이아웃 변경으로 Observer가 잘못 intersecting 처리해 스티키가 풀리지 않도록 무시
          if (Date.now() - lastResizeTimeRef.current < 600) return;
          setIsFilterSticky(false);
        }
      },
      {
        root: null,
        rootMargin: `-${STICKY_TOP}px 0px 0px 0px`,
        threshold: 0,
      }
    );
    observer.observe(sentinel);

    const onScrollY = () => {
      lastScrollYRef.current = getY();
    };
    if (scrollTarget === window) {
      window.addEventListener('scroll', onScrollY, { passive: true });
    } else {
      scrollTarget.addEventListener('scroll', onScrollY, { passive: true });
    }

    const onResize = () => {
      lastResizeTimeRef.current = Date.now();
      // 레이아웃 안정 후 센티널 위치로 스티키 상태 복구 (모바일/데스크톱 공통)
      const restoreStickyIfNeeded = () => {
        if (typeof window === 'undefined') return;
        const el = filterStickySentinelRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const shouldSticky = rect.top < STICKY_TOP;
        setIsFilterSticky((prev) => (prev === shouldSticky ? prev : shouldSticky));
      };
      // 레이아웃 안정 후 2줄 여부 재측정 + 센티널 위치로 스티키 상태 복구 — 모든 사이즈 공통
      setStickyFilterVisible((prev) => (prev ? prev : true));
      resizeMeasureTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      resizeMeasureTimeoutsRef.current = [
        window.setTimeout(measurePillsHeight, 150),
        window.setTimeout(measurePillsHeight, 400),
        window.setTimeout(restoreStickyIfNeeded, 200),
        window.setTimeout(restoreStickyIfNeeded, 450),
      ];
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      resizeMeasureTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      resizeMeasureTimeoutsRef.current = [];
      observer.disconnect();
      if (scrollTarget === window) {
        window.removeEventListener('scroll', onScrollY);
      } else {
        scrollTarget.removeEventListener('scroll', onScrollY);
      }
      window.removeEventListener('resize', onResize);
    };
  }, [isLoading, stickyBarMounted]);

  useEffect(() => {
    if (!isFilterSticky) {
      setFilterExpand((prev) => ({ ...prev, showToggle: false }));
      setStickyFilterVisible(true);
      return;
    }
    setStickyFilterVisible(true);
    const run = () => {
      const el = pillsMeasureRef.current;
      if (!el || typeof window === 'undefined') return;
      const m = getPillsMeasure(el);
      if (!m.valid) return;
      setFilterExpand((prev) => ({ ...prev, showToggle: m.totalHeight > m.oneLinePx }));
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
    const t = window.setTimeout(run, 80);
    return () => window.clearTimeout(t);
  }, [isFilterSticky]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isFilterSticky) return;

    const section = scrollRef.current;
    if (!section) return;

    let scrollTarget: Window | Element = window;
    let getY: () => number = () => window.scrollY ?? document.documentElement.scrollTop ?? 0;
    for (let el: HTMLElement | null = section.parentElement; el; el = el.parentElement) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY || style.overflow;
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
        if (el.scrollHeight > el.clientHeight) {
          scrollTarget = el;
          getY = () => el.scrollTop;
          break;
        }
      }
    }

    let ticking = false;
    let anchorY = getY();      // 방향 전환 기준점 — 이 위치에서부터 누적 이동량 측정
    let prevFrameY = anchorY;  // 직전 프레임 Y (방향 반전 감지용)
    let curVisible = true;     // 현재 표시 상태 로컬 추적
    lastScrollYForDirectionRef.current = anchorY;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = getY();
        const frameDelta = y - prevFrameY;  // 이번 프레임 이동 방향
        const totalDelta = y - anchorY;     // 앵커 기준 누적 이동량

        // 방향 반전 시 앵커 리셋 — 반대 방향 누적이 남아 오작동하지 않도록
        if ((frameDelta > 0 && totalDelta < 0) || (frameDelta < 0 && totalDelta > 0)) {
          anchorY = y;
        }

        const cumDelta = y - anchorY;

        if (curVisible && cumDelta < -SCROLL_HIDE_PX && !ignoreStickyUnstickRef.current) {
          // 위로 충분히 스크롤 → 필터 바 숨김
          setStickyFilterVisible(false);
          curVisible = false;
          anchorY = y;
        } else if (!curVisible && cumDelta > SCROLL_SHOW_PX) {
          // 아래로 충분히 스크롤 → 필터 바 표시
          setStickyFilterVisible(true);
          curVisible = true;
          anchorY = y;
        }

        prevFrameY = y;
        lastScrollYForDirectionRef.current = y;
        ticking = false;
      });
    };

    lastScrollYRef.current = getY();
    if (scrollTarget === window) {
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollTarget.removeEventListener('scroll', onScroll);
  }, [isFilterSticky]);

  // 그리드 열 개수: 리사이즈 시 열 수가 바뀔 때만 setState (리렌더 최소화) + 디바운스로 연속 리사이즈 시 한 번만 갱신
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;
    let timeoutId = 0;
    const DEBOUNCE_MS = 120;

    const update = () => {
      const next = getColumnCount(window.innerWidth);
      setNumColumns((prev) => (prev === next ? prev : next));
    };

    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (timeoutId) window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          timeoutId = 0;
          update();
        }, DEBOUNCE_MS);
      });
    };

    update(); // 초기값
    window.addEventListener('resize', onResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const filteredData = useMemo(
    () =>
      selectedBrand === 'All'
        ? fragrances
        : fragrances.filter((f) => f.brand === selectedBrand),
    [selectedBrand, fragrances],
  );

  return (
    <section className="product-layout" ref={scrollRef}>
      <AnimatePresence mode="wait">
        {status === 'error' ? (
          <StatusMessage error={error ?? undefined} />
        ) : isLoading ? (
          <motion.div
            key="loading-view"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FragranceHeaderSkeleton />
            <FragranceFilterSkeleton />
            <div className="product-box grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 pt-2 px-8 pb-8 max-w-[1440px] mx-auto">
              {Array.from({ length: 12 }).map((_, index) => (
                <FragranceCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          </motion.div>
        ) : (
          <div key="content-view">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="product-fragrance-header-layout"
            >
              <p className="product-fragrance-label text-[0.7rem] tracking-[0.3em] mb-2 font-medium text-center">
                컬렉션
              </p>
              <div className="product-fragrance-header-grid">
                <div className="hidden sm:block" aria-hidden />
                <h2 className="text-gradient-scent page-title-gradient text-center sm:whitespace-nowrap">
                  시그니처 향기 갤러리
                </h2>
                <div className="flex justify-center sm:justify-end">
                  {session?.user && (
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Link
                        href="/fragrance/create"
                        className="action-btn"
                      >
                        <HiPlus className="w-4 h-4 shrink-0" aria-hidden />
                        향수 정보 추가
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="product-fragrance-divider product-fragrance-header-divider" />
            </motion.div>

            {/* 스티키 감지용: 이 요소가 뷰포트 상단(62px) 위로 나가면 필터 바가 스티키로 붙은 상태 */}
            <div ref={filterStickySentinelRef} className="h-px w-full shrink-0" aria-hidden />

            {/* 필터: 스티키. 데스크톱=항상 전체 / 모바일=스티키일 때만 1줄+펼치기. 위로 스크롤 시 바가 위로 슬라이드되어 숨김, 아래로 스크롤 시 다시 나타남 */}
            <motion.div
              ref={(el) => {
                (filterStickyBarRef as { current: HTMLDivElement | null }).current = el;
                setStickyBarMounted(!!el);
              }}
              className={clsx(
                'sticky z-40 top-[59px] w-full overflow-hidden',
                isFilterSticky && 'bg-[var(--header-bg)] backdrop-blur-md border-b border-b-[var(--header-border)]',
                !stickyFilterVisible && isFilterSticky && 'max-md:pointer-events-none',
              )}
              animate={{
                y: !stickyFilterVisible && isFilterSticky ? '-100%' : 0,
              }}
              transition={{
                type: 'tween',
                duration: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div className="product-fragrance-filter-wrap max-md:will-change-transform">
              <div className="product-fragrance-filter-inner">
                {/* 측정용: 같은 폭·같은 필터로 자연 높이만 측정(보이지 않음). 1줄 높이(2rem) 초과 시 펼치기 버튼 노출 */}
                <div
                  ref={setPillsMeasureRef}
                  aria-hidden
                  className="absolute left-0 right-0 top-0 px-4 md:px-8 flex flex-wrap justify-center gap-2 overflow-visible opacity-0 pointer-events-none invisible"
                >
                  {ALL_BRANDS.map((brand) => (
                    <span
                      key={brand}
                      className="border rounded-full py-[0.35rem] px-4 text-[0.72rem] tracking-[0.08em] shrink-0"
                    >
                      {brand}
                    </span>
                  ))}
                </div>

                {/* 필터 필 — 비스티키=전부 / 스티키=1줄(또는 펼침 시 전체) */}
                <div
                  ref={pillsRef}
                  className={clsx(
                    'product-fragrance-filter-pills transition-[max-height] duration-200',
                    filterExpand.expanded && 'max-h-[999px] overflow-visible',
                    !filterExpand.expanded && isFilterSticky && 'product-fragrance-pills-sticky-clip',
                    !filterExpand.expanded && !isFilterSticky && 'max-h-none overflow-visible',
                  )}
                >
                  {ALL_BRANDS.map((brand) => {
                    const isActive = selectedBrand === brand;
                    return (
                      <motion.button
                        key={brand}
                        onClick={() => {
                          setSelectedBrand(brand);
                          if (filterExpand.expanded) setFilterExpand((prev) => ({ ...prev, expanded: false }));
                          setFilterReveal(true);
                          window.setTimeout(() => setFilterReveal(false), 600);
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className={clsx(
                          'product-fragrance-filter-pill border cursor-pointer outline-none transition-colors duration-200',
                          isActive ? 'product-fragrance-pill-active font-semibold shadow-sm' : 'product-fragrance-pill bg-transparent font-normal',
                        )}
                      >
                        {brand}
                      </motion.button>
                    );
                  })}
                </div>

                {/* 펼치기·접기 — 스티키 + 필터가 2줄 이상일 때 노출. 화면 크기 무관 */}
                {isFilterSticky && filterExpand.showToggle && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const wasExpanded = filterExpand.expanded;
                      setFilterExpand((prev) => ({ ...prev, expanded: !prev.expanded }));
                      setStickyFilterVisible(true);
                      if (wasExpanded) {
                        ignoreStickyUnstickRef.current = true;
                        window.setTimeout(() => {
                          ignoreStickyUnstickRef.current = false;
                        }, 400);
                      }
                    }}
                    className="action-btn action-btn--sm leading-none"
                    aria-expanded={filterExpand.expanded}
                  >
                    {filterExpand.expanded ? (
                      <><HiChevronUp className="shrink-0 mt-2"/>접기</>
                    ) : (
                      <><HiChevronDown className="shrink-0"/>펼치기</>
                    )}
                  </button>
                </div>
                )}
              </div>
              </div>
            </motion.div>

            {/* Card Grid */}
            <div className="product-box grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 pt-2 px-8 pb-8 max-w-[1440px] mx-auto">
              <AnimatePresence mode="popLayout">
                {filteredData.map((fragrance, index) => {
                  const isHovered = hoveredSlug === fragrance.slug;
                  const cardSliderIndex = cardSliderIndices[fragrance.slug] ?? 0;
                  const cols = Math.max(numColumns, 1);
                  const colIndex = index % cols;
                  const delay = colIndex * 0.08;

                  return (
                    <FragranceCardWrapper
                      key={fragrance.slug}
                      filterReveal={filterReveal}
                      delay={delay}
                      onHoverStart={() => setHoveredSlug(fragrance.slug)}
                      onHoverEnd={() => setHoveredSlug(null)}
                    >
                      <Link
                        href={`/fragrance/${fragrance.slug}`}
                        title={`${fragrance.brand} ${fragrance.name}`}
                        className="no-underline block"
                        scroll={true}
                      >
                        <motion.div
                          animate={{
                            boxShadow: isHovered
                              ? '0 16px 40px var(--color-shadow-hover), 0 0 0 1px rgba(200,180,255,0.31)'
                              : '0 2px 12px var(--color-shadow-soft)',
                            y: isHovered ? -5 : 0,
                          }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                          className="product-fragrance-card product-fragrance-card-layout group cursor-pointer"
                        >
                          {/* Image */}
                          <div className="card-image-slider-box product-fragrance-card-image-box">
                            {/* Glow — 라이트: 아이보리 / 다크: 라벤더 */}
                            <motion.div
                              animate={{ opacity: isHovered ? 0.55 : 0, scale: isHovered ? 1.1 : 0.8 }}
                              transition={{ duration: 0.35 }}
                              className="product-fragrance-glow absolute inset-[15%] rounded-full blur-[18px] z-0"
                            />
                            <motion.div
                              animate={{ scale: isHovered ? 1.05 : 1 }}
                              transition={{ duration: 0.35, ease: 'easeOut' }}
                              className="relative w-full h-full z-[1] group"
                            >
                              <ImageSlider
                                images={fragrance.images}
                                currentIndex={cardSliderIndex}
                                onSelectIndex={(index: number) =>
                                  setCardSliderIndices((prev) => ({
                                    ...prev,
                                    [fragrance.slug]: index,
                                  }))
                                }
                                alt={`${fragrance.brand} ${fragrance.name}`}
                                variant="compact"
                                stopPropagation
                                className="relative w-full h-full"
                                imageClassName="object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.13)]"
                                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 200px"
                              />
                            </motion.div>
                          </div>

                          {/* Text */}
                          <div className="text-center w-full">
                            <p className="product-fragrance-brand text-[0.68rem] font-medium tracking-[0.12em] uppercase mb-1">
                              {fragrance.brand}
                            </p>
                            <p className="product-fragrance-name text-[0.9rem] font-medium m-0 leading-[1.35]">
                              {fragrance.name}
                            </p>
                          </div>

                          {/* Hover line */}
                          <motion.div
                            animate={{ scaleX: isHovered ? 1 : 0, opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.25 }}
                            className="product-fragrance-accent-line w-6 h-px rounded-[1px] origin-center"
                          />
                        </motion.div>
                      </Link>
                    </FragranceCardWrapper>
                  );
                })}
              </AnimatePresence>
            </div>
            <div ref={inViewRef}>
              {isFetchingNextPage && (
                <div className="flex justify-center pb-8">
                  <CircularProgress aria-label="로딩중" />
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProductFragrance;
