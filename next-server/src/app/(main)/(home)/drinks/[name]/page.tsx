'use client';
import { useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import drinksDetailData from '@/src/app/data/drinksDetail';
import clsx from 'clsx';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import FormReview from '@/src/app/components/FormReview';
import Reviews from '@/src/app/components/Reviews';

const DrinksPage = ({params } : { params: Promise<{ name: string }> }) => {
    const router = useRouter();
    const { data: session } = useSession();

    const { name } = use(params);

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
                priority
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
                    <div 
                        className={clsx("drink-info", drink.type?.includes('dark') ? 'text-neutral-950' : 'text-neutral-200')}
                        dangerouslySetInnerHTML={{ __html: drink.description }}
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
                    <div 
                        className="drink-info text-[clamp(11px,2.5vw,20px)]"
                        dangerouslySetInnerHTML={{ __html: drink.info }}
                    />
                </motion.div>
            </div>
        }
        <div className='md:px-6 md:py-3 px-3'>
            <FormReview id={name} user={session?.user!} />
            <Reviews id={name} name={drink.name} user={session?.user!} />
        </div>
    </div>
  );
};

export default DrinksPage;
