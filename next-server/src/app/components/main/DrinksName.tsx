import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

type DrinksNameProps = {
  name?: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const DrinksName:React.FC<DrinksNameProps> = ({ name, scrollRef }) => {
  if(!name || !scrollRef) return null;

  return(
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ root: scrollRef }}
      transition={{ duration: 1 }}
    >
        <pre 
          className='
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
          '
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(name)
          }}
        />
    </motion.div>
  )
};

export default DrinksName;
