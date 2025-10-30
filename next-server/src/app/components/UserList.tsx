"use client";
import { IUserList } from "@/src/app/types/common";
import { useEffect, useRef, useCallback, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import getUsers from "@/src/app/lib/getUsers";
import UserBox from "./UserBox";
import ChatMemberSkeleton from "./skeleton/ChatMemberSkeleton";
import { useSocket } from "../context/socketContext";
import { IoBeerOutline } from "react-icons/io5";
import { CHAT_MEMBER_KEY } from "@/src/app/lib/react-query/chatCache";

const UserList = () => {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data: users, status } = useQuery({
    queryKey: CHAT_MEMBER_KEY,
    queryFn: getUsers,
    staleTime: 60_000, // 1분 동안 데이터 유지
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 5 * 60 * 1000, // 메모리 여유면 길게 유지
    // 가공을 한 번만: 중복 제거 + 순서 유지
    select: (raw) => {
      const list = (raw?.users ?? []) as IUserList[];
      const seen = new Set<string>();
      const dedup: IUserList[] = [];
      for (const u of list) {
        if (!u?.id || seen.has(u.id)) continue;
        seen.add(u.id);
        dedup.push(u);
      }
      return dedup; // 서버가 내려준 순서 유지 + 중복 제거
    },
  });


  // ✅ 새 사용자 등록 시 UserList에 직접 추가 (새로고침 없이)
  const handleNewUser = useCallback((data: { userId: string; useremail: string; name: string; createdAt: string }) => {      
    // 기존 캐시 데이터 가져오기
    const currentData = queryClient.getQueryData<{ users: IUserList[] }>(CHAT_MEMBER_KEY);
    
    if (currentData?.users) {
      // 중복 사용자 체크
      const existingUser = currentData.users.find(user => user.id === data.userId);
      if (existingUser) return;
      
      // 새 사용자 객체 생성
      const newUser: IUserList = {
        id: data.userId,
        name: data.name,
        email: data.useremail,
        image: null,
        role: 'user'
      };
      
      // 새 사용자를 올바른 위치에 삽입 (서버 정렬 순서 유지)
      const updatedUsers = [...currentData.users];
      
      // 새 사용자를 이름순으로 올바른 위치에 삽입
      let insertIndex = updatedUsers.length; // 기본값: 마지막
      
      for (let i = 0; i < updatedUsers.length; i++) {
        const currentName = updatedUsers[i].name || '';
        const newUserName = newUser.name || '';
        
        // 서버 정렬과 동일한 로직 (Prisma orderBy: { name: 'asc' })
        if (newUserName.toLowerCase() < currentName.toLowerCase()) {
          insertIndex = i;
          break;
        }
      }
      
      // 올바른 위치에 새 사용자 삽입
      updatedUsers.splice(insertIndex, 0, newUser);
      
      // 캐시 업데이트
      queryClient.setQueryData(CHAT_MEMBER_KEY, {
        ...currentData,
        users: updatedUsers
      });
    } else {
      // 캐시 데이터가 없으면 새로고침
      queryClient.invalidateQueries({ queryKey: CHAT_MEMBER_KEY });
    }
  }, [queryClient]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('registered:user', handleNewUser);

    return () => {
      socket.off('registered:user', handleNewUser);
    };
  }, [socket, handleNewUser]);

  return (
    <aside
      className="
        overflow-y-auto
        lg:block
        max-lg:flex-1
        w-0
        lg:w-80
        border-r-default
    ">
      { status === "error" ? (
        <div className="flex justify-center mt-10">
          <h1 className="text-sm">멤버를 불러오지 못했습니다.</h1>
        </div>
      ) : (
        <>
          <div
            className="
              flex
              items-center
              h-16
              px-3
              text-2xl
              font-bold
            "
          >
            <span
              className="
                inline-flex 
                items-end 
                gap-2
                leading-none
              "
            >
              <IoBeerOutline size={26} />
              멤버
            </span>
          </div>
          {status === "pending" ? (
            <ChatMemberSkeleton />
          ) : users?.length ? (
            users.map((u) => <UserBox key={u.id} userInfo={u} />)
          ) : (
            <div className="text-sm text-center py-4">현재 등록된 채팅 멤버가 없습니다.</div>
          )}
        </>
      )}
    </aside>
  );
};

export default memo(UserList);
