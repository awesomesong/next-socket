'use client';

import { useEffect, useState } from 'react';
import ImageSlider, { ImageSliderItem } from '@/src/app/components/ImageSlider';

type Props = {
  images: ImageSliderItem[];
  alt: string;
};

export default function FragranceHeroClient({ images, alt }: Props) {
  const [sliderIndex, setSliderIndex] = useState(0);

  // 페이지 전환 시 첫 이미지로 리셋
  useEffect(() => {
    setSliderIndex(0);
  }, [alt]);

  return (
    <div className="fragrance-detail-image-box group">
      <div className="fragrance-img-size bg-stone-200/20 dark:bg-stone-800/20">
        <ImageSlider
          images={images}
          currentIndex={sliderIndex}
          onSelectIndex={setSliderIndex}
          alt={alt}
          sizes="(max-width: 480px) 100vw, (max-width: 768px) 200px, (max-width: 1024px) 240px, 280px"
          variant="default"
          aspectRatio="3/4"
        />
      </div>
    </div>
  );
}

