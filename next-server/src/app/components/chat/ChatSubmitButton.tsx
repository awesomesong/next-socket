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
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    onTouchStart={(e) => {
      e.preventDefault();
      if (onClick) onClick();
    }}
    disabled={disabled}
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
