"use client";

import { Button, ButtonProps } from "@heroui/react";
import clsx from "clsx";

type DropdownIconButtonProps = Omit<ButtonProps, "isIconOnly" | "variant" | "radius">;

const DropdownIconButton = ({ className, children, ...rest }: DropdownIconButtonProps) => {
  return (
    <Button
      isIconOnly
      variant="light"
      radius="full"
      className={clsx(
        // 공통 크기 (32px)
        "min-w-8 w-8 h-8",
        // 라벤더 테마 스타일
        "bg-[var(--color-lavender-pale)]/50 backdrop-blur-sm text-[var(--color-text-primary)]",
        "border-1 border-[var(--color-lavender-border)] shadow-sm transition-all duration-300",
        // hover / active 효과
        "hover:bg-[var(--color-lavender-light)] hover:scale-110 active:scale-95",
        // 로딩 스켈레톤이 넘치지 않도록 처리
        "overflow-hidden",
        className,
      )}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default DropdownIconButton;
