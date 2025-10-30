'use client'; 
import { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import drinksData from '@/src/app/data/drinks';
import DrinksName from './DrinksName';
import Link from 'next/link';
import clsx from 'clsx';

// ✅ 정적 데이터 외부 추출
const WHISKEYS_DATA = drinksData.filter((drink) => drink.type === 'whiskey');

// ✅ Motion transition 외부 추출
const WHISKEY_MOTION_TRANSITION = {
  duration: 0.5,
  ease: "easeOut" as any,
};

const WHISKEY_MOTION_VIEWPORT = {
  amount: 0.6,
  once: true,
};

const ProductWhiskey = () => {
    const scrollRef = useRef<HTMLDivElement>(null); 
    
    return (
        <div ref={scrollRef} className="product-layout">
            <div className="product-title-layout">
                <h2 className="product-title">위스키</h2>
            </div>
            <div 
                className="
                    product-box
                    flex 
                    lg:justify-around 
                    justify-between
                    items-baseline
                    gap-20 
                    my-20
                "
            >
                {WHISKEYS_DATA.map((whiskey, index) => (
                    <motion.div
                        key={whiskey.name}
                        initial={{ left: index === 0 ? '0' : '0' }}
                        whileInView={{ left: index === 0 ? '14%' : '-12%' }} 
                        viewport={WHISKEY_MOTION_VIEWPORT}
                        transition={WHISKEY_MOTION_TRANSITION} 
                        className='relative'
                    >
                        <Link 
                            href={whiskey.link} 
                            title={whiskey.name}
                            className='
                                flex 
                                flex-col 
                                items-center 
                                gap-10
                                max-[420px]:gap-6
                        '>
                            <div className={clsx(`
                                flex
                                items-end
                                relative 
                                lg:h-[400px]
                                min-[640px]:h-[300px]
                                min-[420px]:h-[200px]
                                min-[320px]:h-[150px]
                                h-[110px]
                                `,
                                index === 0 
                                ? 'lg:w-[168px] min-[640px]:w-[128px] min-[420px]:w-[84px] w-[70px]' 
                                : 'lg:w-[400px] min-[640px]:w-[330px] min-[420px]:w-[200px] min-[320px]:w-[160px] w-[100px]'
                            )}>
                                <Image 
                                    src={whiskey.image} 
                                    alt={whiskey.name} 
                                    fill
                                    sizes='(max-width: 640px) 50vh, (max-width: 1024px) 80vh, 100vh'
                                    className={clsx(`
                                        object-contain
                                        object-bottom
                                        `,
                                        index === 0 && 'object-right max-[320px]:object-center'
                                    )}
                                />
                            </div>
                            <DrinksName name={whiskey.name} scrollRef={scrollRef} />
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ProductWhiskey;
