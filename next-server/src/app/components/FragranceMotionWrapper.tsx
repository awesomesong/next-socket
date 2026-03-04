'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type FragranceMotionWrapperProps = {
    className?: string;
    children: ReactNode;
    delay?: number;
};

export default function FragranceMotionWrapper({ className, children, delay = 0 }: FragranceMotionWrapperProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15, once: true }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
