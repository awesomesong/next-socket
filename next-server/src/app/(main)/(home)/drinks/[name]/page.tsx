import { notFound } from 'next/navigation';
import drinksDetailData from '@/src/app/data/drinksDetail';
import Image from 'next/image';
import clsx from 'clsx';
import DrinkMotionWrapper from '@/src/app/components/DrinkMotionWrapper';
import DrinkReviewSection from '@/src/app/components/DrinkReviewSection';

// ✅ SSG: 빌드 타임에 모든 음료 페이지 생성
export async function generateStaticParams() {
  return drinksDetailData.map((drink) => ({
    name: drink.slug,
  }));
}

// ✅ SSG: 정적 생성 설정
export const dynamicParams = false; // generateStaticParams에 없는 경로는 404

type Props = {
  params: Promise<{ name: string }>;
};

export default async function DrinksPage({ params }: Props) {
  const { name } = await params;

  const drink = drinksDetailData.find((drink) => drink.slug === name);

  if (!drink) {
    notFound();
  }

  return (
    <div className='
        flex 
        flex-col 
        items-top
        mx-auto
        max-w-[2400px]
    '>
      {/* ✅ 서버 컴포넌트에서 이미지와 텍스트 직접 렌더링 - SSG로 빌드 타임에 HTML 생성 */}
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
              priority
              sizes="100vw"
              className="object-cover"
            />
          </p>
          {/* ✅ framer-motion은 클라이언트에서만 애니메이션 적용, 콘텐츠는 서버에서 렌더링 */}
          <DrinkMotionWrapper
            type="description"
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
          </DrinkMotionWrapper>
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
          {/* ✅ framer-motion은 클라이언트에서만 애니메이션 적용, 콘텐츠는 서버에서 렌더링 */}
          <DrinkMotionWrapper
            type="info"
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
          </DrinkMotionWrapper>
        </div>
      }
      
      {/* ✅ 리뷰 섹션은 클라이언트 컴포넌트 (실시간 데이터 필요) */}
      <DrinkReviewSection drinkName={drink.name} drinkSlug={name} />
    </div>
  );
}
