'use client';
import { IUserList } from "@/src/app/types/common";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import getUsers from "@/src/app/lib/getUsers";
import UserBox from "./UserBox";
import ChatMemberSkeleton from "./skeleton/ChatMemberSkeleton";
import { useSocket } from "../context/socketContext";
import SocketState from "./SocketState";
import { IoBeerOutline } from "react-icons/io5";

const UserList = () => {
    const socket = useSocket();
    const queryClient = useQueryClient();

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

        const handelRegisterUser = () => {
            refetch();
        };
        
        socket.on("register:user", handelRegisterUser);

        return () => {
            socket.off("register:user", handelRegisterUser);
        }
    }, [ socket ]);

    const memoizedUsers = useMemo(() => data?.users || [], [data?.users]);

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
                    <SocketState />
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
