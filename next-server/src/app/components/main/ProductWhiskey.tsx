'use client'; 
import { useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import drinksData from '@/src/app/data/drinks';
import DrinksName from './DrinksName';
import Link from 'next/link';
import clsx from 'clsx';

const ProductWhiskey = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const drinks = drinksData;
    const whiskeys = useMemo(() => {
        return drinks.filter((drink) => drink.type === 'whiskey');
     }, []); 
    
    return (
        <motion.section
            ref={scrollRef}
            className="product-layout bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800"
            initial={{ opacity: 0, x: -30 }}
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
                    위스키
                </motion.h2>
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
                {whiskeys.map((whiskey, index) => (
                    <motion.div
                        key={whiskey.name}
                        initial={{ left: index === 0 ? '0' : '0' }}
                        whileInView={{ left: index === 0 ? '14%' : '-12%' }} 
                        viewport={{ amount: 0.6, once: true }}  
                        transition={{ duration: .5, ease: "easeOut" }} 
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
        </motion.section>
    );
};

export default ProductWhiskey;
