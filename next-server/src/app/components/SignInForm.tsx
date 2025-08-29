'use client';
import { useState, useCallback } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import AuthForm from "@/src/app/components/AuthForm";
import Input from "@/src/app/components/Input";
import Button from "@/src/app/components/Button";
import AuthSocial from "@/src/app/components/AuthSocail";
import Link from "next/link";
import clsx from "clsx";

const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const [ isLoading, setIsLoading ] = useState(false);

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

    signIn('credentials', {
        ...data,
        redirect: false,
    }).then((res) => {
        if(res?.error) {
            toast.error(res?.error);
        } else {
          toast.success('로그인이 되었습니다.');
          router.push(callbackUrl);
          router.refresh();
          reset();
        }
    })
    .finally(() => {
        setIsLoading(false);
    });
  }, [router, callbackUrl, reset, setIsLoading]);

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
