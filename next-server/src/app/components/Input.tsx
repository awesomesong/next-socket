"use client";
import {
  FieldErrors,
  FieldValues,
  UseFormRegister,
  RegisterOptions,
} from "react-hook-form";
import { Input as Inputs } from "@heroui/react";
import { AiFillEye } from "react-icons/ai";
import { AiFillEyeInvisible } from "react-icons/ai";
import { useState } from "react";

interface InputProps {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  rules?: RegisterOptions<FieldValues>;
  errors: FieldErrors;
  disabled?: boolean;
  placeholder?: string;
  placement?: "inside" | "outside" | "outside-left";
  variant: "flat" | "bordered" | "faded" | "underlined";
  description?: string;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  type,
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
  const errorMessage = errors[id]?.message;
  const isError = Boolean(errorMessage);

  return (
    <div className="flex w-full flex-wrap">
      {type !== "password" ? (
        <Inputs
          type={type}
          label={label}
          autoComplete={id}
          isDisabled={disabled}
          {...register(id, { ...rules })}
          placeholder={placeholder}
          labelPlacement={placement}
          description={description}
          variant={variant}
          fullWidth={fullWidth}
          isClearable
          onClear={() => {}}
          color={isError ? "danger" : "default"}
          isInvalid={isError}
          errorMessage={
            typeof errorMessage === "string" ? errorMessage : undefined
          }
        />
      ) : (
        <Inputs
          type={isVisible ? "text" : "password"}
          label={label}
          autoComplete={id}
          isDisabled={disabled}
          {...register(id, { ...rules })}
          placeholder={placeholder}
          labelPlacement={placement}
          description={description}
          variant={variant}
          color={isError ? "danger" : "default"}
          isInvalid={isError}
          errorMessage={
            typeof errorMessage === "string" ? errorMessage : undefined
          }
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
      )}
    </div>
  );
};

export default Input;
