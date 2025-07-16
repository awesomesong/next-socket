import drinksDetailData from '@/src/app/data/drinksDetail';

interface Props {
  children: React.ReactNode;
  params: { name: string };
}

export async function generateMetadata({ params }: { params: { name: string } }) {
  const { name } = await params;
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
}

export default function DrinkNameLayout({ children }: Props) {
  return <>{children}</>;
}