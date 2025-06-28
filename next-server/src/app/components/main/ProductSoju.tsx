'use client';
import React, { useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DrinksName from './DrinksName';
import drinksData from '@/src/app/data/drinks';

const ProductSoju: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const drinks = drinksData;
    const sojus = useMemo(() => {
        return drinks.filter((drink) => drink.type === 'soju');
    }, []); 

    return (
        <motion.section
            ref={scrollRef}
            className="product-layout bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
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
                    소주
                </motion.h2>
            </div>
            <div className="
                product-box
                grid 
                grid-cols-3 
                md:grid-cols-6 
                md:my-40
                my-20
                min-[320px]:gap-10
                gap-4
                items-end
                w-fit
            ">
                {sojus.map((soju) => (
                    <Link
                        key={soju.name}
                        href={soju.link} 
                        title={soju.name}
                        className="
                            flex 
                            flex-col 
                            items-center 
                            gap-10
                        "
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ amount: 0.5, once: true }}
                            transition={{
                                opacity: { duration: 0.4, ease: 'easeOut' },
                            }}
                            className="w-full aspect-[3/4]"
                        >
                            <Image
                                src={soju.image}
                                alt={soju.name}
                                width={300}
                                height={400}
                                sizes="(max-width: 768px) 30vw, 100vw"
                                className="w-full object-contain"
                            />
                        </motion.div>
                        <DrinksName name={soju.name} scrollRef={scrollRef} />
                    </Link>
                ))}
            </div>
        </motion.section>
    );
};

export default ProductSoju;