'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AnimatedLogo from '@/src/app/components/AnimatedLogo';
import Button from '@/src/app/components/Button';

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-default text-default items-center">
      {/* 이미지와 같은 너비 컬럼으로 헤더·메인 정렬 */}
      <div className="w-full sm:w-[320px] flex flex-col flex-1 gap-4 sm:gap-8 px-4 sm:px-0">
        {/* 상단 헤더 — 이미지와 같은 너비, 왼쪽 정렬 */}
        <header className="shrink-0 pt-6 sm:pt-8 flex justify-start">
          <AnimatedLogo />
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex flex-1 flex-col items-center justify-center pb-12">
          <h2 className="sr-only">Not Found Page</h2>

          <div className="relative w-full aspect-square sm:w-[320px] sm:h-[320px] sm:aspect-auto">
            <Image
              src="/image/404_not_found.png"
              alt=""
              fill
              unoptimized={true}
              priority={true}
              className="object-contain"
            />
          </div>

          <p className="mt-6 text-sm sm:text-base text-neutral-500 dark:text-lavender-muted font-light tracking-wide text-center">
            요청하신 페이지를 찾을 수 없어요
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="scent"
              onClick={() => router.push('/')}
              className="px-8"
            >
              홈으로
            </Button>
            <Button
              type="button"
              variant="ghostLavender"
              onClick={() => router.back()}
              className="px-8"
            >
              뒤로 가기
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}