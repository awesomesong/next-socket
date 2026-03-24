'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import ImageModal from '@/src/app/components/ImageModal';
import clsx from 'clsx';

const ON_THIS_PAGE = [
  { href: '#overview', label: 'Scent Memories란?' },
  { href: '#features', label: '주요 기능' },
  { href: '#preview', label: '반응형 레이아웃' },
  { href: '#howto', label: '로그인 · 데모 계정 안내' },
  { href: '#main-gallery', label: '메인 화면 & 시그니처 향수 갤러리' },
  { href: '#fragrance-guide', label: '향수 등록 가이드' },
  { href: '#fragrance-detail', label: '향수 상세 페이지 & 리뷰' },
  { href: '#notice-guide', label: '공지사항 열람 & 댓글 가이드' },
  { href: '#notice-write-guide', label: '공지사항 글쓰기 가이드' },
  { href: '#chat-move-guide', label: '채팅 화면으로 이동하기' },
  { href: '#chat-member-guide', label: '채팅 멤버 기능 가이드' },
  { href: '#chat-conversation-guide', label: '채팅 대화방 기능 가이드' },
  { href: '#chat-conversation-detail-guide', label: '대화방 상세 메뉴 & 읽음 표시' },
  { href: '#chat-ai-guide', label: '향수 AI 어시스턴트 채팅 가이드' },
  { href: '#ui-theme', label: 'UI 테마 (다크 / 라이트 모드)' },
] as const;

function getGuideSectionHead(sectionEl: HTMLElement): HTMLElement {
  return sectionEl.querySelector<HTMLElement>('[data-guide-section-head]') ?? sectionEl;
}

/** scroll-margin-top(--guide-scroll-offset) 기준으로 섹션 제목을 정렬.
 *  scrollIntoView는 실제 스크롤 컨테이너를 자동 탐지하므로 iOS/커스텀 컨테이너에서도 동작 */
function alignGuideSectionToOffset(el: HTMLElement) {
  const anchorEl = getGuideSectionHead(el);
  anchorEl.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
}

const guideCardSurfaceClass =
  'bg-[var(--guide-card-surface-bg)] border border-[var(--guide-card-surface-border)]';

const SectionLabel = memo(function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div
      data-guide-section-head
      className="mb-8"
      style={{ scrollMarginTop: 'var(--guide-scroll-offset)' }}
    >
      <p
        className="text-xs font-semibold tracking-[0.18em] uppercase mb-3 text-[var(--color-lavender)]"
      >
        {index}
      </p>
      <h2 className="text-xl font-bold">
        <span className="text-gradient-scent">{title}</span>
      </h2>
      <div className="mt-3 h-px w-12 [background:var(--bg-gradient-scent)]" />
    </div>
  );
});

type PreviewImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  zoomAlt?: string;
};

const DESKTOP_PREVIEW_DEFAULTS = {
  width: 900,
  height: 600,
  sizes: '(min-width: 768px) 900px, 100vw',
} as const;

const MOBILE_PREVIEW_DEFAULTS = {
  width: 320,
  height: 640,
  sizes: '(max-width: 767px) min(100vw, 300px), 360px',
} as const;

const previewMobileColumnClass =
  'max-md:w-full max-md:max-w-[min(100vw,300px)] max-md:self-start w-full md:flex-1 md:min-w-0 md:max-w-[min(100%,360px)]';

const previewMobileFrameClass = 'notice-preview-frame notice-preview-frame--fit-sm';

