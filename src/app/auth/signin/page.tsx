'use client';
import { useState } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthForm from "@/components/AuthForm";
import Input from "@/components/Input";
import Button from "@/components/Button";
import AuthSocial from "@/components/AuthSocail";
import Link from "next/link";
import clsx from "clsx";

const SignInPage = () => {
  const router = useRouter();
  const [ isLoading, setIsLoading ] = useState(false);

  const { 
    register, 
    handleSubmit,
    clearErrors,
    reset,
    formState: {
        errors,
    }
  } = useForm<FieldValues>({
      mode: "onBlur",
      defaultValues: {
          name: '',
          email: '',
          password: '',
          passwordConfirm:'',
      }
  });

  const onSubmit:SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);
    // clearErrors();

    signIn('credentials', {
        ...data,
        redirect: false,
    }).then((callback) => {
        if(callback?.error) {
            toast.error(callback?.error);
        }

        if(callback?.ok && !callback?.error) {
            clearErrors();
            router.push('/');
            router.refresh();
            reset();
            toast.success('로그인이 되었습니다.');
        }
    })
    .finally(() => {
        setIsLoading(false);
        // clearErrors();
    });
  };

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
                  value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i,
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
                    value: 1,
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
        onClick={() => setIsLoading(!isLoading)} 
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
          href={`${isLoading ? '#' : '/auth/register'}`}
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

export default SignInPage;
