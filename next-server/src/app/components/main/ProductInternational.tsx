'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useMemo, useRef } from 'react';
import Link from 'next/link';
import DrinksName from './DrinksName';
import clsx from 'clsx';
import drinksData from '@/src/app/data/drinks';

const ProductInternational = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const drinks = drinksData;
    const international = useMemo(() => {
        return drinks.filter((drink) => drink.type === 'international');
    }, []); 

    const positionGroup = useMemo(() => ['3vw', '6vw', '9vw'], []);

    return (
        <motion.section
            className="product-layout bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800"
            ref={scrollRef}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <div className="product-title-layout">
                <motion.h2
                    className="product-title"
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    인터내셔널
                </motion.h2>
            </div>
            <div className="
                product-box
                flex 
                flex-row 
                justify-center 
                items-end 
                max-[940px]:items-baseline
                sm:gap-10
                gap-4
                overflow-hidden
                sm:mt-20 
                sm:mb-24
                mt-20
                mb-16
                max-[940px]:mx-4
            ">
                {international.map((product, index) => (
                    <motion.div
                        key={index}
                        initial={{ y: positionGroup[index] }}
                        whileInView={{ y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: "easeOut" }} 
                    >
                        <Link 
                            href={product.link} 
                            title={product.name}
                            className='
                                flex 
                                flex-col 
                                gap-10
                                max-lg:items-center
                            '
                        >
                            {product.image2 ? (
                                <div
                                    className={clsx(`
                                        flex 
                                        flex-row 
                                        items-end 
                                        justify-center
                                        lg:w-[300px]
                                        max-[1023px]:w-[280px]
                                        max-[940px]:w-[200px]
                                        max-[768px]:w-[180px]
                                        max-[640px]:w-[140px]
                                        max-[480px]:w-[110px]
                                        max-[420px]:w-[80px]
                                        max-[320px]:w-[55px]
                                    `)}
                                >
                                    {/* 왼쪽 이미지 */}
                                    <div
                                    className={clsx(
                                        "flex",
                                        index === 0 ? "w-2/5 justify-end" :
                                        index === 2 ? "w-2/5 justify-center" :
                                        "w-1/2 justify-center"
                                    )}
                                    >
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        width={200}
                                        height={300}
                                        className="object-contain"
                                    />
                                    </div>

                                    {/* 오른쪽 이미지 */}
                                    <div
                                    className={clsx(
                                        "flex",
                                        index === 0 ? "w-2/5 justify-center" :
                                        index === 2 ? "w-2/5 justify-start" :
                                        "w-1/2 justify-center"
                                    )}
                                    >
                                    <Image
                                        src={product.image2}
                                        alt={`${product.name} glass`}
                                        width={200}
                                        height={300}
                                        className="object-contain"
                                    />
                                    </div>
                                </div>
                                ) : (
                                // 단일 이미지일 경우
                                <div
                                    className={clsx(`
                                    relative aspect-[2/3]
                                    lg:w-[300px]
                                    max-[1023px]:w-[280px]
                                    max-[940px]:w-[200px]
                                    max-[768px]:w-[180px]
                                    max-[640px]:w-[140px]
                                    max-[480px]:w-[110px]
                                    max-[420px]:w-[80px]
                                    max-[320px]:w-[55px]
                                    `)}
                                >
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 40vw, 120px"
                                        className="object-contain"
                                    />
                                </div>
                                )}
                            <DrinksName name={product.name} scrollRef={scrollRef} />
                        </Link>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};

export default ProductInternational;
