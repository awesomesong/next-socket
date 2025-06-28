'use client';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

type DrinksNameProps = {
  name?: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const SsrDOMPurify = dynamic(() => import('../SsrDOMPurify'), {
    ssr: false,
});

const DrinksName:React.FC<DrinksNameProps> = ({ name, scrollRef }) => {
  if(!name || !scrollRef) return null;

  return(
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ root: scrollRef }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="
            text-lg
            sm:text-2xl
            max-[480px]:text-base
            max-[300px]:text-sm
            text-center
            font-semibold
            break-keep
            whitespace-pre-line
            leading-7
            max-[480px]:leading-5
          "
        >
          {name}
        </motion.div>
    </motion.div>
  )
};

export default DrinksName;
