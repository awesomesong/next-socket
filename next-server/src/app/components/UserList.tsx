'use client';
import { IUserList } from "@/src/app/types/common";
import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import getUsers from "@/src/app/lib/getUsers";
import UserBox from "./UserBox";
import ChatMemberSkeleton from "./skeleton/ChatMemberSkeleton";
import { useSocket } from "../context/socketContext";
import { IoBeerOutline } from "react-icons/io5";

const UserList = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { 
        data, 
        status,
        isSuccess,
        refetch
    } = useQuery({
        queryKey: ['chatMember'],
        queryFn: getUsers,
        staleTime: 1000 * 60, // 1분 동안 데이터 유지
    });

    useEffect(() => {
        if(!socket) return;

        const handleRegisterUser = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['chatMember'], refetchType: 'active', exact: true });
            }, 120);
        };
        
        socket.on("register:user", handleRegisterUser);

        return () => {
            socket.off("register:user", handleRegisterUser);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        }
    }, [ socket, queryClient ]);

    const memoizedUsers = useMemo(() => {
        const list: IUserList[] = (data?.users ?? []) as IUserList[];
        const map = new Map<string, IUserList>();
        list.forEach((u: IUserList) => {
            if (u?.id) map.set(u.id, u);
        });
        return Array.from(map.values());
    }, [data?.users]);

    return status === 'error' 
        ?   (<div className='flex justify-center align-middle mt-10'>
                <h1 className='text-2xl'>{data?.message || '멤버를 찾을 수 없습니다.'}</h1>
            </div>) 
        : (<aside
            className="
                overflow-y-auto
                lg:block
                max-lg:flex-1
                w-0
                lg:w-80
                border-r-default
            ">
            <div className="
                flex
                items-center
                h-16
                px-3
                text-2xl
                font-bold
            ">
                <span className="
                    inline-flex 
                    items-end 
                    gap-2
                    leading-none
                ">
                    <IoBeerOutline size={26} />
                    멤버
                </span>
            </div>
            {status === 'pending'
                ? (<ChatMemberSkeleton />)
                : (<>
                    {memoizedUsers.map((item: IUserList) => (
                        <UserBox
                            key={item.id}
                            userInfo={item}
                        />
                    ))}
                </>)
            }
        </aside>
    )
}

export default UserList;
