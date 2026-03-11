"use client";
import Button from "@/src/app/components/Button";
import TextField from "@/src/app/components/TextField";
import Modal from "@/src/app/components/Modal";
import SelectBox from "@/src/app/components/SelectBox";
import { IUserList } from "@/src/app/types/common";
import { useRouter } from "next/navigation";
import { memo, useEffect, useRef, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { SelectInstance, GroupBase, MultiValue } from "react-select";
import getUsers from "@/src/app/lib/getUsers";
import { useQuery } from "@tanstack/react-query";
import { FormInputSkeleton } from "@/src/app/components/FragranceSkeleton";
import type { FullConversationType } from "@/src/app/types/conversation";

interface GroupChatModalProps {
  isOpen?: boolean;
  onCloseModal: () => void;
  onSuccess?: (data: FullConversationType) => void;
}

type OptionType = { value: string; label: string };

const GroupChatModal: React.FC<GroupChatModalProps> = ({
  isOpen,
  onCloseModal,
}) => {
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
    staleTime: 1000 * 60,
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

  useEffect(() => {
    if (!isOpen) {
      reset();
      clearErrors();
      setIsLoading(false);
    }
  }, [isOpen, reset, clearErrors]);

  const members = watch("members");
  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (isLoading) return;

    setIsLoading(true);

    const membersArr = Array.isArray(data.members) ? data.members : [];
    const memberNum = membersArr.length;

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

    onCloseModal();
    reset();
    clearErrors();

    try {
      if (memberNum === 1) {
        // 1:1 대화: 기존 대화방 확인
        const userId = membersArr[0].value;
        const res = await fetch(`/api/conversations/find?userId=${encodeURIComponent(userId)}`);
        const { conversationId } = await res.json();
        if (conversationId) {
          router.push(`/conversations/${conversationId}`);
        } else {
          router.push(`/conversations/new?userId=${userId}`);
        }
      } else {
        // 그룹 대화: 기존 대화방 확인
        const memberIds = membersArr.map((m: OptionType) => m.value).join(',');
        const params = new URLSearchParams({ isGroup: 'true', members: memberIds });
        const res = await fetch(`/api/conversations/find?${params.toString()}`);
        const { conversationId } = await res.json();
        if (conversationId) {
          router.push(`/conversations/${conversationId}`);
        } else {
          const name = String(data.name ?? '').trim();
          if (name) params.set('name', name);
          router.push(`/conversations/new?${params.toString()}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onCloseModal={onCloseModal}
      title="대화 상대 선택"
      footer={
        <div
          className="
            flex
            items-center
            justify-end
            gap-x-4
            mt-6
          "
        >
          <Button
            disabled={isLoading}
            onClick={onCloseModal}
            type="button"
            variant="ghostLavender"
            className="px-8"
          >
            취소
          </Button>
          <Button
            disabled={isLoading}
            form="form"
            type="submit"
            variant="scent"
            className="px-8"
          >
            확인
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} id="form">
        <div className="space-y-6 pb-6">
          <div
            className="
                flex
                flex-col
                gap-y-6
              "
          >
            <TextField
              register={register}
              label="채팅 이름"
              id="name"
              type="text"
              placeholder="채팅 이름을 입력해주세요."
              disabled={isLoading}
              errors={errors}
              placement="outside"
              variant="underlined"
              fullWidth={true}
            />
            {statusMember === "success"
              ? (<SelectBox
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
                <FormInputSkeleton />
              )}
          </div>
        </div>
      </form>
    </Modal >
  );
};

export default memo(GroupChatModal);
