import { useCallback } from "react";
import { useForm } from "react-hook-form";
import useComposition from "@/src/app/hooks/useComposition";
import { useFocusInput } from "@/src/app/hooks/useFocusInput";

type ChatForm = { message: string };

/**
 * 채팅 입력 공통 훅
 * - react-hook-form (uncontrolled register)
 * - useFocusInput (rAF 폴링 + composition guard)
 * - React 19 IME 한글 보호 (composition-guarded onChange)
 */
export function useChatInput(fieldId: string) {
  const { register, handleSubmit, setValue, getValues } = useForm<ChatForm>({
    defaultValues: { message: "" },
  });

  const {
    ref: registerRef,
    onChange: registerOnChange,
    ...registerRest
  } = register("message", { required: true });

  const { focusAndHold, cancelFocus, focusInput, setTextareaRef } =
    useFocusInput(fieldId, registerRef);

  const { isComposing, handleCompositionStart, handleCompositionEnd } =
    useComposition();

  // React 19: composition 중에는 RHF onChange 건너뛰기 (한글 보호)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing)
        return;
      registerOnChange(e);
    },
    [registerOnChange],
  );

  // compositionEnd 시 RHF에 최종 값 동기화
  const handleCompositionEndSync = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      handleCompositionEnd();
      registerOnChange({
        target: e.target,
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>);
    },
    [handleCompositionEnd, registerOnChange],
  );

  return {
    registerRest,
    handleSubmit,
    setValue,
    getValues,
    setTextareaRef,
    focusAndHold,
    cancelFocus,
    focusInput,
    isComposing,
    handleChange,
    handleCompositionStart,
    handleCompositionEndSync,
  };
}
