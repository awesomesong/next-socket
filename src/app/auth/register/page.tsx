'use client';
import { BASE_URL } from "@/config";
import { Suspense, useState } from "react";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthForm from "@/src/app/components/AuthForm";
import Input from "@/src/app/components/Input";
import Button from "@/src/app/components/Button";
import AuthSocial from "@/src/app/components/AuthSocail";
import clsx from "clsx";
import Link from "next/link";

const Registerpage = () => {
    const router = useRouter();
    const [ isLoading, setIsLoading ] = useState(false);

    const { 
        register, 
        handleSubmit,
        setError,
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

        if (data.password !== data.passwordConfirm) {      
            setIsLoading(false);
            setError(
                'passwordConfirm', // 에러 핸들링할 input요소의 id 입력
                { message: '비밀번호가 일치하지 않습니다.' }, // 에러 메세지
                { shouldFocus: true }, // 에러가 발생한 input으로 focus 이동
            );
            return;
        }
        const res = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data
            }),
        });
        setIsLoading(false);
        const { message, status } = await res.json();
        if( status === 500 ) {
            toast.error(message);
        }

        if(res.ok) {
            toast.success(message);
            clearErrors();
            reset();
            router.push(`/auth/signin?callbackUrl=${BASE_URL}`);
        }
    };

    return (
        <AuthForm title="회원가입">
            <form
                className="space-y-4"
                onSubmit={handleSubmit(onSubmit)}
            >
                <Input
                    id="name" 
                    label="이름" 
                    type="text"
                    register={register}
                    rules={{
                        required: "이름을 입력해주세요.", 
                        minLength: {value: 2, message: '2글자 이상 입력헤주세요.'},
                        pattern: {
                            value: /^[가-힣]{2,}$/,
                            message: "이름은 공백 없이 한글만 2글자 이상 입력해주세요.",
                        },
                    }}
                    errors={errors}
                    disabled={isLoading}
                    placement="outside"
                    variant="underlined"
                />
                <Input 
                    id="email" 
                    label="이메일" 
                    type="email"
                    register={register}
                    rules={{
                        required: "이메일을 입력해주세요.", 
                        pattern: {
                            value: /^[\w.-]+@(?:gmail\.com|naver\.com|daum\.net|hanmail\.net|nate\.com|outlook\.com|yahoo\.com)$/i,
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
                        pattern: {
                            value: /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                            message: "영문자, 숫자,특수문자(@$!%*?&)를 포함한 8자리 이상이여야 합니다.",
                        },
                    }}
                    errors={errors}
                    disabled={isLoading}
                    placement="outside"
                    variant="underlined"
                />
                <Input 
                    id="passwordConfirm" 
                    label="비밀번호 확인" 
                    type="password"
                    register={register}
                    rules={{
                        required: "비밀번호를 확인을 입력해주세요.", 
                        minLength: {
                            value: 8,
                            message: "비밀번호를 8자 이상 입력해주세요."
                        },
                        pattern: {
                            value: /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                            message: "영문자, 숫자,특수문자(@$!%*?&)를 포함한 8자리 이상이여야 합니다.",
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
                        회원가입
                    </Button>
                </div>
            </form>

            <Suspense>
                <AuthSocial onClick={() => setIsLoading(!isLoading)} disabled={isLoading}/>
            </Suspense>
            
            <div
                className="
                flex
                gap-2
                mt-6
                text-sm
                "
            >
                등록한 계정이 있습니까?
                <Link
                    href={`${isLoading ? '#' : `/auth/signin?callbackUrl=${encodeURIComponent(BASE_URL as string)}`}`}
                    className={clsx(`
                        hover:underline
                        hover:underline-offset-4
                    `,
                    isLoading ? 'text-blue-900' : 'text-blue-500'
                    )}
                >
                    로그인
                </Link>
            </div>
      </AuthForm>
    )
}

export default Registerpage;
