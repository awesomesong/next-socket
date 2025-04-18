'use client';
import { Suspense } from "react";
import SignInForm from "../../components/SignInForm";
import StatusMessage from "../../components/StatusMessage";

const SignInPage = () => {

    return (
      <Suspense fallback={<StatusMessage message="로딩 중..."/>}>
        <SignInForm />
      </Suspense>
    )
}

export default SignInPage;
