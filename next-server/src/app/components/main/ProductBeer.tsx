'use client'
import React, { useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import drinksData from '@/src/app/data/drinks';
import DrinksName from './DrinksName';

const ProductBeer = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const beers = useMemo(() => drinksData.filter((drink) => drink.type === 'beer'), [drinksData]); 
    const otherBeers = useMemo(() => beers.slice(1), [beers]);
    const firstBeer = beers[0];

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
                        initial={{ scale: 1 }}
                        whileInView={{ scale: [1, 1.05, 1] }}
                        viewport={{ root: scrollRef, once: true }}
                        transition={{ duration: 1 }}
                        className='flex'
                    >
                        <Link 
                            href={firstBeer.link} 
                            title={firstBeer.name}
                            className={`
                                relative
                                overflow-hidden
                                w-[210px]
                                h-[400px]
                                md:w-[270px]
                                md:h-[460px]
                        `}>
                            <Image 
                                src={firstBeer.image} 
                                alt={firstBeer.name } 
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
                        <motion.span
                            initial={{ opacity: .3 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ amount: .3, once: true }}
                        >
                            <span>hite</span>
                        </motion.span>
                        <motion.span
                            initial={{ opacity: .3 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ amount: .3, once: true }}
                            transition={{ delay: .3 }}
                        >
                            <span>EXTRA</span>
                        </motion.span>
                        <motion.span
                            initial={{ opacity: .3 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ amount: .3, once: true }}
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
                    {otherBeers.map((beer) => (
                        <motion.div
                            key={beer.name}
                            initial={{ scale: .7, opacity: 0 }}
                            whileInView={{ scale: [.7, 1], opacity: 1 }}
                            viewport={{ once: true }}  
                            transition={{ duration: .5, ease: "easeOut" }}
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
                                            height={200}
                                            className="object-contain"
                                        />
                                    </div>
                                    {beer.image2 && (
                                        <div className='w-1/2'>
                                            <Image 
                                                src={beer.image2} 
                                                alt={`${beer.name } 두번째 이미지`} 
                                                width={150}
                                                height={200}
                                                className="object-contain"
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