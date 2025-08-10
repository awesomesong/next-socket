'use client';
import useActiveList from "@/src/app/hooks/useActiveList";
import useConversationUserList from "@/src/app/hooks/useConversationUserList";
import { IUserList } from "@/src/app/types/common";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { PiUserCircleFill } from "react-icons/pi";
import { PiUserCircleDuotone } from "react-icons/pi";
import FallbackNextImage from "./FallbackNextImage";

type AvatarProps = {
  user: IUserList | {image : 'None'; id: null; email: null; name: null};
  isOwn?: boolean;
  isAIChat?: boolean;
}

const Avatar= ({user, isOwn, isAIChat} :AvatarProps) => { 
  const param = useParams();
  const { members } = useActiveList();
  const { conversationUsers } = useConversationUserList();
  const joinedConversation = !!param?.conversationId ? conversationUsers.find(conversationUser => conversationUser.conversationId === param?.conversationId) : null;
  const isJoinCahtUser = !!param?.conversationId && joinedConversation?.userIds?.includes(user?.id!);
  const isActiveMember = members.includes(user.email!);
  const isActive = (typeof isOwn !== "boolean" && isActiveMember) || (!isOwn && isJoinCahtUser && isActiveMember) ? true : false ;

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
        // AI 채팅방일 때는 AI 아바타 표시
        <div className="w-full h-full bg-gradient-to-br from-blue-700 to-sky-400 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
      ) : user?.image !== 'None' && !!user?.image ? (
        <FallbackNextImage
          src={user.image}
          alt={user.name +'이미지'}
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
      ): ''}
    </div>
  )
}

export default Avatar
