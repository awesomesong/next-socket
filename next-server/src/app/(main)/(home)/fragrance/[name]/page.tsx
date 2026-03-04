import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getFragranceSlugsServer, getFragranceBySlugServer } from '@/src/app/lib/getFragrances';
import FragranceDetailClient from '@/src/app/components/FragranceDetailClient';

// 빌드 시 DB에서 slug 목록을 직접 조회하여 정적 경로 생성
export async function generateStaticParams() {
  const slugs = await getFragranceSlugsServer();
  return slugs.map((slug) => ({ name: slug }));
}

// DB에 없는 slug도 요청 시 on-demand SSR로 처리
export const dynamicParams = true;

type Props = {
  params: Promise<{ name: string }>;
};

export default async function FragrancePage({ params }: Props) {
  const { name: slug } = await params;
  const queryClient = new QueryClient();

  // Prisma를 직접 호출하여 서버에서 prefetch (HTTP 왕복 없음)
  await queryClient.prefetchQuery({
    queryKey: ['fragrance', slug],
    queryFn: () => getFragranceBySlugServer(slug),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FragranceDetailClient slug={slug} />
    </HydrationBoundary>
  );
}

