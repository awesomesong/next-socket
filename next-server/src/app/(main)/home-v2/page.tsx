import type { Metadata } from 'next';
import FeatureShowcase from '@/src/app/components/main/FeatureShowcase';
import ProductFragrance from '@/src/app/components/main/ProductFragrance';
import GuideBanner from '@/src/app/components/main/GuideBanner';

export const metadata: Metadata = {
  title: 'Scent Memories — 새 홈 (비교용)',
  robots: { index: false },
};

export default function HomeV2() {
  return (
    <div className="flex flex-col relative">
      <GuideBanner />
      <FeatureShowcase />
      <ProductFragrance />
    </div>
  );
}
