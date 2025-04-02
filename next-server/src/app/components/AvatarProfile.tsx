'use client';
import { DefaultSession } from "next-auth";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { CldUploadButton } from "next-cloudinary";
import Image from "next/image";
import { PiUserCircleFill } from "react-icons/pi";
import { IoCamera } from "react-icons/io5";
import { RiSave3Fill } from "react-icons/ri";
import toast from "react-hot-toast";
import { Button } from "@heroui/react";

interface AvatarProfileProps {
    user?: DefaultSession["user"];
}

const AvatarProfile:React.FC<AvatarProfileProps> = ({
    user
}) => {
    const router = useRouter();
    const { data: session, status, update } = useSession();

    const {
        register,
        trigger,
        watch,
        handleSubmit,
        setValue,
        formState: {
            errors, 
        }
    } = useForm<FieldValues>({
        defaultValues: {
            image: user?.image,
        }
    });

    const image = watch('image');

    const handleUpload = (result: any) => {
        setValue('image', result?.info?.secure_url, {
            shouldValidate: true
        });
    };

    const onSubmit: SubmitHandler<FieldValues> = async (data) => {

        await fetch(`/api/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            toast.success('프로필이 수정되었습니다.');
            update(data);
        })
        .catch(() => {
            toast.error('프로필 수정 중 오류가 발생했습니다.');
        })
        .finally(() => {
            router.refresh();
        });
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
                프로필 관리
            </h2>
            <div className="
                relative
                w-[150px]
                h-[150px]
            ">
                {image || user?.image ?
                    (
                        <span className="
                            block
                            relative
                            overflow-hidden
                            w-full 
                            h-full
                            rounded-full
                        ">
                            <Image
                                src={image || user?.image}
                                alt={image || user?.name +'이미지'}
                                fill
                                unoptimized={true}
                                priority={false}
                                className="object-cover"
                            />
                        </span>
                    )
                    : <PiUserCircleFill className="w-full h-full"/>
                }
            </div>
            <div className="flex flex-row gap-3">
                <CldUploadButton 
                    options={{ 
                        maxFiles: 1,
                        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"], 
                        resourceType: "image"
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
                    <IoCamera 
                        size={30}
                        className="mr-2"    
                    />
                    프로필 사진 편집
                </CldUploadButton>
                <Button
                    type="submit"
                    color="default"
                    variant="ghost"
                    size="lg"
                    radius="sm"
                    className='min-w-10 gap-0'
                >
                    <RiSave3Fill 
                        size={30}
                        className="mr-2"
                    />
                    사진 저장
                </Button>
            </div>
        </form>
    )
}

export default AvatarProfile
