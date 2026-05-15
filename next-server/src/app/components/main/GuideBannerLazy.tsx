'use client';
import dynamic from 'next/dynamic';

const GuideBanner = dynamic(
  () => import('@/src/app/components/main/GuideBanner'),
  { ssr: false }
);

export default function GuideBannerLazy() {
  return <GuideBanner />;
}
