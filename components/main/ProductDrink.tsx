'use client';
import Image from 'next/image';
import {  motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import DrinksName from './DrinksName';
import Link from 'next/link';
import drinksData from '@/src/app/data/drinks';
import useMediaQuery from '@/src/app/hooks/useMediaQuery';
import clsx from 'clsx';

const ProductDrink = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPC = useMediaQuery("(min-width: 768px)");
  const [initialPositionsGroup1, setInitialPositionsGroup1] = useState<string[]>([]);
  const [initialPositionsGroup2, setInitialPositionsGroup2] = useState<string[]>([]);

  useEffect(() => {
    if (isPC !== null) {
      setInitialPositionsGroup1(isPC 
        ? ['-15%', '-109%', '-206%', '-300%'] 
        : ['-15%', '-109%', '-15%', '-109%']);
      setInitialPositionsGroup2(isPC 
        ? ['320%', '222%', '124%', '30%'] 
        : ['124%', '30%', '124%', '30%']);
    }
  }, [isPC]);

  const drinks = drinksData;
  const otherDrinks = useMemo(() => {
    return drinks.filter((drink) => drink.type === 'others');
  }, []); 

  if (initialPositionsGroup1.length === 0 
    || initialPositionsGroup2.length === 0) {
    return null; // or a loading spinner
  }

  return (
    <div ref={scrollRef} className='product-layout'>
      <div className="product-title-layout">
          <h2 className="product-title">기타 주류</h2>
      </div>
      <div className="
        product-box
        grid 
        grid-cols-2 
        md:grid-cols-4 
        gap-y-10
        items-baseline
        w-fit
        my-24
      ">
        {otherDrinks.slice(0, 4).map((drink, index) => (
          <motion.div
            key={drink.name}
            initial={{ left: initialPositionsGroup1[index] }}
            whileInView={{ left: 0 }} 
            viewport={{ amount: 0.2, once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }} 
            className='relative'
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
            ">
              <Image
                src={drink.image}
                alt={drink.name}
                width={0}
                height={0}
                sizes='100vw'
                className="w-auto lg:h-[265px] min-[940px]:h-[220px] h-[180px]"
              />
              <DrinksName name={drink.name} scrollRef={scrollRef} />
            </Link>
          </motion.div>
        ))}
        {otherDrinks.slice(4).map((drink, index) => (
          <motion.div
            key={drink.name}
            initial={{ left: initialPositionsGroup2[index] }}
            whileInView={{ left: '0' }} 
            viewport={{ amount: 0, once: true }}
            transition={{ duration: .5, ease: "easeOut" }} 
            className='relative'
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
            ">
              <Image
                src={drink.image}
                alt={drink.name}
                width={0}
                height={0}
                sizes='100vw'
                className={clsx(
                  "w-auto h-[265px]",
                  (drink.name === '자몽에이슬' || drink.name === '청포도에이슬') && 'max-[320px]:h-auto max-[320px]:w-full'
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