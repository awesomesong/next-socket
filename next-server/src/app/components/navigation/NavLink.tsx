'use client';

import Link from 'next/link';
import { clsx } from 'clsx';

interface NavLinkProps {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  onMouseOver?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseOut?: () => void;
  onFocus?: (e: React.FocusEvent<HTMLAnchorElement>) => void;
  onBlur?: () => void;
  showLineOnActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  label,
  isActive = false,
  onClick,
  onMouseOver,
  onMouseOut,
  onFocus,
  onBlur,
  showLineOnActive = false,
}) => {
  return (
    <span className="group relative inline-flex flex-col items-start leading-none">
      <Link
        href={href}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
        onFocus={onFocus}
        onBlur={onBlur}
        className={clsx(
          'text-gradient-scent'
        )}
      >
        {label}
      </Link>
      <span
        className={clsx(
          'line-gradient-deco absolute left-0 -bottom-1 w-full min-w-[100%] origin-left transition-transform duration-300 ease-out',
          showLineOnActive && isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        )}
        aria-hidden
      />
    </span>
  );
};

export default NavLink;
