'use client';
import { DefaultSession } from "next-auth";
import { memo, useCallback } from "react";
import Modal from "../Modal";
import Image from "next/image";
import Button from "../Button";
import { PiUserCircleDuotone } from "react-icons/pi";
import clsx from "clsx";
import getUser from "@/src/app/lib/getUser";
import { useQuery } from "@tanstack/react-query";
import { User } from "@prisma/client";
import ProfileModalSkeleton from "../skeleton/ProfileModalSkeleton";

interface ProfileModalProps {
    isOpen?: boolean;
    onCloseModal: () => void;
}

const ProfileModal:React.FC<ProfileModalProps> = ({
    isOpen,
    onCloseModal,
}) => {

    const { 
        data, 
        status,
        isSuccess,
    } = useQuery({
        queryKey: ['userInfo'],
        queryFn: getUser,
        enabled: isOpen,
        staleTime: 1000 * 60, // 1분 동안 데이터 유지
    });

    const handleClose = useCallback(() => {
        onCloseModal();
    }, [onCloseModal]);

    return (
        <Modal
            isOpen={isOpen}
            onCloseModal={handleClose}
        >
            <div className="max-sm:px-1">
                <h2 className="
                    text-xl
                    font-semibold
                    leading-7
                ">
                    프로필
                </h2>
                {status === 'error' 
                    ? 
                    (<div className="text-center pt-3 pb-4">프로필 정보를 가져오지 못했습니다.</div>)
                    : status === 'success' 
                        ? (<div className="
                            flex
                            flex-col
                            sm:flex-row
                            gap-4
                            sm:items-center
                            sm:justify-between
                            py-4
                            sm:py-6
                        ">
                            <div className="max-sm:flex max-sm:justify-center">
                                <div className={clsx(`
                                    shrink-0
                                    inline-block
                                    relative
                                    overflow-hidden
                                    w-40
                                    h-40
                                `,
                                    !!data.userInfo.image ? 'rounded-full' : ''
                                )}>
                                    {data.userInfo.image ? (
                                        <Image
                                            src={data.userInfo.image}
                                            alt={data.userInfo.name +'이미지'}
                                            fill
                                            sizes="10rem"
                                            unoptimized={false}
                                            className="object-cover"
                                        />  
                                        )
                                        : <PiUserCircleDuotone className="w-full h-full scale-[1.2]"/>
                                    }
                                </div>
                            </div>
                            <div className="
                                flex 
                                flex-col
                                gap-2
                                sm:gap-1
                            ">
                                <dl className="user-list">
                                    <dt>이름</dt>
                                    <dd>{data.userInfo.name}</dd>
                                </dl>
                                <dl className="user-list">
                                    <dt>가입일</dt>
                                    <dd>{new Date(data.userInfo.createdAt).toLocaleString(
                                        "ko-KR", 
                                        {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </dd>
                                </dl>
                                <dl className="user-list">
                                    <dt>로그인 인증</dt>
                                    <dd>
                                        {data.userInfo.provider === 'credentials' 
                                        ? '회원가입' : data.userInfo.provider}
                                    </dd>
                                </dl>
                                <dl className="user-list">
                                    <dt>권한</dt>
                                    <dd>{data.userInfo.role === 'user' ? '사용자' : '관리자'}</dd>
                                </dl>
                                <dl className="user-list">
                                    <dt>참여한 대화방 수</dt>
                                    <dd>{data.userInfo._count.conversations}</dd>
                                </dl>
                                <dl className="user-list">
                                    <dt>보낸 메시지 수</dt>
                                    <dd>{data.userInfo._count.messages}</dd>
                                </dl>
                            </div>
                        </div>)
                        :
                        (<ProfileModalSkeleton />)
                }
                <div 
                    className="
                        flex
                        items-center
                        justify-end
                        gap-x-6
                    "
                >
                    <Button
                        type="button"
                        secondary
                        onClick={onCloseModal}
                        color="secondary"
                        variant="flat"
                    >
                        닫기
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default memo(ProfileModal);
