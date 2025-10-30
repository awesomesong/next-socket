"use client";
import { IUserList } from "@/src/app/types/common";
import clsx from "clsx";
import { PiUserCircleDuotone } from "react-icons/pi";
import FallbackNextImage from "./FallbackNextImage";
import { memo, useMemo } from "react";

interface AvatarGroupProps {
  users?: IUserList[];
}


const positionMapByCount = {
  1: [
    // 중앙 정렬
    "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  ],
  2: [
    // 2개 레이아웃 (좌상/우하)
    "top-0 left-0",
    "bottom-0 right-0",
  ],
  3: [
    "top-0 left-[9px]",
    "bottom-0 left-0",
    "bottom-0 right-0",
  ],
  4: [
    "top-0 left-0",
    "top-0 right-0",
    "bottom-0 left-0",
    "bottom-0 right-0",
  ],
} as const;

const AvatarGroup: React.FC<AvatarGroupProps> = ({ users = [] }) => {
  const usersLength = users.length;
  const limit = usersLength > 3 ? 4 : usersLength;

  const sliceUsers = useMemo(() => users.slice(0, limit), [users, limit]);
  const positions = positionMapByCount[limit as 1 | 2 | 3 | 4] ?? [];

  return (
    <div className="shrink-0 relative w-10 h-10">
      {sliceUsers.map((user, i) => {
        const posClass = positions[i] ?? '';
        const hasImage = !!user?.image && user.image !== "None";

        return (
          <div
            key={user?.id ?? `idx-${i}`}
            className={clsx(
              "flex justify-center items-center overflow-hidden absolute",
              "w-[22px] h-[22px]",
              "rounded-full ring-1 ring-inset ring-white dark:ring-0",
              posClass
            )}
          >
            {hasImage ? (
              <FallbackNextImage
                alt={`${user.name ?? "유저"} 이미지`}
                src={user.image!}
                fill
                sizes="2rem"
                unoptimized={false}
                className="object-cover"
              />
            ) : (
              <PiUserCircleDuotone className="scale-[1.2]" size={22} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default memo(AvatarGroup, (prev, next) => {
  const a = prev.users ?? [];
  const b = next.users ?? [];
  if (a.length !== b.length) return false;
  // id와 image만 비교 (필요에 따라 name 포함)
  for (let i = 0; i < a.length; i++) {
    if (a[i]?.id !== b[i]?.id || a[i]?.image !== b[i]?.image) return false;
  }
  return true;
});