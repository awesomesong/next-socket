'use client';
import useActiveList from "@/src/app/hooks/useActiveList";
import { IUserList } from "@/src/app/types/common";
import clsx from "clsx";
import { PiUserCircleFill } from "react-icons/pi";
import { PiUserCircleDuotone } from "react-icons/pi";
import FallbackNextImage from "./FallbackNextImage";
import { memo, useMemo } from "react";

type AvatarProps = {
  user: IUserList | {image : 'None'; id: null; email: null; name: null};
  isOwn?: boolean;
  isAIChat?: boolean;
}

const Avatar= ({user, isOwn, isAIChat} :AvatarProps) => { 
  const isActiveMember = useActiveList((s) => s.isActive(user?.id ?? ''));
  
  const isActive = useMemo(() => !isOwn && isActiveMember,
    [isOwn, isActiveMember]
  );

  return (
    <div className="relative">
      <div
        className={clsx(`
          inline-block
          relative
          overflow-hidden
          w-8
          h-8
          align-bottom`,
          user?.image && 'rounded-full'
        )}
      >
        {isAIChat ? (
          <div className="w-full h-full bg-gradient-to-br from-blue-700 to-sky-400 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
        ) : user?.image && user.image !== 'None' ? (
          <FallbackNextImage
            src={user.image}
            alt={`${user.name ?? '유저'} 이미지`}
            fill
            sizes="2rem"
            unoptimized={false}
            className="object-cover"
          />
        ) : user?.image === 'None' ? (
          <PiUserCircleFill className="w-full h-full"/>
        ) : (
          <PiUserCircleDuotone className="w-full h-full scale-[1.2]"/>
        )}
      </div>
      {isActive ? (
        <span
          className="
            block
            absolute
            rounded-full
            bg-green-500
            ring-1
            ring-white
            -top-0
            -right-1
            h-3
            w-3
          "
        />
      ): null}
    </div>
  )
}

export default memo(Avatar, (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.image === nextProps.user.image &&
           prevProps.user.name === nextProps.user.name &&
           prevProps.user.email === nextProps.user.email &&
           prevProps.isOwn === nextProps.isOwn &&
           prevProps.isAIChat === nextProps.isAIChat;
});
