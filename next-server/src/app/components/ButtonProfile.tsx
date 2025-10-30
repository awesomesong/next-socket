"use client";
import { Tooltip } from "@heroui/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PiUserCircleDuotone } from "react-icons/pi";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";
import clsx from "clsx";
import FallbackNextImage from "./FallbackNextImage";

const ButtonProfile = () => {
  const { data: session, status } = useSession();
  const width = "30px";
  const height = "30px";

  return (
    <Tooltip showArrow={true} content="프로필" size="lg">
      <Link
        href="/profile"
        title={`${session?.user.name} 프로필`}
        scroll={false}
        className={clsx(`
          overflow-hidden
          inline-block
          relative
          rounded-full
          w-[30px]
          h-[30px]
        `)}
      >
        {status === "loading" ? (
          <ShapesSkeleton width={width} height={height} radius="lg" />
        ) : session?.user.image ? (
          <FallbackNextImage
            src={session?.user.image}
            alt={session?.user.name + " 이미지"}
            fill
            sizes={`${width}px`}
            unoptimized={false}
            className="object-cover drop-shadow-lg"
          />
        ) : (
          <PiUserCircleDuotone className="w-full h-full scale-[1.2] drop-shadow-lg" />
        )}
      </Link>
    </Tooltip>
  );
};

export default ButtonProfile;
