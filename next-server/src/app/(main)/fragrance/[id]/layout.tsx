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
    const imageUrl = fragrance?.images?.[0] || '/image/metadata/main_web.png';
    return {
      title: `${fragrance.brand} · ${fragrance.name}`,
      description,
      openGraph: {
        title: `${fragrance.brand} · ${fragrance.name}`,
        description,
        url: `${base}/fragrance/${id}`,
        type: 'article',
        images: [{ url: imageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${fragrance.brand} · ${fragrance.name}`,
        description,
        images: [imageUrl],
      },
      keywords: ['향수', '퍼퓸', 'Fragrance', 'Perfume', fragrance.brand],
    };
  } catch {
    return {
      title: 'Fragrance',
      description: '향수 상세',
      openGraph: {
        title: 'Fragrance',
        description: '향수 상세',
        url: `${base}/fragrance/${id}`,
        type: 'article',
        images: [{ url: '/image/metadata/main_web.png', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Fragrance',
        description: '향수 상세',
        images: ['/image/metadata/main_web.png'],
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
