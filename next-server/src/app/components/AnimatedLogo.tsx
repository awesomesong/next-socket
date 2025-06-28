'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const letters = 'songhee'.split('');

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const AnimatedLogo = () => {
  return (
    <motion.h1
      className="shrink-0 text-4xl font-bold leading-none"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <Link href="/">
        {letters.map((char, index) => (
          <motion.span key={index} variants={item} className="inline-block">
            {char}
          </motion.span>
        ))}
      </Link>
    </motion.h1>
  );
};

export default AnimatedLogo;
