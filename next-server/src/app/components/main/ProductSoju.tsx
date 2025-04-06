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
        <div 
            ref={scrollRef} 
            className="product-layout"
        >
            <div className="product-title-layout">
                <h2 className="product-title">소주</h2>
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
                            initial={{ width: '80%', opacity: 0 }}
                            whileInView={{ width: '100%', opacity: 1 }}
                            viewport={{ amount: .8, once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }} 
                            className='max-[480px]:w-[140px] w-[80px]'
                        >
                            <Image
                                src={soju.image}
                                alt={soju.name }
                                width={0}
                                height={0}
                                sizes='100vw'
                                className="w-full h-fit"
                            />
                        </motion.div>
                        <DrinksName name={soju.name} scrollRef={scrollRef} />
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ProductSoju;