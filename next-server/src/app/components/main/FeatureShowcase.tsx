'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi2';

/* ──────────────────────────────────────────────
   데이터
────────────────────────────────────────────── */
const FEATURES = [
  {
    tag: 'AI Chat',
    headline: ['향수에 대해 궁금한 점을', 'AI에게 물어보세요'],
    steps: [
      { label: 'AI 채팅방에 들어가요', desc: '향수 AI 어시스턴트와 1:1로 대화할 수 있어요' },
      { label: '궁금한 것을 편하게 물어보세요', desc: '"향수를 처음 사려는데 뭐가 좋을까요?" 친구한테 묻듯이 편하게 적어보세요' },
      { label: '향수와 관련된 질문에 답해드려요', desc: '향수 추천부터 향의 계열, 브랜드 스토리까지 궁금한 점을 자유롭게 물어보세요' },
    ],
    badges: ['GPT-4o', 'Streaming', 'Socket.io'],
    cta: '채팅 시작하기',
    href: '/conversations/new?aiAgentType=assistant',
    image: '/image/notice/chat/conversation_ai/chat_ai_mobile04.png',
    webImage: '/image/notice/chat/conversation_ai/chat_ai_web04.png',
    imageAlt: 'AI 향수 추천 채팅 화면',
    flip: false,
    phoneAspectRatio: '780 / 1227',
  },
  {
    tag: 'AI Vision',
    headline: ['카메라로 찍거나 사진을 올리면', '상품 정보와 구매 링크를 바로 알려드려요'],
    steps: [
      { label: '카메라로 찍거나 사진을 올려주세요', desc: '향수병에 적힌 브랜드나 제품명이 잘 보이게 찍어주세요' },
      { label: 'AI가 향수를 분석해요', desc: '향수병에 적힌 텍스트를 인식해서 어떤 제품인지 찾아드려요' },
      { label: '상품 정보와 구매 링크를 확인하세요', desc: '향수 상세 정보와 구매할 수 있는 링크를 바로 보여드려요' },
    ],
    badges: ['GPT-4o Vision', '2-pass 분석', 'Cloudinary'],
    cta: '지금 스캔하기',
    href: '/scan',
    image: '/showcase/scan.png',
    webImage: '/showcase/scan_web.png',
    imageAlt: '향수 스캔 화면',
    flip: true,
    phoneAspectRatio: '9 / 19.5',
  },
  {
    tag: 'AI Auto-fill',
    headline: ['향수 사진을 올리면 AI가 브랜드, 이름, 설명, 노트를 자동으로 분석해서', '직접 검색하지 않아도 바로 기록할 수 있어요'],
    steps: [
      { label: '향수 사진을 올려주세요', desc: '첫 번째 이미지를 AI가 자동으로 분석해요' },
      { label: 'AI가 정보를 자동으로 채워줘요', desc: '브랜드, 이름, 설명, 노트까지 한 번에 입력돼요' },
      { label: '확인하고 바로 기록해요', desc: '수정 후 저장하면 향수 컬렉션에 공개 등록돼요' },
    ],
    badges: ['GPT-4o Vision', 'Auto-fill', 'Prisma ORM'],
    cta: '향수 등록하기',
    href: '/fragrance/create',
    image: '/showcase/create.png',
    webImage: '/image/notice/fragrance/fragrance_create_web01.png',
    imageAlt: '향수 자동 등록 화면',
    flip: false,
    phoneAspectRatio: '9 / 19.5',
  },
];

