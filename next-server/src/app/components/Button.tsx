'use client';
import clsx from "clsx";
import { Button as Btn } from "@heroui/react";

/** 제출용 그라데이션 버튼 공통 핵심 스타일 (배경 그라데이션, 텍스트 효과, 호버 애니메이션) */
export const submitButtonBaseClassName =
  "rounded-full bg-gradient-to-r from-[#b094e0] to-[#5c4a7a] text-white uppercase shadow-xl shadow-indigo-200/50 dark:shadow-none hover:shadow-2xl hover:brightness-110 hover:saturate-150 transition-all duration-300";

/** 공통 제출 버튼 스타일 (FormFragrance, RegisterForm, SignInForm 등에서 사용) */
export const submitButtonClassName =
  clsx("h-9 md:h-10 min-h-[36px] md:min-h-[40px] text-[0.8rem]", submitButtonBaseClassName);

/** 리뷰 리스트 수정 등에서 사용하는 컴팩트한 그라데이션 스타일 */
export const submitSmallButtonClassName =
  clsx("px-3 h-[26px] text-xs", submitButtonBaseClassName);

/** 리뷰 폼 등에서 사용하는 중간 크기 그라데이션 스타일 (그림자 없음) */
export const submitMediumButtonClassName =
  clsx("h-8 min-h-0 text-[0.8rem] px-5 shadow-none hover:shadow-none", submitButtonBaseClassName);

/** ghostLavender 공통 핵심 스타일 (색상, 테두리, 트랜지션) */
export const ghostLavenderBaseClassName =
  "rounded-full border border-[#d4cce2] dark:border-[#c8b4ff60] bg-transparent text-[#5c4a7a] dark:text-[#e0dcf5] shadow-none transition-all duration-300 hover:bg-[var(--color-lavender-pale)] hover:border-[#b094e0] dark:hover:bg-[var(--color-lavender-pale)] dark:hover:border-[#c8b4ff]";

/** 취소 및 소셜 로그인 버튼 등 표준 Ghost 스타일 */
export const ghostButtonClassName =
  clsx("px-10 h-9 md:h-10 min-h-[36px] md:min-h-[40px] font-semibold uppercase text-[0.75rem]", ghostLavenderBaseClassName);

/** 리뷰 리스트 등에서 사용하는 컴팩트한 Ghost 스타일 */
export const ghostSmallButtonClassName =
  clsx("px-3 h-[26px] text-xs", ghostLavenderBaseClassName);

/** 리뷰 폼 등에서 사용하는 중간 크기 Ghost 스타일 (그림자 없음) */
export const ghostMediumButtonClassName =
  clsx("h-8 min-h-0 text-[0.75rem] font-semibold uppercase px-5 shadow-none hover:shadow-none", ghostLavenderBaseClassName);

/** 폼 하단 제출/취소 버튼 영역 (FormFragrance, FormNotice 등 공통) */
export type FormSubmitActionsProps = {
  submitLabel: React.ReactNode;
  cancelLabel?: string;
  submitDisabled?: boolean;
  onCancel?: () => void;
  submitClassName?: string;
  wrapperClassName?: string;
};

export const FormSubmitActions: React.FC<FormSubmitActionsProps> = ({
  submitLabel,
  cancelLabel = "취소",
  submitDisabled = false,
  onCancel,
  submitClassName = "flex-1",
  wrapperClassName,
}) => (
  <div className={clsx("flex flex-row gap-2 sm:gap-4", wrapperClassName)}>
    <Button type="submit" variant="scent" disabled={submitDisabled} className={submitClassName}>
      {submitLabel}
    </Button>
    <Button type="button" variant="ghostLavender" onClick={onCancel}>
      {cancelLabel}
    </Button>
  </div>
);

interface ButtonProps {
  type?: 'button' | 'submit' | 'reset' | undefined;
  fullWidth?: boolean;
  children?: React.ReactNode;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onPress?: () => void;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost' | 'ghostLavender' | 'scent';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  type,
  fullWidth,
  children,
  disabled,
  onClick,
  onPress,
  color = "primary",
  variant = "shadow",
  size,
  radius,
  className,
}) => {
  const handleClick = onPress ?? onClick;
  const isGhostLavender = variant === "ghostLavender";
  const isScent = variant === "scent";

  if (isGhostLavender || isScent) {
    const isSmall = size === "sm";
    const isMedium = size === "md";
    const appliedClass = isScent
      ? (isSmall ? submitSmallButtonClassName : (isMedium ? clsx(submitMediumButtonClassName, "!shadow-none hover:!shadow-none") : submitButtonClassName))
      : (isSmall ? ghostSmallButtonClassName : (isMedium ? ghostMediumButtonClassName : ghostButtonClassName));

    return (
      <button
        type={type ?? "button"}
        disabled={disabled}
        onClick={handleClick}
        className={clsx(
          "inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-300",
          appliedClass,
          fullWidth && "w-full",
          className
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <Btn
      onPress={handleClick}
      type={type}
      isDisabled={disabled}
      fullWidth={fullWidth}
      color={color}
      variant={variant}
      size={size}
      radius={radius}
      className={clsx(fullWidth && "w-full", className)}
    >
      {children}
    </Btn>
  );
}

export default Button;