const ResponsivePreview = memo(function ResponsivePreview({
  desktop,
  mobile,
  openZoom,
  layout = 'responsive',
}: {
  desktop: PreviewImage;
  mobile: PreviewImage;
  openZoom: (src: string, alt: string) => () => void;
  layout?: 'responsive' | 'twin-mobile' | 'stacked';
}) {
  if (layout === 'stacked') {
    return (
      <div className="flex flex-col items-start gap-6 max-md:w-full">
        <div className="w-full">
          <p className="notice-preview__label">Desktop</p>
          <div className="notice-preview-frame">
            <button
              type="button"
              onClick={openZoom(desktop.src, desktop.zoomAlt ?? desktop.alt)}
              className="notice-preview-btn w-full"
              aria-label={`${desktop.zoomAlt ?? desktop.alt} 확대 보기`}
            >
              <Image
                src={desktop.src}
                alt={desktop.alt}
                width={desktop.width}
                height={desktop.height}
                sizes={desktop.sizes}
                className="notice-preview-img"
                // full-width로 키우되, 종횡비는 img의 intrinsic ratio를 그대로 사용
                style={{ width: '100%', height: 'auto' }}
              />
            </button>
          </div>
        </div>

        <div className="w-full">
          <p className="notice-preview__label">Mobile</p>
          <div className="notice-preview-frame">
            <button
              type="button"
              onClick={openZoom(mobile.src, mobile.zoomAlt ?? mobile.alt)}
              className="notice-preview-btn w-full"
              aria-label={`${mobile.zoomAlt ?? mobile.alt} 확대 보기`}
            >
              <Image
                src={mobile.src}
                alt={mobile.alt}
                width={mobile.width}
                height={mobile.height}
                sizes={mobile.sizes}
                className="notice-preview-img"
                style={{ width: '100%', height: 'auto' }}
              />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'twin-mobile') {
    const slots = [
      { img: desktop, label: 'Mobile 1' },
      { img: mobile, label: 'Mobile 2' },
    ] as const;
    return (
      <div className="flex flex-col items-start gap-4 max-md:w-full md:flex-row md:gap-3">
        {slots.map(({ img, label }, i) => (
          <div key={i} className={previewMobileColumnClass}>
            <p className="notice-preview__label">{label}</p>
            <div className={previewMobileFrameClass}>
              <button
                type="button"
                onClick={openZoom(img.src, img.zoomAlt ?? img.alt)}
                className="notice-preview-btn"
                aria-label={`${img.zoomAlt ?? img.alt} 확대 보기`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  sizes={img.sizes}
                  className="notice-preview-img"
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 max-md:w-full md:flex-row md:gap-3">
      <div className="w-full max-md:max-w-full md:flex-[2_1_0%] md:min-w-0">
        <p className="notice-preview__label">Desktop</p>
        <div className="notice-preview-frame">
          <button
            type="button"
            onClick={openZoom(desktop.src, desktop.zoomAlt ?? desktop.alt)}
            className="notice-preview-btn"
            aria-label={`${desktop.zoomAlt ?? desktop.alt} 확대 보기`}
          >
            <Image
              src={desktop.src}
              alt={desktop.alt}
              width={desktop.width}
              height={desktop.height}
              sizes={desktop.sizes}
              className="notice-preview-img"
            />
          </button>
        </div>
      </div>

      <div className={previewMobileColumnClass}>
        <p className="notice-preview__label">Mobile</p>
        <div className={previewMobileFrameClass}>
          <button
            type="button"
            onClick={openZoom(mobile.src, mobile.zoomAlt ?? mobile.alt)}
            className="notice-preview-btn"
            aria-label={`${mobile.zoomAlt ?? mobile.alt} 확대 보기`}
          >
            <Image
              src={mobile.src}
              alt={mobile.alt}
              width={mobile.width}
              height={mobile.height}
              sizes={mobile.sizes}
              className="notice-preview-img"
            />
          </button>
        </div>
      </div>
    </div>
  );
});

export type FragranceGuideStep = {
  step: string;
  title: string;
  desc: string;
  webImg: { src: string; alt: string };
  mobileImg: { src: string; alt: string };
  twinMobilePreview?: boolean;
};

function StepGuideSection({
  id,
  index,
  title,
  intro,
  steps,
  openZoom,
}: {
  id: string;
  index: string;
  title: string;
  intro: ReactNode;
  steps: FragranceGuideStep[];
  openZoom: (src: string, alt: string) => () => void;
}) {
  return (
    <section id={id} className="scroll-mt-[var(--guide-scroll-offset)]">
      <SectionLabel index={index} title={title} />
      <div className="guide-section-intro">{intro}</div>
      <div className="space-y-12">
        {steps.map(
          ({ step, title: stepTitle, desc, webImg, mobileImg, twinMobilePreview }) => (
            <div key={step}>
              <div className="flex gap-3">
                <div className="shrink-0 pt-[2px]">
                  <span
                    className={clsx(
                      'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold',
                      'text-[var(--color-ivory)] [background:var(--bg-gradient-scent)]',
                      'dark:text-[var(--color-lavender-light)] dark:[background:var(--color-lavender-pale)] dark:border dark:border-[var(--color-lavender-border)]',
                    )}
                  >
                    {step}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-left mb-2 text-[var(--color-text-primary)]">
                    {stepTitle}
                  </p>
                  <p className="text-xs leading-relaxed mb-4 text-left text-[var(--color-text-secondary)]">
                    {desc}
                  </p>
                  <ResponsivePreview
                    openZoom={openZoom}
                    layout={twinMobilePreview ? 'twin-mobile' : 'responsive'}
                    desktop={{
                      ...(twinMobilePreview ? MOBILE_PREVIEW_DEFAULTS : DESKTOP_PREVIEW_DEFAULTS),
                      src: webImg.src,
                      alt: webImg.alt,
                    }}
                    mobile={{
                      ...MOBILE_PREVIEW_DEFAULTS,
                      src: mobileImg.src,
                      alt: mobileImg.alt,
                    }}
                  />
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

export type loginStep = {
  step: string;
  title: string;
  desc: string;
  image?: { src: string; alt: string };
};

export type MainGalleryGuide = {
  title: string;
  desc: ReactNode[];
  webImg: { src: string; alt: string };
  mobileImg: { src: string; alt: string };
};

type GuideContentProps = {
  features: { icon: string; title: string; desc: string }[];
  steps: loginStep[];
  techStack: { category: string; items: string[] }[];
  fragranceGuideSteps: FragranceGuideStep[];
  fragranceDetailSteps: FragranceGuideStep[];
  noticeGuideSteps: FragranceGuideStep[];
  noticeWriteGuideSteps: FragranceGuideStep[];
  chatMoveGuideSteps: FragranceGuideStep[];
  chatMemberGuideSteps: FragranceGuideStep[];
  chatConversationGuideSteps: FragranceGuideStep[];
  chatDetailSteps: FragranceGuideStep[];
  chatAiGuideSteps: FragranceGuideStep[];
  mainGalleryGuide: MainGalleryGuide;
};

export default function GuideContent({
  features,
  steps,
  techStack,
  fragranceGuideSteps,
  fragranceDetailSteps,
  noticeGuideSteps,
  noticeWriteGuideSteps,
  chatMoveGuideSteps,
  chatMemberGuideSteps,
  chatConversationGuideSteps,
  chatDetailSteps,
  chatAiGuideSteps,
  mainGalleryGuide,
}: GuideContentProps) {
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  const [isOnThisPageSticky, setIsOnThisPageSticky] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const onThisPageSentinelRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const pickActiveRef = useRef<() => void>(() => {});
  const guideMainColumnRef = useRef<HTMLDivElement>(null);
  /** --guide-scroll-offset CSS 변수를 실제 px 값으로 읽기 위한 측정용 요소 */
  const scrollOffsetRef = useRef<HTMLDivElement>(null);
  /** 사용자 클릭 이후에는 초기 해시 동기화 재정렬을 막아 점프를 방지 */
  const hasUserNavigatedRef = useRef(false);
  /** 클릭으로 이동한 섹션 타이틀을 레이아웃 변화 중에 계속 고정 */
  const pinnedSectionIdRef = useRef<string | null>(null);
  /** 모바일 sticky TOC aside — 높이 변화 시 scroll 보정용 */
  const asideRef = useRef<HTMLElement | null>(null);

  const closeZoom = useCallback(() => setZoomedImage(null), []);
  const openZoom = useCallback(
    (src: string, alt: string) => () => setZoomedImage({ src, alt }),
    []);

  const handleOnThisPageClick = useCallback((sectionId: string) => {
    hasUserNavigatedRef.current = true;
    pinnedSectionIdRef.current = sectionId;
    const sectionEl = document.getElementById(sectionId);
    if (!sectionEl) return;
    window.history.replaceState(null, '', `#${sectionId}`);
    alignGuideSectionToOffset(sectionEl);
    pickActiveRef.current();
  }, []);

  useEffect(() => {
    const sentinel = onThisPageSentinelRef.current;
    if (!sentinel) return;
    const media = window.matchMedia('(max-width: 1023px)');
    const update = (entry: IntersectionObserverEntry | null, isNarrow: boolean) => {
      setIsOnThisPageSticky(isNarrow && entry !== null && !entry.isIntersecting);
    };
    const updateFromLayout = (isNarrow: boolean) => {
      if (!isNarrow) {
        setIsOnThisPageSticky(false);
        return;
      }
      const rect = sentinel.getBoundingClientRect();
      const isIntersecting = rect.top >= 0 && rect.top <= window.innerHeight;
      setIsOnThisPageSticky(!isIntersecting);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) update(entry, media.matches);
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' },
    );
    const onResize = () => {
      if (!media.matches) {
        observer.unobserve(sentinel);
        setIsOnThisPageSticky(false);
        return;
      }
      observer.observe(sentinel);
      updateFromLayout(true);
    };
    if (media.matches) {
      observer.observe(sentinel);
      updateFromLayout(true);
    }
    media.addEventListener('change', onResize);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', onResize);
    };
  }, []);

  useEffect(() => {
    const sectionIds = ON_THIS_PAGE.map((item) => item.href.replace('#', ''));

    /** 기준선은 섹션 제목(head) 기준 — 긴 섹션에서도 목차 하이라이트가 제목 전환에 맞춤 */
    const pickActive = () => {
      const marginPx = scrollOffsetRef.current?.offsetHeight ?? 80;
      let next = '';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = getGuideSectionHead(el).getBoundingClientRect().top;
        if (top > marginPx + 2) break;
        next = id;
      }
      setActiveId(next);
    };

    pickActiveRef.current = pickActive;

    let raf = 0;
    const schedulePick = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        pickActive();
      });
    };

    let roRaf = 0;
    const onResize = () => {
      if (roRaf) cancelAnimationFrame(roRaf);
      roRaf = window.requestAnimationFrame(() => {
        roRaf = 0;
        // 이미지 로드 또는 aside 높이 변화(sticky 전환)로 레이아웃이 흔들릴 때 pinned 섹션 보정
        const pinnedId = pinnedSectionIdRef.current;
        if (pinnedId) {
          const pinnedEl = document.getElementById(pinnedId);
          if (pinnedEl) {
            const marginPx = scrollOffsetRef.current?.offsetHeight ?? 80;
            const anchorTop = getGuideSectionHead(pinnedEl).getBoundingClientRect().top;
            const tolerancePx = Math.max(4, Math.round(window.innerHeight * 0.005));
            if (Math.abs(anchorTop - marginPx) > tolerancePx) {
              // scrollIntoView 대신 delta 보정 사용: 전체 재스크롤로 인한 깜박임 방지
              // html,body { height:100%; overflow-y:auto } 환경에서 body가 스크롤 컨테이너
              document.body.scrollBy(0, anchorTop - marginPx);
            }
          }
        }
        pickActiveRef.current();
      });
    };
    const ro = new ResizeObserver(onResize);
    const mainCol = guideMainColumnRef.current;
    if (mainCol) ro.observe(mainCol);
    // aside 높이 변화도 감시: isOnThisPageSticky 전환 시 aside가 줄어들며 메인 컬럼 위치가 밀림
    const asideEl = asideRef.current;
    if (asideEl) ro.observe(asideEl);

    pickActive();

    const syncHashAfterLayout = () => {
      if (hasUserNavigatedRef.current) return;
      const h = window.location.hash.slice(1);
      if (!h) return;
      const el = document.getElementById(h);
      if (el) alignGuideSectionToOffset(el);
      pickActive();
    };
    requestAnimationFrame(syncHashAfterLayout);

    const scrollEl = document.scrollingElement;
    const clearPinnedSection = () => {
      pinnedSectionIdRef.current = null;
    };
    window.addEventListener('scroll', schedulePick, { passive: true });
    // html,body { height:100%; overflow-y:auto } 환경에서 body가 스크롤 컨테이너이므로 직접 등록
    document.body.addEventListener('scroll', schedulePick, { passive: true });
    if (scrollEl && scrollEl !== document.body) {
      scrollEl.addEventListener('scroll', schedulePick, { passive: true });
    }
    // 사용자가 직접 스크롤을 시작하면 고정 상태를 해제합니다.
    window.addEventListener('wheel', clearPinnedSection, { passive: true });
    // touchmove: 탭(tap)이 아닌 실제 스크롤 제스처에만 해제 (touchstart 시 pinnedSection이 click보다 먼저 지워지는 버그 방지)
    window.addEventListener('touchmove', clearPinnedSection, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('scroll', schedulePick, { passive: true });
      vv.addEventListener('resize', schedulePick);
    }
    window.addEventListener('resize', schedulePick);
    window.addEventListener('hashchange', schedulePick);
    return () => {
      window.removeEventListener('scroll', schedulePick);
      document.body.removeEventListener('scroll', schedulePick);
      if (scrollEl && scrollEl !== document.body) scrollEl.removeEventListener('scroll', schedulePick);
      window.removeEventListener('wheel', clearPinnedSection);
      window.removeEventListener('touchmove', clearPinnedSection);
      if (vv) {
        vv.removeEventListener('scroll', schedulePick);
        vv.removeEventListener('resize', schedulePick);
      }
      window.removeEventListener('resize', schedulePick);
      window.removeEventListener('hashchange', schedulePick);
      if (ro) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (roRaf) cancelAnimationFrame(roRaf);
    };
  }, []);

  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const nav = navRef.current;
    const activeItem = nav.querySelector<HTMLButtonElement>(
      `button[data-guide-section-id="${activeId}"]`,
    );
    if (activeItem) {
      const scrollLeft = activeItem.offsetLeft - nav.offsetWidth / 2 + activeItem.offsetWidth / 2;
      nav.scrollLeft = scrollLeft;
    }
  }, [activeId]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onWheel = (e: WheelEvent) => {
      if (!window.matchMedia('(max-width: 1023px)').matches) return;
      if (nav.scrollWidth <= nav.clientWidth) return;
      const delta = e.deltaX + e.deltaY;
      if (delta === 0) return;
      nav.scrollLeft += delta;
      e.preventDefault();
      e.stopPropagation();
    };
    nav.addEventListener('wheel', onWheel, { passive: false });
    return () => nav.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 md:px-8 md:py-12">
      <ImageModal
        src={zoomedImage?.src ?? ''}
        isOpen={!!zoomedImage}
        onClose={closeZoom}
        alt={zoomedImage?.alt ?? '이미지'}
      />
      {/* --guide-scroll-offset CSS 변수를 실제 px로 측정하기 위한 숨김 요소 */}
      <div
        ref={scrollOffsetRef}
        aria-hidden="true"
        className="fixed top-0 left-0 w-0 overflow-hidden invisible pointer-events-none h-[var(--guide-scroll-offset)]"
      />

      {/* ── 히어로 ── */}
      <section className="mb-12">
        <h1 className="font-josefin text-3xl font-light tracking-tight leading-[1.15] mb-2">
          <span className="text-gradient-scent italic">Scent</span>
          <br />
          <span className="text-gradient-memories">Memories</span>
        </h1>

        <p
          className="mt-4 text-base md:text-lg font-light tracking-wide text-[var(--color-text-secondary)]"
        >
          소개 및 이용 안내
        </p>

        <div
          className="mt-8 h-px w-full max-w-xs [background:linear-gradient(90deg,var(--color-lavender-border)_0%,transparent_100%)]"
        />

        <div
          className="mt-6 flex items-center gap-3 text-xs text-[var(--color-text-secondary)]"
        >
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold shrink-0 [background:var(--bg-gradient-scent)]"
          >
            강
          </span>
          <span>강송희</span>
          <span
            className="w-px h-3 bg-[var(--color-lavender-border)]"
          />
          <span>Frontend Developer</span>
          <span
            className="w-px h-3 bg-[var(--color-lavender-border)]"
          />
          <span>포트폴리오</span>
        </div>
      </section>

      {/* Tech Stack */}
      <div className={clsx('rounded-2xl p-6 mb-12', guideCardSurfaceClass)}>
        <p
          className="text-sm font-semibold tracking-[0.16em] uppercase mb-4 text-[var(--color-lavender)]"
        >
          Tech Stack
        </p>
        <div className="space-y-3.5">
          {techStack.map(({ category, items }) => (
            <div key={category} className="flex gap-3 items-start">
              <span
                className="inline-flex items-center min-h-[1.625rem] text-[10px] font-semibold uppercase tracking-wider w-24 shrink-0 leading-none text-[var(--color-lavender-muted)] dark:text-[var(--color-lavender-light)]"
              >
                {category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center justify-center min-h-[1.625rem] text-[11px] leading-none px-2.5 py-1 rounded-full bg-[var(--color-lavender-pale)] text-[var(--color-text-primary)] border border-transparent dark:border-[var(--color-lavender-border)] dark:border-opacity-60"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* 스티키 감지용: 헤더 높이만큼 위로 올려서, aside가 sticky 되는 순간과 정확히 일치시킴 */}
        <div
          ref={onThisPageSentinelRef}
          className="absolute w-full h-0 pointer-events-none"
          style={{ top: 'calc(var(--header-height) * -1)' }}
          aria-hidden
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          <div
            ref={guideMainColumnRef}
            className="space-y-20 order-2 lg:order-1 pb-[min(45vh,22rem)]"
          >

            <section id="overview" className="scroll-mt-[var(--guide-scroll-offset)]">
              <SectionLabel index="01" title="Scent Memories란?" />
              <div
                className="space-y-4 text-sm leading-[1.9] text-[var(--color-text-primary)]"
              >
                <p>
                  <strong>Scent Memories</strong>는 향수를 사랑하는 사람들이 모여 시향 기록을 남기고
                  자유롭게 소통하는 커뮤니티입니다. 향수 정보를 일일이 찾아 기록하는 번거로움을 줄이기 위해
                  AI 이미지 분석 기술을 도입했습니다.<br/>
                  향수 사진을 업로드하면 제품 정보가 등록 폼에 자동 입력되며, 사용자는 AI가 추출한 정보를 확인하고 필요한 부분만 수정하여 빠르게 기록을 마칠 수 있습니다.<br/>
                  아래 가이드에서는 주요 기능과 로그인부터 채팅(사용자/AI 어시스턴트)의 이용 순서를 정리해 두었습니다. <br/>
                  자세한 내용을 아래의 각 섹션에서 확인할 수 있습니다.
                </p>
              </div>
            </section>

            <section id="features" className="scroll-mt-[var(--guide-scroll-offset)]">
              <SectionLabel index="02" title="주요 기능" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className={clsx(
                      'group rounded-2xl p-5 transition-all duration-300',
                      guideCardSurfaceClass,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base [background:linear-gradient(135deg,var(--color-lavender-pale)_0%,var(--color-ivory-soft)_100%)]"
                      >
                        {icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold mb-1.5 text-[var(--color-text-primary)]">
                          {title}
                        </p>
                        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                          {desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="preview" className="scroll-mt-[var(--guide-scroll-offset)]">
              <SectionLabel index="03" title="반응형 레이아웃" />
              <p className="guide-section-intro mb-8">
                데스크탑과 모바일 환경 모두에 최적화된 반응형 레이아웃을 제공합니다.
              </p>
              <ResponsivePreview
                openZoom={openZoom}
                layout="stacked"
                desktop={{
                  src: '/image/notice/main/main_web.png',
                  alt: '데스크탑 화면 — 향수 컬렉션',
                  zoomAlt: '데스크탑 화면 — 향수 컬렉션',
                  width: 900,
                  height: 700,
                  sizes: '(min-width: 768px) 900px, 100vw',
                }}
                mobile={{
                  ...MOBILE_PREVIEW_DEFAULTS,
                  src: '/image/notice/main/main_mobile.png',
                  alt: '모바일 화면 — 향수 컬렉션',
                  zoomAlt: '모바일 화면 — 향수 컬렉션',
                }}
              />
            </section>

            <section id="howto" className="scroll-mt-[var(--guide-scroll-offset)]">
              <SectionLabel index="04" title="로그인 · 데모 계정 안내" />
              <p className="guide-section-intro">
                회원가입 없이도 향수 목록과 공지사항을 자유롭게 열람할 수 있으며, 향수 등록 및 채팅 기능을 이용하려면 로그인이 필요합니다.
                <br/>
                별도 회원가입 없이 바로 체험 가능한 데모 계정을 제공합니다.
              </p>
              <ol className="relative space-y-0">
                {steps.map(({ step, title, desc, image }, i) => (
                  <li key={step} className="flex gap-5 group">
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white z-10 shrink-0 [background:var(--bg-gradient-scent)]"
                      >
                        {step}
                      </span>
                      {i < steps.length - 1 && (
                        <div
                          className="w-px flex-1 my-1 [background:linear-gradient(180deg,var(--color-lavender-border)_0%,transparent_100%)] min-h-[32px]"
                        />
                      )}
                    </div>
                    <div className={`pb-8 ${i === steps.length - 1 ? 'pb-0' : ''}`}>
                      <p className="text-sm font-semibold mb-1.5 mt-1 text-[var(--color-text-primary)]">
                        {title}
                      </p>
                      <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                        {desc}
                      </p>
                      {image && (
                        <div className="mt-4 w-[180px] sm:w-[220px]">
                          <div className="notice-preview-frame">
                            <button
                              type="button"
                              onClick={openZoom(image.src, image.alt)}
                              className="notice-preview-btn"
                              aria-label={`${image.alt} 확대 보기`}
                            >
                              <Image
                                src={image.src}
                                alt={image.alt}
                                width={300}
                                height={580}
                                sizes="(min-width: 640px) 220px, 180px"
                                className="notice-preview-img"
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="main-gallery" className="scroll-mt-[var(--guide-scroll-offset)]">
              <SectionLabel index="05" title="메인 화면 & 시그니처 향수 갤러리" />
              <div className="space-y-4 mb-8 text-sm leading-[1.8] text-[var(--color-text-secondary)] break-keep">
                {mainGalleryGuide.desc.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <ResponsivePreview
                openZoom={openZoom}
                layout="stacked"
                desktop={{
                  src: mainGalleryGuide.webImg.src,
                  alt: mainGalleryGuide.webImg.alt,
                  width: 900,
                  height: 650,
                  sizes: '(min-width: 768px) 900px, 100vw',
                }}
                mobile={{
                  ...MOBILE_PREVIEW_DEFAULTS,
                  height: 650,
                  src: mainGalleryGuide.mobileImg.src,
                  alt: mainGalleryGuide.mobileImg.alt,
                }}
              />
            </section>

            <StepGuideSection
              id="fragrance-guide"
              index="06"
              title="향수 등록 가이드"
              intro="로그인 후에 향수를 직접 등록할 수 있습니다. 이미지를 업로드하면 AI가 향수 정보를 자동으로 분석하여 브랜드, 이름, 설명, 노트 필드를 채워줍니다."
              steps={fragranceGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="fragrance-detail"
              index="07"
              title="향수 상세 페이지 & 리뷰"
              intro="향수 상세 페이지에서는 향수의 정보(이미지·브랜드·이름·설명·노트)와 함께 다른 사용자가 남긴 리뷰를 확인할 수 있습니다. 로그인한 사용자는 직접 리뷰를 남기거나 수정·삭제할 수 있습니다."
              steps={fragranceDetailSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="notice-guide"
              index="08"
              title="공지사항 열람 & 댓글 가이드"
              intro='상단 "Notice" 메뉴에서 공지사항 목록을 확인할 수 있습니다. 누구나 열람할 수 있으며, 로그인한 사용자는 댓글 작성이 가능합니다.'
              steps={noticeGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="notice-write-guide"
              index="09"
              title="공지사항 글쓰기 가이드"
              intro="로그인한 사용자는 우측 상단의 글쓰기 버튼을 활성화하여 직접 새로운 공지사항을 작성하고 서식을 꾸밀 수 있습니다."
              steps={noticeWriteGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-move-guide"
              index="10"
              title="채팅 화면으로 이동하기"
              intro="Scent Memories에서 다른 사용자들과 채팅할 수 있습니다. 채팅 멤버 목록이나 대화방 목록으로 이동하는 두 가지 방법을 안내합니다."
              steps={chatMoveGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-member-guide"
              index="11"
              title="채팅 멤버 기능 가이드"
              intro="채팅의 멤버 탭에서 다양한 대화 기능을 이용할 수 있습니다. 멤버를 클릭해 1:1 대화를 시작하거나, 우측 상단 메뉴(⋮)를 통해 단체 채팅방 만들기, AI 채팅, 다크/라이트 모드 변경이 가능합니다."
              steps={chatMemberGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-conversation-guide"
              index="12"
              title="채팅 대화방 기능 가이드"
              intro="채팅의 대화방 탭에서 진행되는 모든 대화 기능을 안내합니다. 단체 채팅방 생성부터 실시간 메시지 전송, 대화방 목록 관리까지 순서대로 확인하세요."
              steps={chatConversationGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-conversation-detail-guide"
              index="13"
              title="대화방 상세 메뉴 & 읽음 표시"
              intro={<>대화방 채팅창 내에서 이용할 수 있는 <strong>상세 메뉴(⋮)</strong>와 <strong>읽음 표시</strong> 기능을 안내합니다.</>}
              steps={chatDetailSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-ai-guide"
              index="14"
              title="향수 AI 어시스턴트 채팅 가이드"
              intro="향수 AI 어시스턴트와 대화할 수 있는 AI 채팅 기능을 안내합니다."
              steps={chatAiGuideSteps}
              openZoom={openZoom}
            />

            <section id="ui-theme" className="scroll-mt-[var(--guide-scroll-offset)]">
              <SectionLabel index="15" title="UI 테마 (다크 / 라이트 모드)" />
              <div className="space-y-3 text-sm leading-[1.8] text-[var(--color-text-secondary)] mb-8 break-keep">
                <p>
                  Scent Memories는 <strong className="text-[var(--color-text-primary)]">시스템 설정을 자동으로 감지</strong>하여 첫 접속 시 테마를 적용합니다.
                  기기가 다크 모드로 설정되어 있으면 처음부터 다크 모드로, 라이트 모드로 설정되어 있으면 라이트 모드로 표시됩니다.
                </p>
                <p>
                  테마는 <strong className="text-[var(--color-text-primary)]">상단 네비게이션 우측의 아이콘 버튼</strong>으로 언제든지 직접 전환할 수 있습니다.
                </p>
                <ul className="space-y-1.5 mt-3 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 text-base">☀️</span>
                    <span><strong className="text-[var(--color-text-primary)]">다크 모드</strong>에서는 해 모양(☀️) 아이콘을 클릭하면 <strong className="text-[var(--color-text-primary)]">라이트 모드</strong>로 전환됩니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 text-base">🌙</span>
                    <span><strong className="text-[var(--color-text-primary)]">라이트 모드</strong>에서는 달 모양(🌙) 아이콘을 클릭하면 <strong className="text-[var(--color-text-primary)]">다크 모드</strong>로 전환됩니다.</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="notice-preview__label">다크 모드</p>
                  <div className="notice-preview-frame">
                    <button
                      type="button"
                      onClick={openZoom('/image/notice/UI_Theme/dark_mode.png', '다크 모드 화면')}
                      className="notice-preview-btn"
                      aria-label="다크 모드 화면 확대 보기"
                    >
                      <Image
                        src="/image/notice/UI_Theme/dark_mode.png"
                        alt="다크 모드 화면 — 해 모양 아이콘 클릭 시 라이트 모드로 전환"
                        width={900}
                        height={600}
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="notice-preview-img"
                      />
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--color-text-secondary)] text-center">
                    ☀️ 해 아이콘 클릭 → 라이트 모드로 전환
                  </p>
                </div>
                <div>
                  <p className="notice-preview__label">라이트 모드</p>
                  <div className="notice-preview-frame">
                    <button
                      type="button"
                      onClick={openZoom('/image/notice/UI_Theme/light_mode.png', '라이트 모드 화면')}
                      className="notice-preview-btn"
                      aria-label="라이트 모드 화면 확대 보기"
                    >
                      <Image
                        src="/image/notice/UI_Theme/light_mode.png"
                        alt="라이트 모드 화면 — 달 모양 아이콘 클릭 시 다크 모드로 전환"
                        width={900}
                        height={600}
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="notice-preview-img"
                      />
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-[var(--color-text-secondary)] text-center">
                    🌙 달 아이콘 클릭 → 다크 모드로 전환
                  </p>
                </div>
              </div>
            </section>

          </div>

          <aside
            ref={asideRef}
            className={clsx(
              'transition-all duration-300 ease-in-out',
              'order-1 lg:order-2 sticky z-30 top-[var(--header-height)] lg:top-[calc(var(--header-height)+1.25rem)]',
              'lg:flex lg:flex-col lg:max-h-[calc(100dvh-var(--header-height)-1.25rem)] lg:pb-5',
              isOnThisPageSticky && 'max-lg:w-screen max-lg:max-w-none max-lg:ml-[calc(50%-50vw)]',
            )}
          >
            <div
              className={clsx(
                'transition-all duration-300 ease-in-out',
                'lg:flex lg:flex-col lg:min-h-0 lg:p-6 w-full',
                'rounded-2xl border border-[var(--color-lavender-border)]',
                isOnThisPageSticky
                  ? 'max-lg:rounded-none max-lg:border-0 max-lg:border-b max-lg:border-[var(--header-border)] max-lg:bg-[var(--header-bg)] max-lg:backdrop-blur-md max-lg:py-1.5 max-lg:px-4 max-lg:md:px-8 max-lg:max-w-[1440px] max-lg:mx-auto'
                  : 'max-lg:py-2 max-lg:px-3 max-lg:md:py-2.5 max-lg:md:px-4 [background:linear-gradient(135deg,rgba(176,148,224,0.06)_0%,transparent_100%)]',
              )}
            >
              <p
                className={clsx(
                  'transition-all duration-300 ease-in-out',
                  'font-semibold uppercase text-[var(--color-lavender)] text-[10px] tracking-[0.08em] lg:shrink-0 lg:text-[11px] lg:tracking-[0.16em] lg:mb-4',
                  isOnThisPageSticky ? 'max-lg:mb-1' : 'max-lg:mb-1.5',
                )}
              >
                On this page
              </p>
              <nav
                ref={navRef}
                className="guide-on-this-page-nav overflow-x-auto overflow-y-hidden max-lg:touch-pan-x max-lg:overscroll-x-contain max-lg:overscroll-y-none lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-0 max-lg:pb-0 max-lg:select-none"
              >
                <ol className="flex gap-1 min-w-max lg:flex-col lg:min-w-0 lg:gap-2.5">
                  {ON_THIS_PAGE.map(({ href, label }) => {
                    const sectionId = href.replace('#', '');
                    const isActive = activeId === sectionId;
                    return (
                      <li key={href} className="shrink-0 lg:shrink">
                        <button
                          type="button"
                          data-guide-section-id={sectionId}
                          aria-current={isActive ? 'location' : undefined}
                          onClick={() => handleOnThisPageClick(sectionId)}
                          className={clsx(
                            // 공통 — 버튼 리셋 + <a>와 동일 시각
                            "border-0 bg-transparent p-0 cursor-pointer text-inherit font-inherit text-left w-full",
                            "transition-all inline-flex items-center hover:opacity-70",
                            // 모바일 전용 (max-lg) — 테두리 없이 배경으로만 구분
                            "max-lg:touch-manipulation max-lg:text-[0.72rem] max-lg:leading-none max-lg:tracking-[0.04em] max-lg:gap-1 max-lg:py-[0.3rem] max-lg:px-2.5 max-lg:rounded-full max-lg:whitespace-nowrap",
                            // 데스크톱 전용 (lg)
                            "lg:text-xs lg:leading-normal lg:gap-2 lg:py-0 lg:px-0 lg:whitespace-normal",
                            // 활성 상태
                            isActive
                              ? [
                                  // 모바일: 사이드바 상태 배경(디자인 시스템) + 기본 텍스트
                                  "max-lg:bg-[var(--color-sidebar-state-bg)] max-lg:text-[var(--color-text-primary)] max-lg:font-medium",
                                  // 데스크톱: lavender 텍스트 + 세미볼드
                                  "lg:text-[var(--color-lavender)] lg:font-semibold",
                                ]
                              : [
                                  // 모바일: 매우 연한 배경 + 보조 텍스트
                                  "max-lg:bg-[var(--color-sidebar-state-bg)]/40 max-lg:text-[var(--color-text-secondary)]",
                                  // 데스크톱: 보조 텍스트
                                  "lg:text-[var(--color-text-secondary)]",
                                ]
                          )}
                        >
                          <span className={clsx(
                            "w-1 h-1 rounded-full shrink-0 lg:inline",
                            isActive
                              ? "bg-[var(--color-lavender)]"
                              : "bg-[var(--color-text-secondary)] opacity-40 lg:opacity-70"
                          )} />
                          <span className="max-lg:translate-y-px">{label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
