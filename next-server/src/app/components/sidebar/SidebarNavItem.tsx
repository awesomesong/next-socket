'use client';
import clsx from "clsx";
import Link from "next/link";
import { useCallback } from "react";
import ChatUnReadCount from "../ChatUnReadCount";

interface SidebarNavItemProps {
  label: string;
  icon: React.ComponentType<{ className?: string; fill?: string }>;
  href: string;
  onClick?: () => void;
  active?: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  label,
  icon: Icon,
  href,
  onClick,
  active
}) => {

  const handleClick = useCallback(() => {
    if (onClick) {
      return onClick();
    }
  }, [onClick]);

  return (
    <li
      onClick={handleClick}
      className="
        w-full
        max-md:h-full
      "
    >
      <Link
        href={href}
        className={clsx(`
          flex
          justify-center
          items-center	
          group
          gap-y-3
          relative
          px-2
          text-sm
          leading-6
          font-semibold
          text-neutral-900
          dark:text-neutral-200
          sidebar-item--state
          md:rounded-md
          md:py-3
          max-md:h-full
        `)}
        data-selected={active}
      >
        <div className="relative inline-flex">
          <Icon className="h-6 w-6 shrink-0" fill="url(#scent-nav-gradient)" />
          {label === '채팅' && (
            <ChatUnReadCount
              size="mobile-small"
              className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2"
            />
          )}
        </div>
        <span className="sr-only">{label}</span>
      </Link>
    </li>
  )
}

export default SidebarNavItem;
