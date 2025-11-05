'use client'
import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, type Transition } from 'framer-motion';
import drinksData from '@/src/app/data/drinks';
import DrinksName from './DrinksName';

// ✅ 정적 데이터 및 motion variants를 외부로 추출 (한 번만 생성)
const BEERS_DATA = drinksData.filter((drink) => drink.type === 'beer');
const FIRST_BEER_DATA = BEERS_DATA[0];
const OTHER_BEERS_DATA = BEERS_DATA.slice(1);

// ✅ Motion variants를 외부로 추출하여 객체 재생성 방지
const FIRST_BEER_MOTION = {
  initial: { scale: 1 },
  whileInView: { scale: [1, 1.05, 1] },
  transition: { duration: 1 },
};

const TEXT_MOTION_BASE = {
  initial: { opacity: 0.3 },
  whileInView: { opacity: 1 },
  viewport: { amount: 0.3, once: true },
};

const OTHER_BEER_MOTION = {
  initial: { scale: 0.7, opacity: 0 },
  whileInView: { scale: [0.7, 1], opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: "easeOut" } satisfies Transition,
};

const ProductBeer = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div 
            ref={scrollRef} 
            className="product-layout"
        >
            <div className="product-title-layout">
                <h2 className="product-title">맥주</h2>
                <p className="product-scroll"><span className='animate-bounce'>↓ 스크롤을 아래로 내려주세요.</span></p>
            </div>
            <div className='product-box px-4'>
                <div className='
                    flex 
                    flex-col
                    items-center
                    gap-20
                    mt-16
                '>
                    <motion.div
                        {...FIRST_BEER_MOTION}
                        viewport={{ root: scrollRef, once: true }}
                        className='flex'
                    >
                        <Link 
                            href={FIRST_BEER_DATA.link} 
                            title={FIRST_BEER_DATA.name}
                            className={`
                                relative
                                overflow-hidden
                                w-[210px]
                                h-[400px]
                                md:w-[270px]
                                md:h-[460px]
                        `}>
                            <Image 
                                src={FIRST_BEER_DATA.image} 
                                alt={FIRST_BEER_DATA.name } 
                                width={0}
                                height={0}
                                priority
                                sizes="100vw"
                                className="w-full h-full"
                            />
                        </Link>
                    </motion.div>
                    <div className='
                        flex 
                        flex-row 
                        gap-5 
                        hite-text
                    '>
                        <motion.span {...TEXT_MOTION_BASE}>
                            <span>hite</span>
                        </motion.span>
                        <motion.span 
                            {...TEXT_MOTION_BASE}
                            transition={{ delay: .3 }}
                        >
                            <span>EXTRA</span>
                        </motion.span>
                        <motion.span 
                            {...TEXT_MOTION_BASE}
                            transition={{ delay: .5 }}
                        >
                            <span>GOLD</span>    
                        </motion.span>
                    </div>
                </div>
                <div className="
                    flex 
                    flex-row 
                    max-[480px]:grid 
                    max-[480px]:grid-cols-2
                    sm:gap-7 
                    gap-3
                    my-24
                    max-[480px]:mb-16
                ">
                    {OTHER_BEERS_DATA.map((beer) => (
                        <motion.div
                            key={beer.name}
                            {...OTHER_BEER_MOTION}
                            className='flex w-full'
                        >
                            <Link 
                                href={beer.link} 
                                title={beer.name}
                                className={`
                                    flex
                                    flex-col
                                    justify-end
                                    gap-10
                                    relative
                                    overflow-hidden
                                    w-full
                                    h-auto
                            `}>
                                <div className='flex flex-row items-end relative w-full aspect-[3/2]'>
                                    <div className='w-1/2'>
                                        <Image 
                                            src={beer.image} 
                                            alt={beer.name } 
                                            width={150}
                                            height={0}
                                            className="object-contain w-full h-auto"
                                        />
                                    </div>
                                    {beer.image2 && (
                                        <div className='w-1/2'>
                                            <Image 
                                                src={beer.image2} 
                                                alt={`${beer.name } 두번째 이미지`} 
                                                width={150}
                                                height={0}
                                                className="object-contain w-full h-auto"
                                            />
                                        </div>
                                    )}
                                </div>
                                <DrinksName name={beer.name} scrollRef={scrollRef} />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductBeer;