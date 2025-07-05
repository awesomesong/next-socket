import AnimatedLogo from "./AnimatedLogo";

interface AuthFormProps {
    children: React.ReactNode;
    title: string;
}

const AuthForm:React.FC<AuthFormProps> = ({
    children,
    title,
}) => {
   
    return (
        <div
            className='
                flex 
                flex-col 
                justify-center 
                min-h-full 
                py-10
                max-sm:py-6 
                max-sm:px-2
            '
        >
            <div className='
                sm:mx-auto 
                sm:w-full 
                sm:max-w-md
            '>
                <AnimatedLogo responsive={false} />
                <h2 className='
                    mt-1
                    text-center
                    text-2xl
                    tracking-tight
                '>
                    {title}
                </h2>
            </div>
            <div
                className=" 
                    mt-8
                    sm:mx-auto
                    sm:w-full
                    sm:max-w-md
                "
            >
                <div
                    className="
                        border-default
                        px-4
                        py-8
                        shadow
                        rounded-lg
                        sm:px-10
                    "
                >
                    {children}
                </div>
            </div>
        </div>
  )
}

export default AuthForm;
