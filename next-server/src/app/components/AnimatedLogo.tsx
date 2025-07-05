'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Urbanist } from 'next/font/google';
import clsx from 'clsx';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '700'], style: ['italic', 'normal'] });

const letters = 'HITEJINRO'.split('');

const container = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

interface AnimatedLogoProps {
  responsive?: boolean;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ responsive = true }) => {
  const textSizeClass = responsive
    ? 'text-3xl max-[480px]:text-xl max-[319px]:text-[18px]'
    : 'text-3xl';

  return (
    <div className="relative inline-block">
      {/* 배경 흐릿한 고정 텍스트 */}
      <h1 
        className={clsx(`
          absolute 
          top-0 
          left-0 
          opacity-30 
          bg-gradient-to-r 
        from-blue-900 
        via-blue-500 
        to-sky-300 
          bg-clip-text 
          text-transparent 
          pointer-events-none
        `,
          urbanist.className,
          textSizeClass
        )}
        aria-hidden="true"
      >
        HITEJINRO
      </h1>

      {/* 앞쪽 등장 애니메이션 텍스트 */}
      <motion.h1
        className={clsx(`
          relative
          bg-gradient-to-r 
        from-blue-700 
        via-blue-500 
        to-sky-400 
          bg-clip-text 
          text-transparent
        `,
          urbanist.className,
          textSizeClass
        )}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <Link href="/">
          {letters.map((char, index) => (
            <motion.span
              key={index}
              variants={item}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </Link>
      </motion.h1>
    </div>
  );
};

export default AnimatedLogo;