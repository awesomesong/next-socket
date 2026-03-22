'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode, WheelEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ImageModal from '@/src/app/components/ImageModal';
import clsx from 'clsx';

const ON_THIS_PAGE = [
  { href: '#overview', label: 'Scent Memories란?' },
  { href: '#preview', label: '화면 미리보기' },
  { href: '#features', label: '주요 기능' },
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
  { href: '#howto', label: '이용 방법' },
] as const;

const guideCardSurfaceClass =
  'bg-[var(--guide-card-surface-bg)] border border-[var(--guide-card-surface-border)]';

const SectionLabel = memo(function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-8">
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
  width: 300,
  height: 600,
  sizes: '(min-width: 768px) 128px, 100vw',
} as const;

const ResponsivePreview = memo(function ResponsivePreview({
  desktop,
  mobile,
  openZoom,
}: {
  desktop: PreviewImage;
  mobile: PreviewImage;
  openZoom: (src: string, alt: string) => () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4 max-md:w-full md:flex-row md:gap-3">
      <div className="w-full max-md:max-w-full md:flex-1 md:min-w-0">
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

      <div className="w-full max-md:max-w-full md:w-[220px] md:basis-[128px] md:flex-none">
        <p className="notice-preview__label">Mobile</p>
        <div className="notice-preview-frame">
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
    <section id={id} className="scroll-mt-24">
      <SectionLabel index={index} title={title} />
      <div className="text-xs mb-8 leading-relaxed text-[var(--color-text-secondary)]">
        {intro}
      </div>
      <div className="space-y-12">
        {steps.map(({ step, title: stepTitle, desc, webImg, mobileImg }) => (
          <div key={step}>
            <div className="flex gap-3">
              <div className="shrink-0 pt-[2px]">
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white [background:var(--bg-gradient-scent)]"
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
                  desktop={{
                    ...DESKTOP_PREVIEW_DEFAULTS,
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
        ))}
      </div>
    </section>
  );
}

export type IntroStep = {
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
  steps: IntroStep[];
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
  const isDraggingNavRef = useRef(false);
  const navDragStartXRef = useRef(0);
  const navDragStartScrollLeftRef = useRef(0);

  const closeZoom = useCallback(() => setZoomedImage(null), []);
  const openZoom = useCallback(
    (src: string, alt: string) => () => setZoomedImage({ src, alt }),
    []);

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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -50% 0px' }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const nav = navRef.current;
    // li > a
    const activeItem = nav.querySelector<HTMLAnchorElement>(`a[href="#${activeId}"]`);
    if (activeItem) {
      const scrollLeft = activeItem.offsetLeft - nav.offsetWidth / 2 + activeItem.offsetWidth / 2;
      nav.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeId]);

  const isNarrowScreen = useCallback(() => window.matchMedia('(max-width: 1023px)').matches, []);

  const handleNavWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    const nav = navRef.current;
    if (!nav || !isNarrowScreen() || nav.scrollWidth <= nav.clientWidth) return;
    const horizontalDelta = event.deltaX + event.deltaY;
    if (horizontalDelta === 0) return;
    nav.scrollLeft += horizontalDelta;
    event.preventDefault();
    event.stopPropagation();
  }, [isNarrowScreen]);

  const handleNavMouseDown = useCallback((event: MouseEvent<HTMLElement>) => {
    const nav = navRef.current;
    if (!nav || !isNarrowScreen() || nav.scrollWidth <= nav.clientWidth) return;
    if (event.button !== 0) return;
    isDraggingNavRef.current = true;
    navDragStartXRef.current = event.clientX;
    navDragStartScrollLeftRef.current = nav.scrollLeft;
    event.preventDefault();
  }, [isNarrowScreen]);

  const handleNavMouseMove = useCallback((event: MouseEvent<HTMLElement>) => {
    const nav = navRef.current;
    if (!nav || !isDraggingNavRef.current || !isNarrowScreen()) return;
    const deltaX = event.clientX - navDragStartXRef.current;
    nav.scrollLeft = navDragStartScrollLeftRef.current - deltaX;
    event.preventDefault();
  }, [isNarrowScreen]);

  const endNavMouseDrag = useCallback(() => {
    isDraggingNavRef.current = false;
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 md:px-8 md:py-12">
      <ImageModal
        src={zoomedImage?.src ?? ''}
        isOpen={!!zoomedImage}
        onClose={closeZoom}
        alt={zoomedImage?.alt ?? '이미지'}
      />

      {/* ── 히어로 ── */}
      <section className="mb-16 md:mb-24">
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
      <div className={clsx('rounded-2xl p-6 mb-8', guideCardSurfaceClass)}>
        <p
          className="text-[11px] font-semibold tracking-[0.16em] uppercase mb-2 text-[var(--color-lavender)]"
        >
          Tech Stack
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mb-5 leading-relaxed">
          이 프로젝트에서 사용한 주요 기술과 도구입니다. 풀스택·실시간·AI 연동까지 실제 서비스 수준으로 구성했습니다.
        </p>
        <div className="space-y-3.5">
          {techStack.map(({ category, items }) => (
            <div key={category} className="flex gap-3 items-start">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider w-24 shrink-0 mt-0.5 leading-snug text-[var(--color-lavender-muted)] dark:text-[var(--color-lavender-light)]"
              >
                {category}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <span
                    key={item}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--color-lavender-pale)] text-[var(--color-text-primary)] border border-transparent dark:border-[var(--color-lavender-border)] dark:border-opacity-60"
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
          <div className="space-y-20 order-2 lg:order-1">

            <section id="overview" className="scroll-mt-24">
              <SectionLabel index="01" title="Scent Memories란?" />
              <div
                className="space-y-4 text-sm leading-[1.9] text-[var(--color-text-primary)]"
              >
                <p>
                  <strong>Scent Memories</strong>는 사용자가 좋아하는 향수를{' '}
                  <strong>탐색하고, 기록하고, 공유</strong>할 수 있는 향수
                  아카이브 서비스입니다.
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  향수의 향조, 브랜드, 계열 등 다양한 정보를 한곳에서 탐색하고,
                  관심 있는 향수를 저장하거나 커뮤니티에서 다른 사용자와 정보를
                  나눌 수 있도록 설계되었습니다. Scent Memories는 향수를 사랑하는
                  사람들을 위한 향수 정보 공유 아카이브입니다.
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  본 서비스는{' '}
                  <strong className="text-[var(--color-text-primary)]">
                    프론트엔드 개발자 강송희의 포트폴리오
                  </strong>
                  로 제작되었습니다. 실제 서비스를 목표로 설계하여, 인증·실시간
                  통신·AI 연동 등 다양한 현대 웹 기술을 직접 구현했습니다.
                </p>
              </div>
            </section>

            <section id="preview" className="scroll-mt-24">
              <div className="mb-5">
                <p
                  className="text-xs font-semibold tracking-[0.18em] uppercase mb-2 text-[var(--color-lavender)]"
                >
                  Responsive Design
                </p>
                <p
                  className="text-xs text-[var(--color-text-secondary)]"
                >
                  데스크탑과 모바일 환경 모두에 최적화된 반응형 레이아웃을 제공합니다.
                </p>
              </div>
              <ResponsivePreview
                openZoom={openZoom}
                desktop={{
                  src: '/image/notice/main/main_web.png',
                  alt: '데스크탑 화면 — 향수 컬렉션',
                  zoomAlt: '데스크탑 화면 — 향수 컬렉션',
                  width: 900,
                  height: 700,
                  sizes: '(min-width: 768px) 900px, 100vw',
                }}
                mobile={{
                  src: '/image/notice/main/main_mobile.png',
                  alt: '모바일 화면 — 향수 컬렉션',
                  zoomAlt: '모바일 화면 — 향수 컬렉션',
                  width: 300,
                  height: 600,
                  sizes: '(min-width: 768px) 128px, 100vw',
                }}
              />
            </section>

            <section id="features" className="scroll-mt-24">
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

            <section id="main-gallery" className="scroll-mt-24">
              <SectionLabel index="03" title="메인 화면 & 시그니처 향수 갤러리" />
              <div className="space-y-4 mb-8 text-sm leading-[1.8] text-[var(--color-text-secondary)] break-keep">
                {mainGalleryGuide.desc.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <ResponsivePreview
                openZoom={openZoom}
                desktop={{
                  src: mainGalleryGuide.webImg.src,
                  alt: mainGalleryGuide.webImg.alt,
                  width: 900,
                  height: 650,
                  sizes: '(min-width: 768px) 900px, 100vw',
                }}
                mobile={{
                  src: mainGalleryGuide.mobileImg.src,
                  alt: mainGalleryGuide.mobileImg.alt,
                  width: 300,
                  height: 650,
                  sizes: '(min-width: 768px) 128px, 100vw',
                }}
              />
            </section>

            <StepGuideSection
              id="fragrance-guide"
              index="04"
              title="향수 등록 가이드"
              intro="관리자 계정은 향수를 직접 등록할 수 있습니다. 이미지를 업로드하면 AI가 향수 정보를 자동으로 분석하여 브랜드, 설명, 노트 필드를 채워줍니다."
              steps={fragranceGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="fragrance-detail"
              index="05"
              title="향수 상세 페이지 & 리뷰"
              intro="향수 상세 페이지에서는 향수의 정보(이미지·브랜드·이름·설명·노트)와 함께 다른 사용자가 남긴 리뷰를 확인할 수 있습니다. 로그인한 사용자는 직접 리뷰를 남기거나 수정·삭제할 수 있습니다."
              steps={fragranceDetailSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="notice-guide"
              index="06"
              title="공지사항 열람 & 댓글 가이드"
              intro='상단 "Notice" 메뉴에서 공지사항 목록을 확인할 수 있습니다. 누구나 열람할 수 있으며, 로그인한 사용자는 댓글 작성이 가능합니다.'
              steps={noticeGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="notice-write-guide"
              index="07"
              title="공지사항 글쓰기 가이드"
              intro="로그인한 사용자는 우측 상단의 글쓰기 버튼을 활성화하여 직접 새로운 공지사항을 작성하고 서식을 꾸밀 수 있습니다."
              steps={noticeWriteGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-move-guide"
              index="08"
              title="채팅 화면으로 이동하기"
              intro="Scent Memories에서 다른 멤버들과 채팅할 수 있습니다. 채팅 멤버 목록이나 대화방 목록으로 바로 이동하는 두 가지 방법을 안내합니다."
              steps={chatMoveGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-member-guide"
              index="09"
              title="채팅 멤버 기능 가이드"
              intro="채팅의 멤버 탭에서 다양한 대화 기능을 이용할 수 있습니다. 멤버를 클릭해 1:1 대화를 시작하거나, 우측 상단 메뉴(⋮)를 통해 단체 채팅방 만들기, AI 채팅, 다크/라이트 모드 변경이 가능합니다."
              steps={chatMemberGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-conversation-guide"
              index="10"
              title="채팅 대화방 기능 가이드"
              intro="채팅의 대화방 탭에서 진행되는 모든 대화 기능을 안내합니다. 단체 채팅방 생성부터 실시간 메시지 전송, 대화방 목록 관리까지 순서대로 확인하세요."
              steps={chatConversationGuideSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-conversation-detail-guide"
              index="11"
              title="대화방 상세 메뉴 & 읽음 표시"
              intro={<>대화방 채팅창 내에서 이용할 수 있는 <strong>상세 메뉴(⋮)</strong>와 <strong>읽음 표시</strong> 기능을 안내합니다.</>}
              steps={chatDetailSteps}
              openZoom={openZoom}
            />

            <StepGuideSection
              id="chat-ai-guide"
              index="12"
              title="향수 AI 어시스턴트 채팅 가이드"
              intro="향수 AI 어시스턴트와 대화할 수 있는 AI 채팅 기능을 안내합니다."
              steps={chatAiGuideSteps}
              openZoom={openZoom}
            />

            <section id="ui-theme" className="scroll-mt-24">
              <SectionLabel index="13" title="UI 테마 (다크 / 라이트 모드)" />
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

            <section id="howto" className="scroll-mt-24">
              <SectionLabel index="14" title="이용 방법" />
              <p className="text-xs mb-8 leading-relaxed text-[var(--color-text-secondary)]">
                회원가입 없이도 향수 목록과 공지사항을 자유롭게 열람할 수
                있습니다. 아래 기능을 이용하려면 소셜 로그인이 필요합니다.
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

          </div>

          <aside
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
                onWheel={handleNavWheel}
                onMouseDown={handleNavMouseDown}
                onMouseMove={handleNavMouseMove}
                onMouseUp={endNavMouseDrag}
                onMouseLeave={endNavMouseDrag}
                className="guide-on-this-page-nav overflow-x-auto overflow-y-hidden max-lg:touch-pan-x max-lg:overscroll-x-contain max-lg:overscroll-y-none lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-0 max-lg:pb-0 lg:scrollbar-thin lg:scrollbar-track-transparent lg:scrollbar-thumb-[var(--color-lavender-border)] max-lg:select-none"
              >
                <ol className="flex gap-1 min-w-max lg:flex-col lg:min-w-0 lg:gap-2.5">
                  {ON_THIS_PAGE.map(({ href, label }) => {
                    const isActive = activeId === href.replace('#', '');
                    return (
                      <li key={href} className="shrink-0 lg:shrink">
                        <a
                          href={href}
                          className={clsx(
                            "max-lg:touch-manipulation text-[0.72rem] leading-none tracking-[0.04em] transition-all hover:opacity-70 inline-flex items-center gap-1 py-[0.3rem] px-2.5 rounded-full whitespace-nowrap lg:text-xs lg:leading-normal lg:tracking-normal lg:gap-2 lg:rounded-none lg:py-0 lg:px-0 lg:whitespace-normal",
                            isActive
                              ? "bg-[var(--color-lavender)] text-white font-medium border-transparent lg:bg-transparent lg:text-[var(--color-lavender)] lg:font-bold lg:dark:bg-transparent lg:border-0"
                              : "bg-[var(--color-lavender-pale)]/60 dark:bg-[var(--color-lavender-pale)]/30 text-[var(--color-text-secondary)] border border-[var(--color-lavender-border)]/50 lg:bg-transparent lg:dark:bg-transparent lg:border-0"
                          )}
                        >
                          <span className={clsx("w-1 h-1 rounded-full shrink-0 lg:inline", isActive ? "bg-white lg:bg-[var(--color-lavender)]" : "bg-[var(--color-lavender)] opacity-50 lg:opacity-100")} />
                          {label}
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          </aside>
        </div>
      </div>

      <div
        className="mt-20 pt-8 flex items-center justify-between border-t border-[var(--color-lavender-border)]"
      >
        <Link
          href="/notice"
          className="inline-flex items-center gap-1.5 text-xs tracking-wide transition-opacity hover:opacity-60 text-[var(--color-text-secondary)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          목록으로 돌아가기
        </Link>
        <p className="text-[11px] text-[var(--color-text-secondary)]">
          Scent Memories · Frontend Portfolio
        </p>
      </div>
    </div>
  );
}
