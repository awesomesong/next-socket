'use client';
import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

 

interface MessageTextareaProps {
    placeholder?: string;
    id: string;
    type?: string;
    required?: boolean;
    register: UseFormRegister<FieldValues>;
    errors: FieldErrors;
    onKeyDown: (e : any) => void;
}

const MessageTextarea:React.FC<MessageTextareaProps> = ({
    placeholder,
    id,
    type,
    required,
    register,
    errors,
    onKeyDown
}) => {
    return (
        <div className="w-full p-2 rounded-lg border-default">
            <textarea 
                rows={2}
                id={id}
                autoComplete={id}
                {...register(id, { required })}
                placeholder={placeholder}
                className="
                    block
                    w-full
                    bg-default 
                    font-light
                    resize-none
                    focus:outline-none
                "
                onKeyDown={onKeyDown}
            />
        </div>
    )
}

export default MessageTextarea;
