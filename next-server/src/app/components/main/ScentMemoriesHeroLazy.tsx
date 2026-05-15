'use client';

import dynamic from 'next/dynamic';
import { ScentMemoriesHeroSkeleton } from '@/src/app/components/FragranceSkeleton';

const ScentMemoriesHero = dynamic(
  () => import('@/src/app/components/main/ScentMemoriesHero'),
  { loading: () => <ScentMemoriesHeroSkeleton /> }
);

export default function ScentMemoriesHeroLazy() {
  return <ScentMemoriesHero />;
}
