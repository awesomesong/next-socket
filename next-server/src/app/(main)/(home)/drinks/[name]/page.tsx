'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import drinksDetailData from '@/src/app/data/drinksDetail';
import clsx from 'clsx';
import Image from 'next/image';
import {  motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const SsrDOMPurify = dynamic(() => import('../../../../components/SsrDOMPurify'), {
    ssr: false,
});

const DrinksPage = ({params } : { params: { name: string } }) => { 
    const router = useRouter();

    const { name } = params;

    const drink = useMemo(() => {
        return drinksDetailData.find(drink => drink.slug === name);
    }, [name]);

    if (!drink) {
        return router.push('/not_found');
    }

  return (
    <div className='
        flex 
        flex-col 
        items-top
        mx-auto
        max-w-[2400px]
    '>
        <p className='
            relative 
            w-full
            aspect-[21/9]
        '>
            <Image 
                src={drink.image_header} 
                alt={drink.name} 
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
            />
        </p>
         {drink.image_footer && drink.description && 
            <div className='relative'>
                <p className='
                    relative 
                    w-full
                    aspect-[21/9]
                '>
                    <Image 
                        src={drink.image_footer} 
                        alt={drink.name} 
                        fill
                        sizes="100vw"
                        className="object-cover"
                    />
                </p>
                <motion.div
                    initial={{ top: '60%' }}
                    whileInView={{ top: '50%' }} 
                    viewport={{ amount: 0.4 }}
                    transition={{ ease: "easeOut" }} 
                    className={clsx(`absolute
                                    top-1/2
                                    -translate-y-1/2`,
                                    drink.type?.includes('left') 
                                        ? 'xl:left-1/3 lg:left-1/4 left-6' 
                                        : 'left-1/2',
                                )}
                >
                    <SsrDOMPurify 
                        content={drink.description} 
                        className={clsx("drink-info", drink.type?.includes('dark') ? 'text-neutral-950' : 'text-neutral-200')}
                    />
                </motion.div>
            </div>
        }
        {drink.image && drink.info && 
            <div className='
                flex 
                flex-row 
                items-center 
                relative
                my-20
                mx-2
            '>
                <p className='
                    flex
                    justify-center
                    basis-1/2
                    relative 
                '>
                    <Image 
                        src={drink.image} 
                        alt={drink.name} 
                        width={0}
                        height={0}
                        sizes="100vw"
                        className={clsx(
                            drink.type === 'wide' 
                            ? "sm:w-[220px] w-[120px] h-fit"
                            : "sm:w-[100px] w-[70px] h-fit"
                        )}
                    />
                </p>
                <motion.div
                    initial={{ top: '70%' }}
                    whileInView={{ top: '50%' }} 
                    viewport={{ amount: 0 }}
                    transition={{ ease: "easeOut" }} 
                    className='
                        basis-1/2 
                        absolute 
                        left-1/2
                        -translate-y-1/2
                    '
                >
                    <SsrDOMPurify 
                        content={drink.info} 
                        className="drink-info text-[clamp(11px,2.5vw,20px)]"
                    />
                </motion.div>
            </div>
        }         
    </div>
  );
};

export default DrinksPage;