/* ──────────────────────────────────────────────
   PC 브라우저 목업 프레임
────────────────────────────────────────────── */
function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        borderRadius: '14px',
        background: 'linear-gradient(160deg, #2a2440 0%, #1a1628 40%, #0e0c18 100%)',
        boxShadow: [
          '0 60px 120px rgba(0,0,0,0.65)',
          '0 28px 56px rgba(0,0,0,0.38)',
          '0 8px 20px rgba(0,0,0,0.22)',
          'inset 0 1.5px 0 rgba(255,255,255,0.14)',
          'inset 0 -1px 0 rgba(0,0,0,0.5)',
          '0 0 40px 6px rgba(80,50,150,0.10)',
        ].join(', '),
        padding: '1.5px',
      }}
    >
      <div style={{ borderRadius: '13px', overflow: 'hidden', background: '#0e0c18' }}>
        {/* 툴바 */}
        <div
          style={{
            height: '36px',
            background: 'linear-gradient(180deg, #252040 0%, #1c1832 100%)',
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: '10px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ display: 'flex', gap: '5px' }}>
            {(['#ff5f57', '#febc2e', '#28c840'] as const).map((color) => (
              <div key={color} style={{ width: '9px', height: '9px', borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}66` }} />
            ))}
          </div>
          <div style={{ flex: 1, height: '20px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(80,200,120,0.7)' }} />
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.02em' }}>iloveperfume.co.kr</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)' }} />
            ))}
          </div>
        </div>
        {/* 화면 */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10', background: '#050410' }}>
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 0px, (max-width: 1280px) 380px, 460px"
          />
          <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, transparent, rgba(5,4,16,0.85))', pointerEvents: 'none', zIndex: 5 }} />
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 25%, transparent 50%)', pointerEvents: 'none', zIndex: 6 }} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   폰 프레임
────────────────────────────────────────────── */
function PhoneFrame({ src, alt, aspectRatio = '9 / 19.5' }: { src: string; alt: string; aspectRatio?: string }) {
  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: 'clamp(130px, 16vw, 190px)' }}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div aria-hidden style={{ position: 'absolute', bottom: '-40px', left: '-20%', right: '-20%', height: '80px', background: 'var(--color-lavender)', opacity: 0.2, filter: 'blur(48px)', borderRadius: '50%', zIndex: -1 }} />
      <div aria-hidden style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(ellipse at 50% 58%, rgba(90,55,160,0.18) 0%, transparent 62%)', filter: 'blur(16px)', zIndex: -1, borderRadius: '5rem' }} />
      <div style={{ borderRadius: '1.5rem', padding: '4px', background: 'linear-gradient(148deg, #343048 0%, #1a1626 18%, #0e0c18 45%, #171328 70%, #2a2440 88%, #1e1a30 100%)', boxShadow: ['0 60px 110px rgba(0,0,0,0.70)', '0 28px 56px rgba(0,0,0,0.40)', '0 0 24px 4px rgba(80,50,150,0.12)', 'inset 0 2px 0 rgba(255,255,255,0.18)'].join(', ') }}>
        <div style={{ borderRadius: '1.2rem', padding: '1.5px', background: '#0a0812', boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.07)' }}>
          <div className="relative overflow-hidden flex flex-col" style={{ borderRadius: '1.1rem', background: '#050410' }}>
            {/* 상태바 */}
            <div aria-hidden style={{ height: '20px', flexShrink: 0, background: '#050410', position: 'relative', zIndex: 12 }}>
              <div aria-hidden style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', width: '22%', height: '10px', background: '#1a1a1a', borderRadius: '99px' }} />
            </div>
            {/* 이미지 — 비율 그대로 */}
            <div className="relative" style={{ width: '100%', aspectRatio }}>
              <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 1024px) 220px, (max-width: 1280px) 160px, 190px" priority />
            </div>
            <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 22%, transparent 48%)' }} />
            <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none', boxShadow: 'inset 0 0 20px rgba(80,45,160,0.22)', borderRadius: '1.1rem' }} />
          </div>
        </div>
      </div>
      <div aria-hidden style={{ position: 'absolute', left: '-4px', top: '14.5%', width: '4px', height: '3.5%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '3px 0 0 3px' }} />
      <div aria-hidden style={{ position: 'absolute', left: '-4px', top: '21%', width: '4px', height: '6.5%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '3px 0 0 3px' }} />
      <div aria-hidden style={{ position: 'absolute', left: '-4px', top: '30%', width: '4px', height: '6.5%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '3px 0 0 3px' }} />
      <div aria-hidden style={{ position: 'absolute', right: '-4px', top: '24%', width: '4px', height: '12%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '0 3px 3px 0' }} />
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   모바일 전용 폰 프레임 (스크린샷)
────────────────────────────────────────────── */
function PhoneFrameStandalone({ src, alt, aspectRatio = '9 / 19.5' }: { src: string; alt: string; aspectRatio?: string }) {
  return (
    <motion.div
      className="relative mx-auto shrink-0 w-full"
      animate={{ y: [0, -11, 0] }}
      transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div aria-hidden style={{ position: 'absolute', bottom: '-44px', left: '-15%', right: '-15%', height: '90px', background: 'var(--color-lavender)', opacity: 0.22, filter: 'blur(52px)', borderRadius: '50%', zIndex: -1 }} />
      <div style={{ borderRadius: '1.5rem', padding: '4.5px', background: 'linear-gradient(148deg, #343048 0%, #1a1626 18%, #0e0c18 45%, #171328 70%, #2a2440 88%, #1e1a30 100%)', boxShadow: ['0 70px 130px rgba(0,0,0,0.70)', '0 36px 68px rgba(0,0,0,0.42)', 'inset 0 2px 0 rgba(255,255,255,0.18)', '0 0 28px 4px rgba(80,50,150,0.12)'].join(', ') }}>
        <div style={{ borderRadius: '1.2rem', padding: '1.5px', background: '#0a0812' }}>
          <div className="relative overflow-hidden flex flex-col" style={{ borderRadius: '1.1rem', background: '#050410' }}>
            {/* 상태바 */}
            <div aria-hidden style={{ height: '24px', flexShrink: 0, background: '#050410', position: 'relative', zIndex: 12 }}>
              <div aria-hidden style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '22%', height: '12px', background: '#1a1a1a', borderRadius: '99px' }} />
            </div>
            {/* 이미지 — 비율 그대로 */}
            <div className="relative" style={{ width: '100%', aspectRatio }}>
              <Image src={src} alt={alt} fill className="object-cover object-top" sizes="(max-width: 768px) 280px, 220px" priority />
            </div>
            <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 48%)' }} />
          </div>
        </div>
      </div>
      <div aria-hidden style={{ position: 'absolute', left: '-5px', top: '14.5%', width: '5px', height: '3.5%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '3px 0 0 3px' }} />
      <div aria-hidden style={{ position: 'absolute', left: '-5px', top: '21%', width: '5px', height: '6.5%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '3px 0 0 3px' }} />
      <div aria-hidden style={{ position: 'absolute', left: '-5px', top: '30%', width: '5px', height: '6.5%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '3px 0 0 3px' }} />
      <div aria-hidden style={{ position: 'absolute', right: '-5px', top: '24%', width: '5px', height: '12%', background: 'linear-gradient(180deg, #383050 0%, #1a1628 50%, #242038 100%)', borderRadius: '0 3px 3px 0' }} />
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   목업 그룹 (브라우저 + 폰)
────────────────────────────────────────────── */
function MockupGroup({ src, webSrc, alt, flip, phoneAspectRatio }: { src: string; webSrc: string; alt: string; flip: boolean; phoneAspectRatio?: string }) {
  return (
    <>
      {/* 모바일: 폰만 */}
      <div className="flex justify-center lg:hidden">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: 'clamp(220px, 55vw, 280px)' }}
        >
          <PhoneFrameStandalone src={src} alt={alt} aspectRatio={phoneAspectRatio} />
        </motion.div>
      </div>

      {/* PC: 브라우저(PC 스크린샷) + 폰(모바일 스크린샷) */}
      <div
        className="hidden lg:flex w-full lg:w-[52%] xl:w-[48%] shrink-0 items-end justify-center"
        style={{ minHeight: '380px' }}
      >
        <motion.div
          className="relative w-full"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* 브라우저 프레임 */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            style={{ paddingBottom: '60px' }}
          >
            <BrowserFrame src={webSrc} alt={alt} />
          </motion.div>

          {/* 폰 프레임 */}
          <div
            className="absolute bottom-0 z-10"
            style={{
              [flip ? 'left' : 'right']: '0px',
              transform: flip ? 'translateX(-10%)' : 'translateX(10%)',
            }}
          >
            <PhoneFrame src={src} alt={alt} aspectRatio={phoneAspectRatio} />
          </div>

          {/* 배경 glow */}
          <div aria-hidden style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '40px', background: 'radial-gradient(ellipse, rgba(90,55,160,0.25) 0%, transparent 70%)', filter: 'blur(24px)', zIndex: -1 }} />
        </motion.div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────
   단계 안내
────────────────────────────────────────────── */
function StepList({ steps }: { steps: { label: string; desc: string }[] }) {
  return (
    <ol className="flex flex-col gap-5">
      {steps.map(({ label, desc }, i) => (
        <motion.li
          key={label}
          className="flex items-start gap-4"
          initial={{ opacity: 0, x: -14 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="text-gradient-scent font-bold shrink-0 leading-none mt-0.5 tabular-nums"
            style={{ fontSize: 'clamp(1.35rem, 2.2vw, 1.85rem)' }}
            aria-hidden
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
            <span className="text-xs leading-relaxed text-secondary">{desc}</span>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

/* ──────────────────────────────────────────────
   개별 쇼케이스 섹션
────────────────────────────────────────────── */
function ShowcaseSection({ feature }: { feature: (typeof FEATURES)[number] }) {
  const { tag, headline, steps, badges, cta, href, image, webImage, imageAlt, flip, phoneAspectRatio } = feature;

  return (
    <div
      className={[
        'flex flex-col items-center gap-10 lg:gap-12 xl:gap-16',
        flip ? 'lg:flex-row-reverse' : 'lg:flex-row',
      ].join(' ')}
    >
      <MockupGroup src={image} webSrc={webImage} alt={imageAlt} flip={flip} phoneAspectRatio={phoneAspectRatio} />

      <motion.div
        className="flex-1 flex flex-col gap-7 min-w-0"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <span
          className="self-start text-[0.6rem] font-bold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
          style={{ background: 'var(--color-lavender-pale)', border: '1px solid var(--color-lavender-border)', color: 'var(--color-lavender)' }}
        >
          {tag}
        </span>

        <h2
          className="text-gradient-scent font-bold leading-[1.15] tracking-tight"
          style={{ fontSize: 'clamp(1rem, 2.1vw, 1.6rem)' }}
        >
          {headline[0]} {headline[1]}
        </h2>

        <StepList steps={steps} />

        <div className="flex flex-wrap gap-2" aria-label="사용 기술">
          {badges.map((badge) => (
            <span key={badge} className="footer-stack-badge">{badge}</span>
          ))}
        </div>

        <Link href={href} className="action-btn self-start">
          {cta}
          <HiArrowRight className="size-3.5 shrink-0" aria-hidden />
        </Link>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   메인 export
────────────────────────────────────────────── */
export default function FeatureShowcase() {
  return (
    <section
      className="w-full px-4 md:px-8 pb-20 md:pb-28 max-w-[1440px] mx-auto"
      aria-label="기능 소개"
    >
      <motion.div
        className="text-center py-14 md:py-20"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="line-gradient-deco w-20 mx-auto mb-8" aria-hidden />
        <p className="text-[0.68rem] tracking-[0.35em] mb-3 font-medium text-secondary uppercase">How it works</p>
        <h2 className="text-gradient-scent page-title-gradient">이렇게 사용하면 돼요</h2>
      </motion.div>

      <div>
        {FEATURES.map((feature, i) => (
          <div key={feature.href}>
            <div className="py-12 md:py-18">
              <ShowcaseSection feature={feature} />
            </div>
            {i < FEATURES.length - 1 && (
              <div className="line-gradient-deco w-40 mx-auto" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
