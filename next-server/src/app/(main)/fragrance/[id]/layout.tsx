import { cache } from 'react';
import { getFragranceBySlugServer } from '@/src/app/lib/getFragrances';
import ScrollToTopOnMount from '@/src/app/components/ScrollToTopOnMount';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const getParams = cache(async (params: Promise<{ id: string }>) => {
  return await params;
});

const base = 'https://www.devsonghee.com';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await getParams(params);
  try {
    const { fragrance } = await getFragranceBySlugServer(id);
    const raw = fragrance?.description ?? '';
    const description = raw.replace(/<[^>]*>/g, '').slice(0, 150);
    return {
      metadataBase: new URL(base),
      title: `${fragrance.brand} · ${fragrance.name}`,
      description,
      openGraph: {
        title: `${fragrance.brand} · ${fragrance.name}`,
        description,
        url: `${base}/fragrance/${id}`,
        type: 'article',
      },
      keywords: ['향수', '퍼퓸', 'Fragrance', 'Perfume', fragrance.brand],
    };
  } catch {
    return {
      metadataBase: new URL(base),
      title: 'Fragrance',
      description: '향수 상세',
      openGraph: {
        title: 'Fragrance',
        description: '향수 상세',
        url: `${base}/fragrance/${id}`,
        type: 'article',
      },
      keywords: ['향수', '퍼퓸', 'Fragrance', 'Perfume'],
    };
  }
}

export default async function FragranceIdLayout({ children }: Props) {
  return (
    <>
      <ScrollToTopOnMount />
      {children}
    </>
  );
}
