"use client";
import { useCallback, useRef } from "react";
import { HiPaperAirplane } from "react-icons/hi2";

interface ChatSubmitButtonProps {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

const ChatSubmitButton = ({
  type = "button",
  onClick,
  disabled = false,
}: ChatSubmitButtonProps) => {
  const pointerHandledRef = useRef(false);

  // pointerdown: 포커스 유실 방지 + 즉시 실행 (첫 탭 보장)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!disabled) {
        pointerHandledRef.current = true;
        onClick?.();
        // 현재 프레임의 click 이벤트까지 중복 방지 후 리셋
        requestAnimationFrame(() => {
          pointerHandledRef.current = false;
        });
      }
    },
    [disabled, onClick],
  );

  // click: pointerdown 미발생 시 폴백 (데스크톱 키보드 활성화 등)
  const handleClick = useCallback(() => {
    if (pointerHandledRef.current) return;
    if (!disabled) onClick?.();
  }, [disabled, onClick]);

  return (
    <button
      type={type}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      disabled={disabled}
      data-keep-focus
      className="
        rounded-full
        p-2
        bg-gradient-scent
        cursor-pointer
        hover:opacity-80
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    >
      <HiPaperAirplane size={20} className="text-white dark:text-neutral-900" />
    </button>
  );
};

export default ChatSubmitButton;
