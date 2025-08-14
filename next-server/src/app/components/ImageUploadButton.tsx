'use client';
import { CldUploadButton } from 'next-cloudinary';
import { HiPhoto } from 'react-icons/hi2';
import { FaFileUpload } from "react-icons/fa";

type Variant = 'default' | 'compact';

type ImageUploadButtonProps = {
  onUploadSuccess: (result: any) => void;
  variant?: Variant;
  maxFiles?: number;
  isLoading?: boolean;
};

const ImageUploadButton = ({
  onUploadSuccess,
  variant = 'default',
  maxFiles = 1,
  isLoading = false,
}: ImageUploadButtonProps) => {

  const icon =
    variant === 'compact' ? (
        <HiPhoto size={30} className="text-sky-500"/>
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
            <FaFileUpload size={16}/>
            사진 업로드
        </span>
    );

  return (
    <CldUploadButton
      options={{ 
        maxFiles,
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"], 
        resourceType: "image",
        sources: ['local', 'camera'],
        showAdvancedOptions: false,
        showSkipCropButton: true,
        showPoweredBy: false,
        singleUploadAutoClose: true,
      }}
      onSuccess={onUploadSuccess}
      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET}
    >
      {icon}
    </CldUploadButton>
  );
};

export default ImageUploadButton;