import { Suspense } from 'react';
import { getFragranceBySlugServer } from '@/src/app/lib/getFragrances';
import FragranceDetail from '@/src/app/components/fragrance/FragranceDetail';
import FragranceDetailSkeleton from '@/src/app/components/FragranceDetailSkeleton';

// 향수 상세는 데이터 변경 빈도가 낮으므로 ISR로 캐싱
export const revalidate = 3600;

type Props = {
  params: Promise<{ id: string }>;
};

async function FragranceContent({ slug }: { slug: string }) {
  const { fragrance } = await getFragranceBySlugServer(slug);
  return <FragranceDetail slug={slug} fragrance={fragrance} />;
}

export default async function FragrancePage({ params }: Props) {
  const { id: slug } = await params;

  return (
    <Suspense fallback={<FragranceDetailSkeleton />}>
      <FragranceContent slug={slug} />
    </Suspense>
  );
}
