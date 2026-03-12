'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ImageModal from '@/src/app/components/ImageModal';

const ON_THIS_PAGE = [
  { href: '#overview', label: 'Scent Memories란?' },
  { href: '#preview', label: '화면 미리보기' },
  { href: '#features', label: '주요 기능' },
  { href: '#fragrance-guide', label: '향수 등록 가이드' },
  { href: '#howto', label: '이용 방법' },
] as const;

const SectionLabel = ({ index, title }: { index: string; title: string }) => (
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

type PreviewImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  zoomAlt?: string;
};

function ResponsivePreview({
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
        <p className="text-[11px] text-center mb-2 text-[var(--color-text-secondary)]">
          Desktop
        </p>
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

      <div className="w-full max-md:max-w-full md:w-[128px] md:basis-[128px] md:flex-none">
        <p className="text-[11px] text-center mb-2 text-[var(--color-text-secondary)]">
          Mobile
        </p>
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
}

export type IntroStep = {
  step: string;
  title: string;
  desc: string;
  image?: { src: string; alt: string };
};

export type FragranceGuideStep = {
  step: string;
  title: string;
  desc: string;
  webImg: { src: string; alt: string };
  mobileImg: { src: string; alt: string };
};

type NoticeIntroContentProps = {
  features: { icon: string; title: string; desc: string }[];
  steps: IntroStep[];
  techStack: { category: string; items: string[] }[];
  fragranceGuideSteps: FragranceGuideStep[];
};

export default function NoticeIntroContent({
  features,
  steps,
  techStack,
  fragranceGuideSteps,
}: NoticeIntroContentProps) {
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);

  const closeZoom = useCallback(() => setZoomedImage(null), []);
  const openZoom = useCallback(
    (src: string, alt: string) => () => setZoomedImage({ src, alt }),
  []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 md:px-8 md:py-12">
      <ImageModal
        src={zoomedImage?.src ?? ''}
        isOpen={!!zoomedImage}
        onClose={closeZoom}
        alt={zoomedImage?.alt ?? '이미지'}
      />

      {/* 뒤로가기 */}
      <Link
        href="/notice"
        className="inline-flex items-center gap-1.5 text-xs tracking-wide transition-opacity hover:opacity-60 mb-10 text-[var(--color-text-secondary)]"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M9 11L5 7L9 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Notice
      </Link>

      {/* ── 히어로 ── */}
      <section className="mb-16 md:mb-24">
        <p
          className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-5 text-[var(--color-lavender-muted)]"
        >
          Frontend Portfolio · 포트폴리오 안내문
        </p>

        <h1 className="font-josefin text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.15] mb-2">
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
      <div className="rounded-2xl p-6 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] dark:bg-[var(--color-ivory-soft)] dark:border-[var(--color-lavender-border)] mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="space-y-20">

          <section id="overview" className="scroll-mt-24">
            <SectionLabel index="01" title="Scent Memories란?" />
            <div
              className="space-y-4 text-sm leading-[1.9] text-[var(--color-text-primary)]"
            >
              <p>
                <strong>Scent Memories</strong>는 사용자가 좋아하는 향수를{' '}
                <strong>탐색하고, 기록하고, 공유</strong>할 수 있는 향기
                아카이브 서비스입니다.
              </p>
              <p className="text-[var(--color-text-secondary)]">
                단순한 향수 정보 제공을 넘어, 사용자가 향기와 함께한 기억과
                감상을 직접 남길 수 있도록 설계되었습니다. 마치 향기가 특정
                순간의 기억을 불러오듯, Scent Memories는 나만의 향기 일지를
                만들어 가는 공간입니다.
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
                  className="group rounded-2xl p-5 transition-all duration-300 bg-[var(--color-card-bg)] border border-[var(--color-card-border)]"
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

          <section id="fragrance-guide" className="scroll-mt-24">
            <SectionLabel index="03" title="향수 등록 가이드" />
            <p className="text-xs mb-8 leading-relaxed text-[var(--color-text-secondary)]">
              관리자 계정은 향수를 직접 등록할 수 있습니다. 이미지를 업로드하면
              AI가 향수 정보를 자동으로 분석하여 브랜드, 설명, 노트 필드를
              채워줍니다.
            </p>

            <div className="space-y-12">
              {fragranceGuideSteps.map(({ step, title, desc, webImg, mobileImg }) => (
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
                        {title}
                      </p>
                      <p className="text-xs leading-relaxed mb-4 text-left text-[var(--color-text-secondary)]">
                        {desc}
                      </p>

                      <ResponsivePreview
                        openZoom={openZoom}
                        desktop={{
                          src: webImg.src,
                          alt: webImg.alt,
                          width: 900,
                          height: 600,
                          sizes: '(min-width: 768px) 900px, 100vw',
                        }}
                        mobile={{
                          src: mobileImg.src,
                          alt: mobileImg.alt,
                          width: 300,
                          height: 600,
                          sizes: '(min-width: 768px) 128px, 100vw',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="howto" className="scroll-mt-24">
            <SectionLabel index="04" title="이용 방법" />
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

        <aside className="space-y-8 lg:sticky lg:top-24">
          <div className="rounded-2xl p-6 border border-[var(--color-lavender-border)] [background:linear-gradient(135deg,rgba(176,148,224,0.06)_0%,transparent_100%)]">
            <p
              className="text-[11px] font-semibold tracking-[0.16em] uppercase mb-4 text-[var(--color-lavender)]"
            >
              On this page
            </p>
            <nav>
              <ol className="space-y-2.5">
                {ON_THIS_PAGE.map(({ href, label }) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="text-xs transition-opacity hover:opacity-70 flex items-center gap-2 text-[var(--color-text-secondary)]"
                    >
                      <span className="w-1 h-1 rounded-full shrink-0 bg-[var(--color-lavender)]" />
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </aside>
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
