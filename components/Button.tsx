'use client';
import clsx from "clsx";
import { Button as Btn } from "@nextui-org/react";

interface ButtonProps {
    type?: 'button' | 'submit' | 'reset' | undefined;
    fullWidth?: boolean;
    children?: React.ReactNode;
    secondary?: boolean;
    danger?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    variant: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const Button: React.FC<ButtonProps> = ({
    type,
    fullWidth,
    children,
    secondary,
    danger,
    disabled,
    onClick,
    color,
    variant,
    size,
    radius,
}) => {
  return (
    <>
      <Btn
        onClick={onClick}
        type={type}
        isDisabled={disabled}
        fullWidth={fullWidth}
        color={color}
        variant={variant}
        size={size}
        radius={radius}
        className={clsx(`
          text-[16px]
          `,
        )}
      >
        {children}
      </Btn>
      {/* <button
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={clsx(`
                flex
                justify-center
                rounded-md
                px-3
                py-2
                font-semibold
                focus-visible:outline
                focus-visible:outline-2
                focus-visible:outline-offset-2
            `,
            disabled && "opacity-50 cursor-default",
            fullWidth && "w-full",
            secondary ? 'text-gray-900' : 'text-white',
            danger&& 'bg-rose-500 hover:bg-rose-600 focus-visible:outline-rose-600',
            !secondary && !danger && 'bg-sky-500 hover:bg-sky-600  focus-visible:outline-sky-600'
        )}
        >
          {children}
      </button> */}
    </>
  )
}

export default Button;