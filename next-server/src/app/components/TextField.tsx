"use client";
import {
  FieldErrors,
  FieldValues,
  UseFormRegister,
  UseFormSetValue,
  RegisterOptions,
} from "react-hook-form";
import { Input as HeroInput, Textarea as HeroTextarea } from "@heroui/react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { useState, useCallback, type ChangeEvent, forwardRef } from "react";

// ─── 공통 스타일 ───────────────────────────────────────────────────────────────

const sharedTextStyle = [
  "text-[#2d2040] dark:text-[#e0dcf5]",
  "placeholder:text-[#8e84b8] dark:placeholder:text-[#c4b8e0]",
  "focus:outline-none focus:ring-0 focus:shadow-none",
  "focus-visible:outline-2 focus-visible:outline-offset-1",
  "focus-visible:outline-[#b094e0] dark:focus-visible:outline-[#c8b4ff]",
  "focus-visible:ring-0",
].join(" ");

const sharedWrapperStyle = [
  "px-0 transition-all duration-300",
  "after:bg-[#b094e0] dark:after:bg-[#c8b4ff]",
  "focus-within:!outline-none focus-within:ring-0",
].join(" ");

const sharedItemClassNames = {
  base: "focus:outline-none focus:ring-0",
  label: "text-[0.75rem] uppercase tracking-[0.2em] text-[#b094e0] dark:text-[#c8b4ff] font-bold mb-2",
  errorMessage: "text-[0.7rem] text-danger mt-1",
};

/** border 대신 box-shadow로 경계선 표시 (HeroUI 기본 border에 덮이지 않음) */
const boundaryClass = "textfield-input-boundary";
const inputWrapper = `h-9 md:h-10 py-1 ${boundaryClass} ${sharedWrapperStyle}`;
const textareaWrapper = `min-h-0 items-start textfield-textarea-wrapper ${boundaryClass} ${sharedWrapperStyle}`;
const description = "text-[0.65rem] text-[#8e84b8] dark:text-[#9a8fbc] mt-1 italic tracking-wide";

const fontLight = "text-[0.95rem] font-light";

/** HeroUI Input/Textarea용 variant별 classNames (공통 스타일, TextField·FormFragrance·FormPost 등에서 사용) */
export const formClassNames = {
  underlined: {
    ...sharedItemClassNames,
    input: `${sharedTextStyle} ${fontLight} py-1 rounded-sm`,
    inputWrapper,
    innerWrapper: "gap-3",
    description,
  },
  textarea: {
    ...sharedItemClassNames,
    input: `${sharedTextStyle} ${fontLight} leading-[1.8] py-0 rounded-lg`,
    inputWrapper: textareaWrapper,
    innerWrapper: "gap-3",
  },
} as const;

/** TextField·기타 폼에서 동일 스타일 사용을 위한 alias */
export const inputClassNames = formClassNames.underlined;
export const textareaClassNames = formClassNames.textarea;

// ─── 타입 ──────────────────────────────────────────────────────────────────────

type HeroUIClassNames = typeof formClassNames.underlined | typeof formClassNames.textarea;

/** react-hook-form 사용 시 (setValue 전달 시 텍스트 필드 X 버튼으로 입력 지우기 가능) */
interface TextFieldRegisterProps {
  id: string;
  register: UseFormRegister<FieldValues>;
  setValue?: UseFormSetValue<FieldValues>;
  rules?: RegisterOptions<FieldValues>;
  errors: FieldErrors;
  type?: string;
  required?: boolean;
  placement?: "inside" | "outside" | "outside-left";
  multiline?: boolean;
  minRows?: number;
  label: string;
  placeholder?: string;
  variant?: "flat" | "bordered" | "faded" | "underlined";
  description?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

/** controlled (value/onChange) 사용 시 - FormFragrance 등 */
interface TextFieldControlledProps {
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  classNames: HeroUIClassNames;
  placeholder?: string;
  variant?: "flat" | "bordered" | "faded" | "underlined";
  description?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<any>) => void;
  onCompositionStart?: () => void;
  onCompositionEnd?: () => void;
  minRows?: number;
  className?: string;
  disabled?: boolean;
  type?: string;
  placement?: "inside" | "outside" | "outside-left";
}

type TextFieldProps = TextFieldRegisterProps | TextFieldControlledProps;

function isRegisterProps(props: TextFieldProps): props is TextFieldRegisterProps {
  return "register" in props && "errors" in props;
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────────────────

const TextField = forwardRef<any, TextFieldProps>((props, ref) => {
  const label = props.label;
  const placeholder = props.placeholder;
  const variant = props.variant ?? "underlined";
  const description = props.description;
  const disabled = props.disabled;
  const type = (props as any).type ?? "text";

  const [isVisible, setIsVisible] = useState(false); // password일 때만 사용: false = 마스킹, true = 글자 노출
  const [hasValue, setHasValue] = useState(false);

  const toggleVisibility = useCallback(() => setIsVisible((v) => !v), []);

  const iconButtonClass =
    "text-2xl text-default-400 pointer-events-none hover:text-[#b094e0] transition-colors";

  // ─── End Content: text = X(지우기), password = 눈(표시/숨기기) ─────────────────
  const renderEndContent = (onClear?: () => void) => {
    if (type === "password") {
      return (
        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={isVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="focus:outline-none"
        >
          {isVisible ? (
            <AiFillEye className={iconButtonClass} aria-hidden />
          ) : (
            <AiFillEyeInvisible className={iconButtonClass} aria-hidden />
          )}
        </button>
      );
    }
    if (hasValue && onClear) {
      return (
        <button
          type="button"
          onClick={onClear}
          aria-label="입력 내용 지우기"
          className="focus:outline-none"
        >
          <IoClose className={iconButtonClass} aria-hidden />
        </button>
      );
    }
    return undefined;
  };

  if (isRegisterProps(props)) {
    const {
      id,
      register,
      setValue,
      rules,
      errors,
      placement,
      multiline,
      minRows,
      fullWidth,
    } = props;
    const handleRegisterClear = useCallback(() => {
      setValue?.(id, "");
      setHasValue(false);
    }, [id, setValue]);
    const errorMessage = errors[id]?.message;
    const isError = Boolean(errorMessage);

    const commonProps = {
      label,
      autoComplete: id,
      isDisabled: disabled,
      ...register(id, {
        ...rules,
        onChange: (e: any) => {
          setHasValue(!!e.target.value);
          rules?.onChange?.(e);
        },
      }),
      placeholder,
      labelPlacement: placement ?? "outside",
      description,
      variant,
      color: isError ? ("danger" as const) : ("default" as const),
      isInvalid: isError,
      errorMessage: typeof errorMessage === "string" ? errorMessage : undefined,
    };

    if (multiline) {
      return (
        <div className="flex w-full flex-wrap">
          <HeroTextarea
            {...commonProps}
            ref={ref}
            minRows={minRows}
            className="w-full"
            classNames={formClassNames.textarea}
          />
        </div>
      );
    }

    return (
      <div className="flex w-full flex-wrap">
        <HeroInput
          {...commonProps}
          ref={ref}
          type={type === "password" ? (isVisible ? "text" : "password") : type}
          fullWidth={fullWidth}
          classNames={formClassNames.underlined}
          endContent={renderEndContent(setValue ? handleRegisterClear : undefined)}
        />
      </div>
    );
  }

  // Controlled mode
  const {
    name,
    value,
    onChange,
    classNames,
    errorMessage,
    isInvalid,
    isRequired,
    onBlur,
    onFocus,
    onKeyDown,
    onCompositionStart,
    onCompositionEnd,
    minRows,
    className,
    placement,
  } = props;

  const isTextarea = minRows !== undefined;
  const isError = Boolean(isInvalid ?? errorMessage);

  const handleControlledClear = useCallback(() => {
    onChange({ target: { name, value: "" } } as ChangeEvent<HTMLInputElement>);
    setHasValue(false);
  }, [name, onChange]);

  // 초기 값에 따른 hasValue 설정
  if (!hasValue && value) setHasValue(true);

  const commonControlled = {
    name,
    label,
    value,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setHasValue(!!e.target.value);
      onChange(e);
    },
    placeholder,
    labelPlacement: placement ?? "outside",
    variant,
    description,
    isRequired,
    color: isError ? ("danger" as const) : ("default" as const),
    isInvalid: isError,
    errorMessage: errorMessage ?? undefined,
    onBlur,
    onFocus,
    onKeyDown,
    onCompositionStart,
    onCompositionEnd,
    isDisabled: disabled,
  };

  if (isTextarea) {
    return (
      <div className="flex w-full flex-wrap">
        <HeroTextarea
          {...commonControlled}
          ref={ref}
          minRows={minRows}
          className={className ?? "w-full"}
          classNames={classNames}
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-wrap">
      <HeroInput
        {...commonControlled}
        ref={ref}
        type={type === "password" ? (isVisible ? "text" : "password") : type}
        classNames={classNames}
        endContent={renderEndContent(handleControlledClear)}
      />
    </div>
  );
});

export default TextField;
