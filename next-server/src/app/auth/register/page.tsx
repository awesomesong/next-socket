import { Suspense } from "react";
import RegisterForm from "../../components/RegisterForm";
import AuthFormSkeleton from "../../components/skeleton/AuthFormSkeleton";

const RegisterPage = () => {

    return (
        <Suspense fallback={<AuthFormSkeleton />}>
            <RegisterForm />
        </Suspense>
    )
}

export default RegisterPage;
