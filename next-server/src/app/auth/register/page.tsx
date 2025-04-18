'use client';
import { Suspense } from "react";
import RegisterForm from "../../components/RegisterForm";
import StatusMessage from "../../components/StatusMessage";

const RegisterPage = () => {

    return (
        <Suspense fallback={<StatusMessage message="로딩 중..."/>}>
            <RegisterForm />
        </Suspense>
    )
}

export default RegisterPage;
