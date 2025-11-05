'use client';
import { signIn } from "next-auth/react";
import AuthSocialButton from "./AuthSocialButton";
import { BsGoogle } from 'react-icons/bs';
import { RiKakaoTalkFill } from "react-icons/ri";
import { BsFillPersonFill } from "react-icons/bs";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSocialProps } from "@/src/app/types/common";

const AuthSocial:React.FC<AuthSocialProps> = ({
    onClick,
    disabled,
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams?.get('callbackUrl') || '/';

    const handleLoginResult = async (res: Awaited<ReturnType<typeof signIn>>) => {
        if (res?.error) {
            toast.error(res.error);
            return;
        }
    
        if (res?.ok && !res?.error) {
            toast.success("로그인이 되었습니다.");
            router.replace(callbackUrl);  // replace로 히스토리 스택 최적화
        }
    };

    const socialAction = async (provider: string) => {
        onClick(true); // 로딩 시작
    
        try {
            const result = await signIn(provider, {
                callbackUrl: `${callbackUrl}`,
                redirect: false, // 자동 이동 방지
            });
            
            await handleLoginResult(result);
        } catch {
            toast.error('소셜 로그인 중 오류가 발생했습니다.');
        } finally {
            onClick(false); // 로딩 종료
        }
    };

    // ✅ 데모 계정 로그인 핸들러 최적화
    const demoLogin = async () => {
        onClick(true); // 로딩 시작

        try {
            const result = await signIn("credentials", {
                email: "demo@example.com",
                password: "demo1234!",
                callbackUrl,
                redirect: false,
            });
            
            await handleLoginResult(result);
        } catch {
            toast.error('데모 로그인 중 오류가 발생했습니다.');
        } finally {
            onClick(false); // 로딩 종료
        }
    };

    return (
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
                <div>
                    <p className="text-sm mb-2 break-keep">
                        로그인 없이도 체험할 수 있는 <strong className="text-purple-500">데모 계정</strong>입니다.
                        개인정보는 저장되지 않으며, 모든 기능을 자유롭게 살펴보실 수 있습니다.
                    </p>
                    <AuthSocialButton 
                        icon={BsFillPersonFill}
                        onClick={demoLogin}
                        disabled={disabled}
                    >
                        데모 계정으로 체험하기
                    </AuthSocialButton>
                </div>
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
    )
}

export default AuthSocial;
