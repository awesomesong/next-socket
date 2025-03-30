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
                py-12
                lg:px-8
                sm:px-6
            '
        >
            <div
                className='sm:mx-auto sm:w-full sm:max-w-md'
            >
                <h2
                    className='
                        mt-6
                        text-center
                        text-3xl
                        font-bold
                        tracking-tight
                    '
                >
                    {title}   
                </h2>
            </div>
            <div
                className=" 
                    mt-8
                    sm:mx-auto
                    sm:w-full
                    sm:max-w-md
                    max-sm:px-2
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
