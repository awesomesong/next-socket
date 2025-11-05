"use client";
import Button from "@/src/app/components/Button";
import Input from "@/src/app/components/Input";
import Modal from "@/src/app/components/Modal";
import SelectBox from "@/src/app/components/SelectBox";
import { IUserList } from "@/src/app/types/common";
import { useRouter } from "next/navigation";
import { memo, useRef, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SelectInstance, GroupBase, MultiValue } from "react-select";
import getUsers from "@/src/app/lib/getUsers";
import { useMutation, useQuery } from "@tanstack/react-query";
import ShapesSkeleton from "@/src/app/components/skeleton/ShapesSkeleton";
import { createChatConversation } from "@/src/app/lib/createChatConversation";
import { useSocket } from "../../context/socketContext";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";

interface GroupChatModalProps {
  isOpen?: boolean;
  onCloseModal: () => void;
  // users: DefaultSession["user"] & IUserList[];
}

type OptionType = { value: string; label: string };

const GroupChatModal: React.FC<GroupChatModalProps> = ({
  isOpen,
  onCloseModal,
}) => {
  const socket = useSocket();
  const selectRef = useRef<SelectInstance<OptionType, true, GroupBase<OptionType>>>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    data: chatMember,
    status: statusMember,
  } = useQuery({
    queryKey: ["chatMember"],
    queryFn: getUsers,
    enabled: isOpen,
    staleTime: 1000 * 60, // 1분 동안 데이터 유지
  });

  const { 
    mutate,
  } = useMutation({
    mutationFn: ({ data, isGroup, userId }: { data: FieldValues; isGroup: boolean; userId: string; }) => 
      createChatConversation({ data, isGroup, userId }),
    onSuccess: (data) => {
      router.push(`/conversations/${data.id}`);
      onCloseModal();
      if (socket) socket.emit(SOCKET_EVENTS.CONVERSATION_NEW, data);
    },
    onError: () => {
      toast.error("대화방 생성에 실패했습니다.");
    },
    onSettled: () => {
      clearErrors();
      reset();
      setIsLoading(false);
    },
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
    },
  } = useForm<FieldValues>({
    defaultValues: {
      name: "",
      members: [],
    },
  });

  const members = watch("members");
  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (isLoading) return; // 이미 로딩 중이면 중복 제출 방지
    
    setIsLoading(true);

    const membersArr = Array.isArray(data.members) ? data.members : [];
    const memberNum = membersArr.length;

    // ( 유효성 검사 ) 그룹채팅 설정 : 2명 이상일 때만 이름 필수
    if (memberNum > 1 && !String(data.name ?? "").trim()) {
      setIsLoading(false);
      setError("name", {
        message: "2명 이상의 대화방을 생성할 시에는 대화방 이름을 입력해야합니다.",
      }, { shouldFocus: true });
      return;
    }

    if (memberNum < 1) {
      setIsLoading(false);
      selectRef?.current?.focus();
      selectRef?.current?.openMenu("first");
      setError("members", {
        message: "최소 1명 이상의 사용자를 선택해주세요.",
      }, { shouldFocus: true });
      return;
    }
    
    
    const userId = memberNum === 1 ? (membersArr[0].value as string) : undefined;
    const isGroup = memberNum > 1;

    mutate({ 
      data, 
      isGroup, 
      userId: userId as string, 
    });
  };

  return (
    <Modal isOpen={isOpen} onCloseModal={onCloseModal}>
      <form onSubmit={handleSubmit(onSubmit)} id="form">
        <div className="space-y-12">
          <div className="pb-12">
            <h2 className="
              text-xl
              font-semibold  
              leading-7
            "
            >
              대화 상대 선택
            </h2>
            <div
              className="
                mt-10
                flex
                flex-col
                gap-y-8
              "
            >
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
              {statusMember === "success" 
               ? ( <SelectBox
                  isOpen={isOpen}
                  disabled={isLoading}
                  label="채팅 멤버"
                  options={chatMember?.users?.map((user: IUserList) => ({
                    value: user.id,
                    label: user.name,
                  })) ?? []}
                  onChange={(value: MultiValue<OptionType> | null) =>
                    setValue("members", value, {
                      shouldValidate: true,
                    })
                  }
                  value={members}
                  selectRef={selectRef}
                  errors={errors}
                />
              ) : (
                <div
                  className="
                    overflow-hidden
                    inline-block
                    relative
                    rounded-full
                    w-full
                    h-[40px]
                  "
                >
                  <ShapesSkeleton width="100%" height="100%" radius="lg" />
                </div>
              )}
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
            color="primary"
            variant="solid"
          >
            취소
          </Button>
          <Button
            disabled={isLoading}
            type="submit"
            color="danger"
            variant="solid"
          >
            확인
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default memo(GroupChatModal);
