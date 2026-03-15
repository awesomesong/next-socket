"use client";
import { PiUserCircleDuotone } from "react-icons/pi";
import clsx from "clsx";

type ScentUserAvatarProps = {
    className?: string;
};

/**
 * ScentUserAvatar
 * A reusable user avatar component with the brand's signature scent-gradient.
 */
const ScentUserAvatar = ({ className }: ScentUserAvatarProps) => {
    return (
        <span className="scent-avatar-root block size-full">
            <svg width="0" height="0" className="absolute">
                <linearGradient id="scent-user-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--scent-gradient-start)" />
                    <stop offset="55%" stopColor="var(--scent-gradient-mid)" />
                    <stop offset="100%" stopColor="var(--scent-gradient-end)" />
                </linearGradient>
            </svg>
            <PiUserCircleDuotone
                className={clsx("icon-accent w-full h-full scale-[1.2]", className)}
                fill="url(#scent-user-gradient)"
                style={{ opacity: 0.9 }}
            />
        </span>
    );
};

export default ScentUserAvatar;
