import { getFragranceBySlugServer } from '@/src/app/lib/getFragrances';
import FragranceDetail from '@/src/app/components/fragrance/FragranceDetail';

// 향수 상세는 데이터 변경 빈도가 낮으므로 ISR로 캐싱
export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FragrancePage({ params }: Props) {
  const { id: slug } = await params;
  const { fragrance } = await getFragranceBySlugServer(slug);

  return <FragranceDetail slug={slug} fragrance={fragrance} />;
}
