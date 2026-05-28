import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/prisma/db';
import ScanResult from '@/src/app/components/scan/ScanResult';

type Props = {
  params: Promise<{ scanId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scanId } = await params;
  const scan = await prisma.scanResult.findUnique({
    where: { id: scanId },
    select: { brand: true, name: true },
  });

  if (!scan) {
    return {
      title: '스캔 결과',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${scan.brand} ${scan.name} | 스캔 결과`,
    robots: { index: false, follow: false },
  };
}

export default async function ScanResultPage({ params }: Props) {
  const { scanId } = await params;

  const scan = await prisma.scanResult.findUnique({
    where: { id: scanId },
  });
  if (!scan) notFound();

  const matched = scan.matchedSlug
    ? await prisma.fragrance.findUnique({
        where: { slug: scan.matchedSlug },
        select: { slug: true, brand: true, name: true, images: true },
      })
    : null;

  return (
    <div className="px-4 pt-8 pb-4 md:p-8 max-w-[1440px] w-full mx-auto">
      <div className="text-center">
        {/* Brand — label 역할: 흐리게, 굵기 없이, 자간 넓게 */}
        <p className="text-[13px] lg:text-sm font-normal tracking-[0.3em] uppercase text-text-secondary mb-2">
          {scan.brand}
        </p>
        {/* Name — 메인 헤드라인: 브레이크포인트별 크기 조정 */}
        <h2 className="font-josefin font-bold text-[22px] md:text-[28px] lg:text-4xl leading-tight tracking-tight">
          <span className="text-gradient-scent">{scan.name}</span>
        </h2>
      </div>
      <section className="mt-6 md:mt-10">
        <ScanResult
          data={{
            scanId: scan.id,
            brand: scan.brand,
            name: scan.name,
            notes: scan.notes ?? undefined,
            description: scan.description ?? undefined,
            imageUrl: scan.imageUrl,
            imageWidth: scan.imageWidth,
            imageHeight: scan.imageHeight,
            matchedFragrance: matched,
          }}
        />
      </section>
    </div>
  );
}
