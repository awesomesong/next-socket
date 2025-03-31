'use client';
import { BASE_URL } from "@/config";
import { DefaultSession } from "next-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import Modal from "../Modal";
import Input from "../Input";
import Image from "next/image";
import { PiUserCircleFill } from "react-icons/pi";
import { CldUploadButton } from "next-cloudinary";
import Button from "../Button";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface SettingsModalProps {
    isOpen?: boolean;
    onCloseModal: () => void;
    user: DefaultSession["user"];
}

const SettingsModal:React.FC<SettingsModalProps> = ({
    isOpen,
    onCloseModal,
    user
}) => {
    const router = useRouter();
    const [ isLoading, setIsLoading ] = useState(false);
    const { data: session, status, update } = useSession();

    const {
        register,
        watch,
        handleSubmit,
        setValue,
        formState: {
            errors, 
        }
    } = useForm<FieldValues>({
        defaultValues: {
            name: user?.name,
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
        setIsLoading(true);

        await fetch(`${BASE_URL}/api/settings`, {
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
            update(data);
        })
        .catch(() => {
            toast.error('프로필 수정 중 오류가 발생했습니다.');
        })
        .finally(() => {
            setIsLoading(false);
            onCloseModal();
            router.refresh();
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onCloseModal={onCloseModal}
        >
            <form 
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="space-y-12">
                    <div className="border-b border-gray-900/10">
                        <h2 className="
                            text-base
                            font-semibold
                            leading-7
                            text-gray-900
                        ">
                            프로필
                        </h2>
                        <p className="
                            mt-1 text-sm leading-6 text-gray-600
                        ">
                            프로필을 수정할 수 있습니다.
                        </p>

                        <div className="
                            mt-10
                            flex
                            flex-col
                            gap-y-8
                            text-black
                        ">
                            <Input 
                                disabled={isLoading}
                                label="Name"
                                id="name"
                                errors={errors}
                                register={register}
                                placement="outside-left"
                                variant="flat"
                            />
                            <div>
                                <label 
                                    className="
                                    block
                                    text-sm
                                    font-medium
                                    leading-6
                                    text-gray-900
                                    "
                                >
                                    Photo
                                </label>
                                <div 
                                    className="
                                        mt-2
                                        flex
                                        items-center
                                        gap-x-3
                                    "
                                >
                                    <div className="
                                        w-8
                                        h-8
                                        overflow-hidden
                                        relative
                                        rounded-full
                                    ">
                                        {image || user?.image ? (
                                            <Image
                                                src={image || user?.image}
                                                alt={image || user?.name +'이미지'}
                                                fill
                                                unoptimized={true}
                                                className="object-cover"
                                            />
                                            )
                                            : <PiUserCircleFill className="w-full h-full"/>
                                        }
                                    </div>
                                    <CldUploadButton
                                        options={{ maxFiles: 1}}
                                        onSuccess={handleUpload}
                                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET}
                                        className="
                                            flex
                                            justify-center
                                            rounded-md
                                            px-3
                                            py-2
                                            font-semibold
                                            focus-visible:outline
                                            focus-visible:outline-2
                                            focus-visible:outline-offset-2
                                        "
                                    >
                                        프로필 사진 수정
                                    </CldUploadButton>                                
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div 
                            className="
                                mt-6
                                flex
                                items-center
                                justify-end
                                gap-x-6
                            "
                        >
                            <Button
                                disabled={isLoading}
                                type="button"
                                secondary
                                onClick={onCloseModal}
                                color="secondary"
                                variant="shadow"
                            >
                                취소
                            </Button>
                            <Button
                                disabled={isLoading}
                                type="submit"
                                color="default"
                                variant="shadow"
                            >
                                저장
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    )
}

export default SettingsModal;
