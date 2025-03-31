'use client';
import { signIn } from "next-auth/react";
import AuthSocialButton from "./AuthSocialButton";
import { BsGoogle } from 'react-icons/bs';
import { RiKakaoTalkFill } from "react-icons/ri";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSocialProps } from "@/src/app/types/common";
import { Suspense } from "react";

const AuthSocial:React.FC<AuthSocialProps> = ({
    onClick,
    disabled,
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams?.get('callbackUrl');

    const socialAction = (action: string) => {
        onClick();
    
        signIn(action, {
            callbackUrl: `${callbackUrl}`
        }).then((callback) => {
            if(callback?.error) {
                toast.error(callback?.error);
            }

            if(callback?.ok && !callback?.error) {
                router.push(`${callbackUrl}`);
                router.refresh();
                toast.success('로그인이 되었습니다.');
            }
        }).finally(() => {
            onClick();
        });
    };

    return (
    <Suspense fallback={<div>Loading...</div>}>
        <div className="mt-6">
            <div className="relative">
                <div 
                    className="
                        absolute
                        inset-0
                        flex
                        items-center
                    "
                >
                    <div className="w-full border-t text-neutral-400" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-default px-2">
                        또는
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-6 mt-6">
                <AuthSocialButton 
                    icon={BsGoogle}
                    onClick={() => socialAction('google')}
                    disabled={disabled}
                >
                    구글 로그인
                </AuthSocialButton>
                <AuthSocialButton 
                    icon={RiKakaoTalkFill}
                    onClick={() => socialAction('kakao')}
                    disabled={disabled}
                >
                    카카오 로그인
                </AuthSocialButton>
            </div>
        </div>
    </Suspense>
    )
}

export default AuthSocial;
