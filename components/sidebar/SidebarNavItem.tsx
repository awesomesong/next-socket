'use client';
import clsx from "clsx";
import Link from "next/link";
import { memo, useCallback } from "react";
import ChatUnReadCount from "../ChatUnReadCount";

interface SidebarNavItemProps {
  label: string;
  icon: any;
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
    if(onClick) {
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
          hover:dark:text-neutral-900
          hover:bg-neutral-200
          md:rounded-md
          md:py-3
          max-md:h-full
        `,
        active && `bg-neutral-200 dark:text-neutral-900 `
      )}
      >
        <Icon className="h-6 w-6 shrink-0" />
        <span className="sr-only">{label}</span>
        {label === '채팅' && 
          <ChatUnReadCount />
        }
      </Link>
    </li>
  )
}

export default SidebarNavItem;
