import type { Metadata } from 'next';
import ScanClient from '@/src/app/components/scan/ScanClient';

export const metadata: Metadata = {
  title: '향수 스캔',
  description:
    '카메라로 향수 사진을 찍으면 AI가 어떤 향수인지 식별하고 최저가 구매 사이트로 안내해드립니다.',
  openGraph: {
    title: '향수 스캔 | Scent Memories',
    description: '사진 한 장으로 향수 식별 + 최저가 구매까지.',
    images: [{ url: '/image/metadata/main_web.png', width: 1200, height: 627 }],
  },
};

export default function ScanPage() {
  return (
    <div className="px-4 pt-8 pb-4 md:p-8 max-w-[1440px] w-full mx-auto">
      <h2 className="text-top text-center">
        <span className="text-gradient-scent">향수 스캔</span>
      </h2>
      <ScanClient />
    </div>
  );
}
