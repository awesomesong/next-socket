"use client";
import Button from "@/src/app/components/Button";
import Input from "@/src/app/components/Input";
import Modal from "@/src/app/components/Modal";
import SelectBox from "@/src/app/components/SelectBox";
import { IUserList } from "@/src/app/types/common";
import { User } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { useRouter } from "next/navigation";
import { memo, useRef, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SelectInstance, GroupBase } from "react-select";
import getUsers from "@/src/app/lib/getUsers";
import { useMutation, useQuery } from "@tanstack/react-query";
import ShapesSkeleton from "@/src/app/components/skeleton/ShapesSkeleton";
import { createChatConversation } from "@/src/app/lib/createChatConversation";
import { useSocket } from "../../context/socketContext";

interface GroupChatModalProps {
    isOpen?: boolean;
    onCloseModal: () => void;
    // users: DefaultSession["user"] & IUserList[];
}

type OptionType = { value: string; label: string };

const GroupChatModal:React.FC<GroupChatModalProps> = ({
    isOpen,
    onCloseModal,
}) => {
    const socket = useSocket();
    const selectRef = useRef<SelectInstance<OptionType, false, GroupBase<OptionType>>>(null);
    const router = useRouter();
    const [ isLoading, setIsLoading ] = useState(false);

    const { 
        data: chatMember, 
        status: statusMember,
        isSuccess: isChatMember,
    } = useQuery({
        queryKey: ['chatMember'],
        queryFn: getUsers,
        enabled: isOpen,
        staleTime: 1000 * 60, // 1분 동안 데이터 유지
    });

    const { 
        mutate, 
        data: createChat
    }  = useMutation({
        mutationFn: createChatConversation,
        onSuccess: (data) => {
            router.push(`/conversations/${data.id}`);
            router.refresh();
            onCloseModal();
            if(socket) socket.emit('conversation:new', data);
        },
        onError: () => {
            toast.error('대화방 생성에 실패했습니다.');
        },
        onSettled: () => {
            clearErrors();
            reset();
            setIsLoading(false);
        }
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        setError,
        clearErrors,
        reset,
        formState: {
            errors
        }
    } = useForm<FieldValues>({
        defaultValues: {
            name: '',
            members: []
        }
    });

    const members = watch('members');
    const onSubmit:SubmitHandler<FieldValues> = async (data) => {
        setIsLoading(true);

        const memberNum = Object.keys(data.members).length;
        // ( 유효성 검사 ) 그룹채팅 설정 : 사용자 1명 이상 선택, 그룹채팅 이름 설정 
        if(data.name === '' || (memberNum > 1 && data.name === '')) {
            setIsLoading(false);
            setError(
                'name', // 에러 핸들링할 input요소의 id 입력
                { message: '2명 이상의 대화방을 생성할 시에는 대화방 이름을 입력해야합니다.' }, // 에러 메세지
                { shouldFocus: true }, // 에러가 발생한 input으로 focus 이동
            );
            return; 
        }

        if(memberNum < 1) {
            setIsLoading(false);
            selectRef?.current?.focus();
            selectRef?.current?.openMenu("first");
            clearErrors();
            return; 
        }
        const userId = memberNum === 1 && data?.members[0].value;
        const isGroup = memberNum > 1 ? true : false;

        mutate({data, isGroup, userId});
    };

    return (
        <Modal
            isOpen={isOpen}
            onCloseModal={onCloseModal}
        >
            <form 
                onSubmit={handleSubmit(onSubmit)} 
                id="form" 
            >
                <div className="space-y-12">
                    <div className="pb-12 overflow-hidden">
                        <h2 className="
                            text-xl
                            font-semibold  
                            leading-7
                        ">
                            대화 상대 선택
                        </h2>
                        <div className="
                            mt-10
                            flex
                            flex-col
                            gap-y-8
                        ">
                            <Input 
                                register={register}
                                label="채팅 이름"
                                id="name"
                                type="text"
                                placeholder="채팅 이름을 입력해주세요."
                                disabled={isLoading}
                                errors={errors}
                                placement="outside"
                                variant="bordered"
                                fullWidth={true}
                            />
                            {statusMember === 'success' 
                                ? <SelectBox
                                    isOpen={isOpen}
                                    disabled={isLoading}
                                    label="채팅 멤버"
                                    options={chatMember?.users.map((user: IUserList) => ({
                                        value: user.id,
                                        label: user.name,
                                    }))}
                                    onChange={(value: any) => setValue('members', value, {
                                        shouldValidate: true
                                    })}
                                    value={members}
                                    selectRef={selectRef}
                                    errors={errors}
                                /> 
                                : (<div className="
                                    overflow-hidden
                                    inline-block
                                    relative
                                    rounded-full
                                    w-[464px]
                                    h-[40px]
                                ">
                                    <ShapesSkeleton width="100%" height="100%" radius="lg" />
                                </div>)
                            }
                        </div>
                    </div>
                </div>
                <div
                    className="
                        flex
                        items-center
                        justify-end
                        gap-x-6
                    "
                >
                    <Button
                        disabled={isLoading}
                        onClick={onCloseModal}
                        type="button"
                        color="default"
                        variant="flat"
                    >
                        취소
                    </Button>
                    <Button
                        disabled={isLoading}
                        type="submit"
                        color="secondary"
                        variant="flat"
                    >
                        확인
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default memo (GroupChatModal);
