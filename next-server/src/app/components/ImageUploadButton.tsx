'use client';
import { CldUploadButton, CloudinaryUploadWidgetResults, type CloudinaryUploadWidgetOptions } from 'next-cloudinary';
import { HiPhoto } from 'react-icons/hi2';
import { FaFileUpload } from "react-icons/fa";
import { memo, useMemo } from 'react';

type Variant = 'default' | 'compact';

type ImageUploadButtonProps = {
  onUploadSuccess: (result: CloudinaryUploadWidgetResults) => void;
  variant?: Variant;
  maxFiles?: number;
  isLoading?: boolean;
};

const ImageUploadButton = ({
  onUploadSuccess,
  variant = 'default',
  maxFiles = 1,
}: ImageUploadButtonProps) => {

  const options: CloudinaryUploadWidgetOptions = useMemo(
    () => ({
      maxFiles,
      clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
      resourceType: "image",
      sources: ["local", "camera"],
      showAdvancedOptions: false,
      showSkipCropButton: true,
      showPoweredBy: false,
      singleUploadAutoClose: true,
    }),
    [maxFiles]
  );

  const icon =
    variant === 'compact' ? (
      <HiPhoto size={30} fill="url(#scent-nav-gradient)" />
    ) : (
      <span className='
            flex
            flex-row
            items-center
            gap-1
            w-fit
            px-3
            py-2
            rounded-md
            text-neutral-200
            bg-blue-600
            cursor-pointer
        '>
        <FaFileUpload size={16} />
        사진 업로드
      </span>
    );

  return (
    <CldUploadButton
      options={options}
      onSuccess={onUploadSuccess}
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET}
    >
      {icon}
    </CldUploadButton>
  );
};

export default memo(ImageUploadButton);
