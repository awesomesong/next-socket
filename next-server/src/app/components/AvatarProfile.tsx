"use client";
import { DefaultSession } from "next-auth";
import { useSession } from "next-auth/react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { CldUploadButton, CloudinaryUploadWidgetResults } from "next-cloudinary";
import { IoCamera } from "react-icons/io5";
import { RiSave3Fill } from "react-icons/ri";
import toast from "react-hot-toast";
import Button, { ghostMediumButtonClassName } from "./Button";
import FallbackNextImage from "./FallbackNextImage";
import { updateProfile } from "@/src/app/lib/updateProfile";
import ScentUserAvatar from "./ScentUserAvatar";
import clsx from "clsx";

interface AvatarProfileProps {
  user?: DefaultSession["user"];
}

export type CloudinaryUploadWidgetResult = {
  event: "success" | "error" | "abort" | string;
  info: string | {
    id: string;
    batchId: string;
    asset_id: string;
    public_id: string;
    version: number;
    version_id: string;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: 'image' | 'video' | 'raw' | 'auto';
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    placeholder: boolean;
    url: string;
    secure_url: string;
    original_filename: string;
  };
};

const AvatarProfile: React.FC<AvatarProfileProps> = ({ user }) => {
  const { update } = useSession();

  const {
    watch,
    handleSubmit,
    setValue,
  } = useForm<FieldValues>({
    defaultValues: {
      image: user?.image,
    },
  });

  const image = watch("image");

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (typeof result.info === 'string') {
      toast.error("이미지 업로드에 실패했습니다.");
      return;
    }

    const uploadedUrl = (result.info as { secure_url: string }).secure_url;

    if (!uploadedUrl) {
      toast.error("이미지 업로드에 실패했습니다.");
      return;
    }

    setValue("image", uploadedUrl, { shouldValidate: true });
    toast("사진 저장 버튼을 눌러 프로필을 저장하세요.", {
      icon: "💾",
      duration: 4000,
    });
  };

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    const newImage = data.image;

    // ✅ 변경된 이미지가 없으면 저장하지 않음
    if (!newImage) {
      toast.error("이미지를 선택해주세요.");
      return;
    }

    try {
      // ✅ lib 함수 사용으로 코드 간소화
      const result = await updateProfile({ image: data.image });
      
      toast.success("프로필이 수정되었습니다.");
      setValue("image", result.image, { shouldValidate: false });
      
      await update(result);
      
    } catch {
      toast.error("프로필 수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="
        flex
        flex-col
        items-center
        gap-3
        relative
      "
    >
      <h2 className="text-xl">
        <span className="text-gradient-scent">프로필 관리</span>
      </h2>
      <div
        className="
          relative
          w-[150px]
          h-[150px]
        "
      >
        {image || user?.image ? (
          <span
            className="
              block
              relative
              overflow-hidden
              w-full 
              h-full
              rounded-full
            "
          >
            <FallbackNextImage
              key={`${image || user?.image}-${Date.now()}`}  // ✅ 강제 리렌더링을 위한 고유 key
              src={image || user?.image}
              alt={`${user?.name || '사용자'} 프로필 이미지`}
              fill
              unoptimized={true}
              priority={false}
              className="object-cover"
            />
          </span>
        ) : (
          <ScentUserAvatar className="drop-shadow-lg" />
        )}
      </div>
      <div className="flex flex-row flex-wrap justify-center gap-2 sm:gap-3">
        <CldUploadButton
          options={{
            maxFiles: 1,
            clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
            resourceType: "image",
            sources: ["local", "camera"],
            showAdvancedOptions: false,
            showSkipCropButton: true,
            showPoweredBy: false,
            singleUploadAutoClose: true,
          }}
          onSuccess={handleUpload}
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET}
          className={clsx(
            "inline-flex items-center justify-center gap-2 cursor-pointer",
            ghostMediumButtonClassName
          )}
        >
          <IoCamera size={20} aria-hidden />
          프로필 사진 편집
        </CldUploadButton>
        <Button type="submit" variant="scent" size="md" className="gap-2">
          <RiSave3Fill size={20} aria-hidden />
          사진 저장
        </Button>
      </div>
    </form>
  );
};

export default AvatarProfile;
