import { motion } from 'framer-motion';

type DrinksNameProps = {
  name?: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const DrinksName:React.FC<DrinksNameProps> = ({ name, scrollRef }) => {
  if(!name || !scrollRef) return null;

  return(
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ root: scrollRef }}
      transition={{ duration: 1 }}
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
      '>
      {name}
    </motion.span>
  )
};

export default DrinksName;
