import Image from "next/image";
import { useState } from "react";

const FallbackNextImage = ({ src, alt, ...props }: { src: string; alt: string } & any) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => setImgSrc("/image/error_404.png")}
        />
    );
};

export default FallbackNextImage;
