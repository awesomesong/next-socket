'use client';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import clsx from 'clsx';

// 단어 단위 fade-up — 스태거 없이 부드럽게
const wordVariants: Variants = {
  hidden: { opacity: 0.15, y: 4 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.9,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuart
    },
  }),
};

// 언더라인 슬라이드인
const lineVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { delay: 0.9, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface AnimatedLogoProps {
  responsive?: boolean;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ responsive = true }) => {
  return (
    <Link href="/" className="inline-flex flex-col items-start leading-none select-none gap-[0px]">

      {/* "Scent" — italic, normal weight */}
      <motion.div
        custom={0}
        variants={wordVariants}
        initial="hidden"
        animate="visible"
        className={clsx(
          'text-gradient-scent font-josefin text-lg italic font-light tracking-[0.02em]',
          responsive && 'max-[480px]:text-base',
        )}
      >
        Scent
      </motion.div>

      {/* "Memories" — upright, slight weight */}
      <motion.div
        custom={0.28}
        variants={wordVariants}
        initial="hidden"
        animate="visible"
        className={clsx(
          'text-gradient-memories font-josefin font-normal tracking-[0.03em]',
          responsive && 'max-[480px]:text-base',
        )}
      >
        Memories
      </motion.div>

      {/* 장식 라인 */}
      <motion.div
        variants={lineVariants}
        initial="hidden"
        animate="visible"
        className="line-gradient-deco"
      />
    </Link>
  );
};

export default AnimatedLogo;