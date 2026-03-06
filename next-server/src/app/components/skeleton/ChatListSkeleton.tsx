"use client";

import { Fragment } from "react";

interface ChatListSkeletonProps {
  variant: "conversation" | "message";
  widths?: {
    primary?: string;
    secondary?: string;
  };
}

const rowClass = "flex items-center gap-3 h-[68px] p-3 skeleton-pulse";
const avatarClass = "shrink-0 w-10 h-10 rounded-full skeleton-bg";
const textColClass = "flex flex-col gap-2";

const ChatListSkeleton = ({
  variant,
  widths = {},
}: ChatListSkeletonProps) => {
  const { primary = "w-32", secondary = "w-40" } = widths;

  const items = Array.from({ length: 30 }).map((_, index) => {
    if (variant === "conversation") {
      return (
        <Fragment key={index}>
          <div className={rowClass}>
            <div className={avatarClass} />
            <div className={`${textColClass} min-w-0`}>
              <div className={`${primary} h-3 rounded-lg skeleton-bg`} />
              <div className={`${secondary} h-3 rounded-lg skeleton-bg-muted-80`} />
            </div>
          </div>
        </Fragment>
      );
    }

    return (
      <Fragment key={index}>
        <div className={`${rowClass} mt-2`}>
          <div className={avatarClass} />
          <div className={textColClass}>
            <div className={`${primary} h-6 rounded-xl skeleton-bg`} />
            <div className={`${secondary} h-4 rounded-xl skeleton-bg-muted-80`} />
          </div>
        </div>
        <div className={`${rowClass} mt-2 flex-row-reverse`}>
          <div className={avatarClass} />
          <div className={`${textColClass} items-end`}>
            <div className={`${primary} h-6 rounded-xl skeleton-bg`} />
            <div className={`${secondary} h-4 rounded-xl skeleton-bg-muted-80`} />
          </div>
        </div>
      </Fragment>
    );
  });

  return <div className="w-full">{items}</div>;
};

export default ChatListSkeleton;
