'use client';
import Image from 'next/image';
import { motion, type Transition } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import DrinksName from './DrinksName';
import Link from 'next/link';
import drinksData from '@/src/app/data/drinks';
import useMediaQuery from '@/src/app/hooks/useMediaQuery';
import clsx from 'clsx';

// ✅ 정적 데이터 외부 추출
const OTHER_DRINKS_DATA = drinksData.filter((drink) => drink.type === 'others');

// ✅ Motion transition 외부 추출
const DRINK_MOTION_TRANSITION = {
  duration: 0.5,
  ease: "easeOut",
} satisfies Transition;

const ProductDrink = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPC = useMediaQuery('(min-width: 768px)');
  const [initialXGroup1, setInitialXGroup1] = useState<number[]>([]);
  const [initialXGroup2, setInitialXGroup2] = useState<number[]>([]);

  const setInitialPositions = useCallback(() => {
    if (isPC !== null) {
      setInitialXGroup1(isPC ? [-60, -200, -340, -480] : [-50, -70, -50, -70]);
      setInitialXGroup2(isPC ? [480, 340, 200, 60] : [50, 70, 50, 70]);
    }
  }, [isPC]);

  useEffect(() => {
    setInitialPositions();
  }, [setInitialPositions]);

  if (initialXGroup1.length === 0 || initialXGroup2.length === 0) {
    return null;
  }

  return (
    <div ref={scrollRef} className="product-layout">
      <div className="product-title-layout">
        <h2 className="product-title">기타 주류</h2>
      </div>
      <div
        className="
          product-box
          grid 
          grid-cols-2 
          md:grid-cols-4 
          gap-y-10
          items-baseline
          w-full
          my-24
        "
      >
        {OTHER_DRINKS_DATA.slice(0, 4).map((drink, index) => (
          <motion.div
            key={drink.name}
            initial={{ x: initialXGroup1[index], opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ amount: 0.3, once: true }}
            transition={DRINK_MOTION_TRANSITION}
            className="relative aspect-[3/4]"
          >
            <Link
              href={drink.link}
              title={drink.name}
              className="
                flex 
                flex-col 
                items-center 
                justify-end
                gap-6
                relative
              "
            >
              <Image
                src={drink.image}
                alt={drink.name}
                width={300}
                height={400}
                className="w-auto lg:h-[265px] min-[940px]:h-[220px] h-[180px] object-contain"
              />
              <DrinksName name={drink.name} scrollRef={scrollRef} />
            </Link>
          </motion.div>
        ))}
        {OTHER_DRINKS_DATA.slice(4).map((drink, index) => (
          <motion.div
            key={drink.name}
            initial={{ x: initialXGroup2[index], opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ amount: 0.3, once: true }}
            transition={DRINK_MOTION_TRANSITION}
            className="relative"
          >
            <Link
              href={drink.link}
              title={drink.name}
              className="
                flex 
                flex-col 
                items-center 
                justify-end
                gap-6
              "
            >
              <Image
                src={drink.image}
                alt={drink.name}
                width={0}
                height={0}
                sizes="100vw"
                className={clsx(
                  'w-auto h-[265px]',
                  (drink.name === '자몽에이슬' || drink.name === '청포도에이슬') &&
                    'max-[320px]:h-auto max-[320px]:w-full'
                )}
              />
              <DrinksName name={drink.name} scrollRef={scrollRef} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProductDrink;
