"use client";
import Link from "next/link";
import { Notice } from "@/src/app/types/notice";
import dayjs from "@/src/app/utils/day";
import { formatNumber } from "@/src/app/utils/formatNumber";
import FallbackNextImage from "./FallbackNextImage";
import ImageSlider from "./ImageSlider";
import { memo, useState } from "react";
import ScentUserAvatar from "./ScentUserAvatar";

const NoticeCard = ({ notice }: { notice: Notice }) => {
  const [sliderIndex, setSliderIndex] = useState(0);
  const noticeImage = notice?.image ?? [];

  return (
    <Link
      href={`/notice/${notice.id}`}
      className="notice-card block h-full"
    >
      {noticeImage?.length > 0 ? (
        <div className="notice-card__image-wrap card-image-slider-box">
          {noticeImage.length > 1 ? (
            <ImageSlider
              images={noticeImage}
              currentIndex={sliderIndex}
              onSelectIndex={setSliderIndex}
              alt={notice.title + " 글의 대표 이미지"}
              variant="compact"
              stopPropagation
              className="relative w-full h-full"
              imageClassName="object-cover"
              sizes="(max-width: 580px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
            />
          ) : (
            <FallbackNextImage
              src={noticeImage[0]}
              alt={notice.title + " 글의 대표 이미지"}
              fill
              sizes="(max-width: 580px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
              unoptimized={false}
              priority={true}
              className="object-cover"
            />
          )}
        </div>
      ) : (
        <div className="notice-card__image-wrap flex items-center justify-center">
          <span
            className="text-[2.5rem] opacity-40 text-[var(--color-lavender-muted)]"
            aria-hidden
          >
            📋
          </span>
        </div>
      )}
      <div className="notice-card__body">
        <h2 className="notice-card__title">
          <span className="text-gradient-scent">{notice.title}</span>
        </h2>
        <div className="notice-card__meta">
          <span className="notice-meta__avatar">
            {notice.author?.image ? (
              <FallbackNextImage
                src={notice.author.image}
                alt={notice.author?.name ?? "작성자"}
                fill
                sizes="28px"
                unoptimized={false}
                className="object-cover"
              />
            ) : (
              <ScentUserAvatar className="drop-shadow-lg" />
            )}
          </span>
          <span>{notice.author?.name ?? "알 수 없음"}</span>
          <span aria-hidden>·</span>
          <span>{dayjs(notice.createdAt).fromNow()}</span>
          <span aria-hidden>·</span>
          <span>조회 {formatNumber({ count: notice.viewCount, type: "view" })}</span>
          <span aria-hidden>·</span>
          <span>댓글 {formatNumber({ count: notice._count.comments })}</span>
        </div>
      </div>
    </Link>
  );
};

export default memo(NoticeCard, (prevProps, nextProps) => {
  return (
    prevProps.notice.id === nextProps.notice.id &&
    prevProps.notice.title === nextProps.notice.title &&
    prevProps.notice.viewCount === nextProps.notice.viewCount &&
    prevProps.notice._count.comments === nextProps.notice._count.comments &&
    prevProps.notice.image === nextProps.notice.image &&
    prevProps.notice.createdAt === nextProps.notice.createdAt &&
    prevProps.notice.author?.name === nextProps.notice.author?.name &&
    prevProps.notice.author?.image === nextProps.notice.author?.image
  );
});
