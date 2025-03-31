'use client';
import clsx from 'clsx';
import { FieldErrors, FieldValues, UseFormRegister, RegisterOptions } from 'react-hook-form';
import { Input as Inputs } from "@nextui-org/react";
import { AiFillEye } from "react-icons/ai";
import { AiFillEyeInvisible } from "react-icons/ai";
import { useState } from 'react';

interface InputProps {
    label: string;
    id: string;
    type?: string;
    required?: boolean;
    register: UseFormRegister<FieldValues>;
    rules?: RegisterOptions<FieldValues>;
    errors:  FieldErrors;
    disabled?: boolean;
    placeholder?: string;
    placement?: "inside" | "outside" | "outside-left";
    variant: "flat" | "bordered" | "faded" | "underlined";
    description?: string;
    fullWidth?: boolean;
}

const Input : React.FC<InputProps> = ({
    label,
    id,
    type,
    required,
    register,
    rules,
    errors,
    disabled,
    placeholder,
    placement,
    variant,
    description,
    fullWidth,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const toggleVisibility = () => setIsVisible(!isVisible);


    return (
        <div className='flex w-full flex-wrap'>
            {type !== 'password' ?
                <Inputs 
                    type={type}
                    label={label}
                    autoComplete={id}
                    isDisabled={disabled}
                    {...register(id, {...rules})}
                    placeholder={placeholder}
                    labelPlacement={placement}
                    description={description}
                    variant={variant}
                    fullWidth={fullWidth}
                    isClearable
                    onClear={() => {}}
                    color={errors[id]?.message?.toString() ? "danger" : "default"}
                    isInvalid={errors[id]?.message?.toString() ? true : false}
                    errorMessage={errors[id]?.message?.toString()}
                /> 
                :
                <Inputs 
                    type={isVisible ? "text" : "password"}
                    label={label}
                    autoComplete={id}
                    isDisabled={disabled}
                    {...register(id, {...rules})}
                    placeholder={placeholder}
                    labelPlacement={placement}
                    description={description}
                    variant={variant}
                    color={errors[id]?.message?.toString() ? "danger" : "default"}
                    isInvalid={errors[id]?.message?.toString() ? true : false}
                    errorMessage={errors[id]?.message?.toString()}
                    endContent={
                        <button 
                            className="focus:outline-none" 
                            type="button" 
                            onClick={toggleVisibility} 
                            aria-label="토글 패스워드 버튼"
                        >
                          {isVisible ? (
                            <AiFillEye className="text-2xl text-default-400 pointer-events-none" />
                          ) : (
                            <AiFillEyeInvisible className="text-2xl text-default-400 pointer-events-none" />
                          )}
                        </button>
                      }
                /> 
            }
            {/* <label 
                className='
                    block
                    text-sm
                    font-medium
                    leading-6
                    text-gray-100
                '
                htmlFor={id}
            >
                {label}
            </label>
            <div className='mt-2'>
                <input 
                    id={id}
                    type={type}
                    autoComplete={id}
                    disabled={disabled}
                    {...register(id, {...rules})}
                    className={clsx(`
                        form-input
                        block
                        w-full
                        rounded-md
                        border-0
                        p-1.5
                        bg-white
                        text-gray-900
                        shadow-sm
                        ring-1
                        ring-inset
                        ring-gray-300
                        placeholder:text-gray-400
                        focus:ring-2
                        sm:text-sm
                        sm:leading-6
                        `, errors[id] && "focus:ring-rose-500",
                        !errors[id] && "focus:ring-sky-600",
                        disabled && "opacity-50 cursor-default"
                    )}
                />
                {errors[id]?.message?.toString() && (
                    <div className='text-rose-500 mt-2'>
                        {errors[id]?.message?.toString()}
                    </div>
                )} 
            </div> */}
        </div>  
    )
}

export default Input;