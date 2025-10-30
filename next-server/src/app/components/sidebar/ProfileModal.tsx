'use client';
import { memo, useCallback, useMemo } from "react";
import Modal from "../Modal";
import Button from "../Button";
import { PiUserCircleDuotone } from "react-icons/pi";
import clsx from "clsx";
import getUser from "@/src/app/lib/getUser";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ProfileModalSkeleton from "../skeleton/ProfileModalSkeleton";
import FallbackNextImage from "../FallbackNextImage";

interface ProfileModalProps {
  isOpen?: boolean;
  onCloseModal: () => void;
}

type UserInfo = Awaited<ReturnType<typeof getUser>>["userInfo"];

// ── Sub: Avatar ────────────────────────────────────────────────────────────────
const AvatarBlock = memo(function AvatarBlock({ image, name }: { image: string | null | undefined; name: string | null | undefined; }) {
  const hasImage = !!image;
  return (
    <div className="max-sm:flex max-sm:justify-center">
      <div
        className={clsx(
          "shrink-0 inline-block relative overflow-hidden w-40 h-40",
          hasImage && "rounded-full"
        )}
      >
        {hasImage ? (
          <FallbackNextImage
            src={image!}
            alt={(name ?? "사용자") + " 이미지"}
            fill
            sizes="160px"
            unoptimized={false}
            className="object-cover"
          />
        ) : (
          <PiUserCircleDuotone className="w-full h-full scale-[1.2]" />
        )}
      </div>
    </div>
  );
});

// ── Sub: Key/Value Row ────────────────────────────────────────────────────────
const Row = memo(function Row({ label, children }: { label: string; children: React.ReactNode; }) {
  return (
    <dl className="user-list">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </dl>
  );
});

// ── Sub: Profile Details ──────────────────────────────────────────────────────
const ProfileDetails = memo(function ProfileDetails({ userInfo, createdAtText }: { userInfo: UserInfo; createdAtText: string; }) {
  return (
    <div className="flex flex-col gap-2 sm:gap-1">
      <Row label="이름">{userInfo.name}</Row>
      <Row label="가입일">{createdAtText}</Row>
      <Row label="로그인 인증">{userInfo.provider === "credentials" ? "회원가입" : userInfo.provider}</Row>
      <Row label="권한">{userInfo.role === "user" ? "사용자" : "관리자"}</Row>
      <Row label="참여한 대화방 수">{userInfo._count.conversations}</Row>
      <Row label="보낸 메시지 수">{userInfo._count.messages}</Row>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────────────────────────
const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onCloseModal }) => {
  const handleClose = useCallback(() => {
    onCloseModal();
  }, [onCloseModal]);

  const {
    data: userInfo,
    status,
    isSuccess,
  } = useQuery({
    queryKey: ["userInfo"],
    queryFn: getUser,
    // 모달 열릴 때만 요청
    enabled: !!isOpen,
    // 캐시가 살아있으면 즉시 보여주고(깜빡임X), 5분간 신선
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    // 필요한 필드만 구조적 공유로 꺼내서 전달
    select: (data) => data.userInfo,
    // 직전 데이터 유지로 플리커 방지
    placeholderData: keepPreviousData,
    // 불필요한 재시도 최소화(네트워크 불안 시만 1회)
    retry: 1,
  });

  // 날짜 포매터/문자열 메모
  const createdAtText = useMemo(() => {
    if (!userInfo?.createdAt) return "";
    const d = new Date(userInfo.createdAt);
    // Intl.DateTimeFormat은 생성 비용이 커서 메모이즈
    const fmt = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return fmt.format(d);
  }, [userInfo?.createdAt]);

  return (
    <Modal isOpen={isOpen} onCloseModal={handleClose}>
      <div className="max-sm:px-1">
        <h2 className="text-xl font-semibold leading-7">프로필</h2>

        {status === "error" ? (
          <div className="text-center pt-3 pb-4">프로필 정보를 가져오지 못했습니다.</div>
        ) : isSuccess && userInfo ? (
          <div
            className="
              flex flex-col sm:flex-row
              gap-4 sm:items-center sm:justify-between
              py-4 sm:py-6
            "
          >
            <AvatarBlock image={userInfo.image} name={userInfo.name} />
            <ProfileDetails userInfo={userInfo} createdAtText={createdAtText} />
          </div>
        ) : (
          <ProfileModalSkeleton />
        )}

        <div className="flex items-center justify-end gap-x-6">
          <Button
            type="button"
            secondary
            onClick={onCloseModal}
            color="primary"
            variant="solid"
          >
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default memo(ProfileModal);
