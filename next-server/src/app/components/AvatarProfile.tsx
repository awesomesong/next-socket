"use client";
import { DefaultSession } from "next-auth";
import { useSession } from "next-auth/react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { CldUploadButton } from "next-cloudinary";
import { PiUserCircleFill } from "react-icons/pi";
import { IoCamera } from "react-icons/io5";
import { RiSave3Fill } from "react-icons/ri";
import toast from "react-hot-toast";
import { Button } from "@heroui/react";
import FallbackNextImage from "./FallbackNextImage";
import { updateProfile } from "@/src/app/lib/updateProfile";

interface AvatarProfileProps {
  user?: DefaultSession["user"];
}

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

  const handleUpload = (result: any) => {
    const uploadedUrl = result?.info?.secure_url;

    if (!uploadedUrl) {
      toast.error("이미지 업로드에 실패했습니다.");
      return;
    }

    setValue("image", uploadedUrl, { shouldValidate: true });
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
      
    } catch (error: any) {
      toast.error(error.message || "프로필 수정 중 오류가 발생했습니다.");
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
      <h2 className="text-xl">프로필 관리</h2>
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
          <PiUserCircleFill className="w-full h-full" />
        )}
      </div>
      <div className="flex flex-row gap-3">
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
          className="
            flex
            flex-row
            justify-center
            items-center
            relative
            px-6
            py-2
            border-default
            text-default
            btn
            rounded-md
          "
        >
          <IoCamera size={30} className="mr-2" />
          프로필 사진 편집
        </CldUploadButton>
        <Button
          type="submit"
          color="default"
          variant="ghost"
          size="lg"
          radius="sm"
          className="min-w-10 gap-0"
        >
          <RiSave3Fill size={30} className="mr-2" />
          사진 저장
        </Button>
      </div>
    </form>
  );
};

export default AvatarProfile;
