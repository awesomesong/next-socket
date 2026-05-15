'use client';
import dynamic from 'next/dynamic';

const ProductFragrance = dynamic(
  () => import('@/src/app/components/main/ProductFragrance'),
  { ssr: false }
);

export default function ProductFragranceLazy() {
  return <ProductFragrance />;
}
