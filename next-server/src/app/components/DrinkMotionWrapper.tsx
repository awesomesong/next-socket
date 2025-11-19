'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// ✅ Motion variants 외부 추출 (객체 재생성 방지)
const DESCRIPTION_MOTION = {
  initial: { top: '60%' },
  whileInView: { top: '50%' },
  viewport: { amount: 0.4 },
};

const INFO_MOTION = {
  initial: { top: '70%' },
  whileInView: { top: '50%' },
  viewport: { amount: 0 },
};

type DrinkMotionWrapperProps = {
  type: 'description' | 'info';
  className?: string;
  children: ReactNode;
};

export default function DrinkMotionWrapper({ type, className, children }: DrinkMotionWrapperProps) {
  const motionProps = type === 'description' ? DESCRIPTION_MOTION : INFO_MOTION;
  
  return (
    <motion.div {...motionProps} className={className}>
      {children}
    </motion.div>
  );
}

