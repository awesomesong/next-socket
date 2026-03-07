"use client";

import type { ReactNode } from "react";
import dayjs from "@/src/app/utils/day";
import FallbackNextImage from "./FallbackNextImage";
import CircularProgress from "./CircularProgress";

/** 리스트 행 액션(수정/삭제) - fill pill 형태, 그라데이션 없이 단색 */
const rowActionBase =
  "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors";

export type EditableItemRowProps = {
  id: string;
  idPrefix: "review" | "comment";
  authorName?: string | null;
  authorImage?: string | null;
  createdAt: string | Date;
  canEdit: boolean;
  isEditing: boolean;
  isUpdating: boolean;
  onStartEdit: () => void;
  onDelete: () => void;
  deleteConfirmMessage: string;
  updatingLabel: string;
  avatarFallback: ReactNode;
  editForm: ReactNode;
  /** Sanitized HTML string for the main content (when not editing) */
  contentHtml: string;
};

export default function EditableItemRow({
  id,
  idPrefix,
  authorName,
  authorImage,
  createdAt,
  canEdit,
  isEditing,
  isUpdating,
  onStartEdit,
  onDelete,
  deleteConfirmMessage,
  updatingLabel,
  avatarFallback,
  editForm,
  contentHtml,
}: EditableItemRowProps) {
  const handleDelete = () => {
    if (typeof window !== "undefined" && window.confirm(deleteConfirmMessage)) {
      onDelete();
    }
  };

  return (
    <div
      id={`${idPrefix}-${id}`}
      className="flex flex-row gap-3 py-1"
    >
      <span className="shrink-0 overflow-hidden relative w-10 h-10 mt-1 rounded-full">
        {authorImage ? (
          <FallbackNextImage
            src={authorImage}
            alt={`${authorName ?? ""} 이미지`}
            fill
            className="object-cover"
            unoptimized={false}
          />
        ) : (
          avatarFallback
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="inline-flex items-center flex-wrap">
          <span className="break-all mr-2 text-sm text-stone-700 dark:text-stone-200">
            {authorName}
          </span>
          <span className="text-stone-400 dark:text-stone-500 mr-2 text-xs">
            {dayjs(createdAt).fromNow()}
          </span>
          {canEdit && (
            <span className="inline-flex items-center gap-1.5 ml-0.5">
              <button
                type="button"
                onClick={onStartEdit}
                className={`${rowActionBase} bg-[#e8e4f0] text-[#5c4a7a] hover:bg-[#ddd8e8] dark:bg-[#9d8fb8] dark:text-[#1f1b29] dark:hover:bg-[#b5a8cc]`}
              >
                수정
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={`${rowActionBase} bg-stone-200 text-stone-600 hover:bg-stone-300 dark:bg-stone-400 dark:text-stone-900 dark:hover:bg-stone-300`}
              >
                삭제
              </button>
            </span>
          )}
        </div>
        {isEditing ? (
          isUpdating ? (
            <div className="flex items-center justify-center py-4">
              <CircularProgress aria-label={updatingLabel} />
            </div>
          ) : (
            editForm
          )
        ) : (
          <pre
            className="whitespace-pre-wrap text-[13px] md:text-[14px] leading-[1.7] text-stone-600 dark:text-stone-300"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}
      </div>
    </div>
  );
}
