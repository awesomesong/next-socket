"use client";
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
}: ChatSubmitButtonProps) => (
  <button
    type={type}
    onPointerDown={(e) => {
      e.preventDefault();
      if (!disabled) onClick?.();
    }}
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

export default ChatSubmitButton;
