'use client';
import { memo, useMemo } from "react";
import Modal from "../Modal";
import Button from "../Button";
import { PiUserCircleDuotone } from "react-icons/pi";
import clsx from "clsx";
import getUser from "@/src/app/lib/getUser";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ProfileModalSkeleton from "../skeleton/ProfileModalSkeleton";
import FallbackNextImage from "../FallbackNextImage";
import StatusMessage from "../StatusMessage";

interface ProfileModalProps {
  isOpen?: boolean;
  onCloseModal: () => void;
}

// ── Internal Helpers ──────────────────────────────────────────────────────────

const Avatar = memo(({ image, name }: { image?: string | null; name?: string | null }) => (
  <div className="avatar-block__container">
    <div className={clsx("avatar-block__box", !image && "flex items-center justify-center")}>
      {image ? (
        <FallbackNextImage
          src={image}
          alt={`${name ?? "사용자"} 이미지`}
          fill
          sizes="(max-width: 640px) 144px, 176px"
          className="object-cover"
        />
      ) : (
        <PiUserCircleDuotone className="avatar-block__icon" />
      )}
    </div>
  </div>
));

const InfoRow = memo(({ label, value }: { label: string; value: string | number }) => (
  <div className="profile-info__row">
    <span className="profile-info__label">{label}</span>
    <span className="profile-info__value">{value}</span>
  </div>
));

// ── Main Component ────────────────────────────────────────────────────────────

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onCloseModal }) => {
  const { data: userInfo, status, isSuccess, error } = useQuery({
    queryKey: ["userInfo"],
    queryFn: getUser,
    enabled: !!isOpen,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    select: (data) => data.userInfo,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const createdAtText = useMemo(() => {
    if (!userInfo?.createdAt) return "";
    const d = new Date(userInfo.createdAt);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric", month: "long", day: "numeric"
    }).format(d);
  }, [userInfo?.createdAt]);

  const profileRows = useMemo(() => {
    if (!userInfo) return [];
    return [
      { label: "가입일", value: createdAtText },
      { label: "인증", value: userInfo.provider === "credentials" ? "회원가입" : userInfo.provider },
      { label: "대화방", value: `${userInfo._count.conversations ?? 0}개` },
      { label: "메시지", value: `${userInfo._count.messages ?? 0}회` },
    ];
  }, [userInfo, createdAtText]);

  return (
    <Modal
      isOpen={isOpen}
      onCloseModal={onCloseModal}
      title="프로필"
      footer={
        <div className="flex items-center justify-end">
          <Button type="button" onClick={onCloseModal} variant="ghostLavender" className="px-8">
            닫기
          </Button>
        </div>
      }
    >
      <div className="max-sm:px-1">
        {status === "error" ? (
          <StatusMessage error={error} fallbackMessage="프로필 정보를 가져오지 못했습니다." minHeight="min-h-[120px]" />
        ) : isSuccess && userInfo ? (
          <div className="profile-modal__container">
            <Avatar image={userInfo.image} name={userInfo.name} />

            <div className="profile-info-wrap">
              <div className="profile-identity">
                <h3 className="text-xl font-bold text-default">{userInfo.name}</h3>
                <span className="text-[10px] text-lavender-muted uppercase tracking-widest bg-lavender-pale/10 px-2 py-0.5 rounded-full border border-lavender-border/20">
                  {userInfo.role === "admin" ? "Admin" : "User"}
                </span>
              </div>

              <div className="profile-info">
                {profileRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ProfileModalSkeleton />
        )}
      </div>
    </Modal>
  );
};

Avatar.displayName = "Avatar";
InfoRow.displayName = "InfoRow";

export default memo(ProfileModal);
