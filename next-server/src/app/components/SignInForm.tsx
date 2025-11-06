'use client';
import { useState, useCallback, useEffect, useRef } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import AuthForm from "@/src/app/components/AuthForm";
import Input from "@/src/app/components/Input";
import Button from "@/src/app/components/Button";
import AuthSocial from "@/src/app/components/AuthSocail";
import Link from "next/link";
import clsx from "clsx";

const SignInForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const [ isLoading, setIsLoading ] = useState(false);
  const { data: session, status, update } = useSession();
  const pendingRedirectRef = useRef<string | null>(null);

  // ✅ 세션이 실제로 인증된 후 리다이렉트 처리 (모바일 Safari 및 WebView 호환성)
  useEffect(() => {
    if (status === 'authenticated' && pendingRedirectRef.current && session?.user?.id && session?.user?.email) {
      const targetUrl = pendingRedirectRef.current;
      pendingRedirectRef.current = null;
      
      // ✅ 아이폰 사파리 및 모바일 WebView 환경에서도 작동하도록 window.location 사용
      // requestAnimationFrame으로 브라우저 렌더링과 동기화 후 리다이렉트
      requestAnimationFrame(() => {
        window.location.replace(targetUrl);
      });
    }
  }, [status, session?.user?.id, session?.user?.email]);

  const { 
    register, 
    handleSubmit,
    reset,
    formState: {
        errors,
    }
  } = useForm<FieldValues>({
      mode: "onBlur",
      defaultValues: {
          email: '',
          password: '',
      }
  });

  const onSubmit:SubmitHandler<FieldValues> = useCallback(async (data) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        ...data,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('로그인이 되었습니다.');
        
        // ✅ 모바일 Safari 및 WebView에서도 작동하도록 절대 URL 생성
        const targetUrl = callbackUrl.startsWith('/') 
          ? `${window.location.origin}${callbackUrl}`
          : callbackUrl;
        
        // ✅ 세션 업데이트 강제 (모바일 WebView에서 세션 동기화 보장)
        try {
          await update();
        } catch (error) {
          console.warn('세션 업데이트 실패, 계속 진행:', error);
        }
        
        // ✅ 세션이 이미 인증된 경우 즉시 리다이렉트
        // 세션이 아직 준비되지 않은 경우, useEffect에서 세션 상태 변경을 감지하여 리다이렉트
        if (status === 'authenticated' && session?.user?.id && session?.user?.email) {
          // 세션이 이미 준비되었으므로 즉시 리다이렉트
          requestAnimationFrame(() => {
            window.location.replace(targetUrl);
          });
        } else {
          // 세션이 아직 준비되지 않았으므로, useEffect에서 세션 상태 변경을 감지할 때까지 대기
          pendingRedirectRef.current = targetUrl;
        }
        
        reset();
      }
    } catch {
      toast.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [callbackUrl, reset, status, session?.user?.id, session?.user?.email, update]);

  return (
    <AuthForm title="로그인">
      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input 
          id="email" 
          label="이메일" 
          type="email"
          register={register}
          rules={{
              required: "이메일을 입력해주세요.", 
              pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                  message: "이메일 형식이 아닙니다.",
              },
          }}
          errors={errors}
          disabled={isLoading}
          placement="outside"
          variant="underlined"
        />
        <Input 
            id="password" 
            label="비밀번호" 
            type="password"
            register={register}
            rules={{
                required: "비밀번호를 입력해주세요.", 
                minLength: {
                    value: 8,
                    message: "비밀번호를 8자 이상 입력해주세요."
                },
            }}
            errors={errors}
            disabled={isLoading}
            placement="outside"
            variant="underlined"
        />
        <div className="pt-[18px] text-sm">
          <Button
              disabled={isLoading}
              type="submit"
              fullWidth
              color="primary"
              variant="shadow"
          >
            로그인
          </Button>
        </div>
      </form>

      <AuthSocial 
        onClick={(value) => setIsLoading(value)}
        disabled={isLoading}
      />

      <div
        className="
        flex
        gap-2
        mt-6
        text-sm
        "
      >
        계정이 필요하세요?
        <Link
          href={isLoading
              ? '#'
              : `/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
          }
          className={clsx(`
            hover:underline
            hover:underline-offset-4
          `,
          isLoading ? 'text-blue-900' : 'text-blue-500'
        )}
        >
            계정등록
        </Link>
      </div>
    </AuthForm>
  )
}

export default SignInForm;
