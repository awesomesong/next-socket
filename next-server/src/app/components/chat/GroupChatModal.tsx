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

  // 멤버 선택 시 미리 대화방 존재 여부를 prefetch
  const prefetchedConversationId = useRef<{ key: string; conversationId: string | null } | null>(null);
  useEffect(() => {
    const membersArr = Array.isArray(members) ? members : [];
    if (membersArr.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        let key: string;
        let url: string;
        if (membersArr.length === 1) {
          const userId = membersArr[0].value;
          key = `1:1:${userId}`;
          url = `/api/conversations/find?userId=${encodeURIComponent(userId)}`;
        } else {
          const memberIds = membersArr.map((m: OptionType) => m.value).join(',');
          key = `group:${memberIds}`;
          url = `/api/conversations/find?isGroup=true&members=${encodeURIComponent(memberIds)}`;
        }
        const res = await fetch(url);
        const { conversationId } = await res.json();
        if (!cancelled) {
          prefetchedConversationId.current = { key, conversationId: conversationId ?? null };
          // 이미 대화방이 존재하면 해당 페이지 prefetch
          if (conversationId) {
            router.prefetch(`/conversations/${conversationId}`);
          }
        }
      } catch {
        // prefetch 실패는 무시 (onSubmit에서 재시도)
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [members, router]);

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

    try {
      let path: string;
      if (memberNum === 1) {
        const userId = membersArr[0].value;
        const cacheKey = `1:1:${userId}`;
        const cached = prefetchedConversationId.current?.key === cacheKey
          ? prefetchedConversationId.current
          : null;

        let conversationId = cached?.conversationId;
        if (cached === null) {
          const res = await fetch(`/api/conversations/find?userId=${encodeURIComponent(userId)}`);
          ({ conversationId } = await res.json());
        }
        path = conversationId
          ? `/conversations/${conversationId}`
          : `/conversations/new?userId=${userId}`;
      } else {
        const memberIds = membersArr.map((m: OptionType) => m.value).join(',');
        const cacheKey = `group:${memberIds}`;
        const cached = prefetchedConversationId.current?.key === cacheKey
          ? prefetchedConversationId.current
          : null;

        let conversationId = cached?.conversationId;
        if (cached === null) {
          const params = new URLSearchParams({ isGroup: 'true', members: memberIds });
          const res = await fetch(`/api/conversations/find?${params.toString()}`);
          ({ conversationId } = await res.json());
        }

        if (conversationId) {
          path = `/conversations/${conversationId}`;
        } else {
          const name = String(data.name ?? '').trim();
          const params = new URLSearchParams({ isGroup: 'true', members: memberIds });
          if (name) params.set('name', name);
          path = `/conversations/new?${params.toString()}`;
        }
      }

      if (path.startsWith("/conversations/")) {
        router.prefetch(path);
      }
      // 모달은 닫지 않고, router가 실제로 이동할 때 같이 사라지게 함. 폼/에러만 초기화해 다음에 다시 열 때 깨끗한 상태 유지
      reset();
      clearErrors();
      onCloseModal();
      router.push(path);
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
              placeholder="채팅 이름을 입력해 주세요."
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
