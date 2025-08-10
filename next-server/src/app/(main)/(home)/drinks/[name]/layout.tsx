import { cache } from 'react';
import drinksDetailData from '@/src/app/data/drinksDetail';

interface Props {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
}

// params를 캐시하여 한 번만 해결하도록 함
const getParams = cache(async (params: Promise<{ name: string }>) => {
  return await params;
});

// 동기적으로 메타데이터를 생성하는 함수
const createMetadata = (name: string) => {
  const base = 'https://www.devsonghee.com';
  const drink = drinksDetailData.find((d) => d.slug === name);
  const raw = (drink?.description || drink?.info || '') as string;
  const description = raw.replace(/<[^>]*>/g, '').slice(0, 150);
  
  return {
    metadataBase: new URL(base),
    title: drink?.name || 'Drink',
    description,
    openGraph: {
      title: drink?.name || 'Drink',
      description,
      url: `${base}/drinks/${name}`,
      type: 'article',
    },
    keywords: ['맥주', '하이트', '드링크', 'Beer', 'Hite', '주류'],
  };
};

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await getParams(params);
  return createMetadata(name);
}

export default async function DrinkNameLayout({ children, params }: Props) {
  const { name } = await getParams(params);
  return <>{children}</>;
}