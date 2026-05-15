"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

/** Cloudinary URL이면 f_auto,q_auto 변환을 삽입해 CDN에서 직접 최적화 */
function optimizeCloudinarySrc(src: string): { src: string; unoptimized: boolean } {
  if (!src.includes('res.cloudinary.com')) return { src, unoptimized: false };
  if (/\/upload\/[a-z]_/.test(src)) return { src, unoptimized: true };
  return { src: src.replace('/upload/', '/upload/f_auto,q_auto/'), unoptimized: true };
}

const FallbackNextImage = ({
  src,
  alt,
  ...props
}: { src: string; alt: string } & ImageProps) => {
  const opt = optimizeCloudinarySrc(src);
  const [imgSrc, setImgSrc] = useState(opt.src);

  useEffect(() => {
    const o = optimizeCloudinarySrc(src);
    setImgSrc(o.src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      unoptimized={opt.unoptimized}
      onError={() => setImgSrc("/image/error_404.png")}
    />
  );
};

export default FallbackNextImage;
