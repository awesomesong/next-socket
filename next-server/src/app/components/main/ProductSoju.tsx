'use client';
import React, { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DrinksName from './DrinksName';
import drinksData from '@/src/app/data/drinks';

// ✅ 정적 데이터 및 motion variants를 외부로 추출 (한 번만 생성)
const SOJUS_DATA =  drinksData.filter((drink) => drink.type === 'soju');
const SOJU_MOTION_VARIANTS = {
  initial: { opacity: 0, scale: 0.8 },
  whileInView: { opacity: 1, scale: 1 },
  transition: {
    opacity: { duration: 0.4, ease: 'easeOut' as any },
  },
  viewport: { amount: 0.5, once: true },
};

const ProductSoju: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    
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
                {SOJUS_DATA.map((soju) => (
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
                            {...SOJU_MOTION_VARIANTS}
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
        </div>
    );
};

export default ProductSoju;