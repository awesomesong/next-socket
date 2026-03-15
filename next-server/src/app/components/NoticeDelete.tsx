"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NoticeIdProps } from "@/src/app/types/notice";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../context/socketContext";
import {
  removeNoticeCardById,
  snapshotNoticeCardPosition,
  restoreNoticeCardPosition,
  snapshotNoticeDetail,
  restoreNoticeDetail,
  NOTICE_LIST_KEY,
  noticeDetailKey,
  type NoticeListInfinite,
} from "@/src/app/lib/react-query/noticeCache";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";
import { deleteNotice } from "@/src/app/lib/deleteNotice";
import toast from "react-hot-toast";
import { withToastParams } from "../lib/withToastParams";

type NoticeTitleProps = {
  noticeTitle: string;
};

const NoticeDelete = ({ noticeId, noticeTitle }: NoticeIdProps & NoticeTitleProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteNotice = useCallback(async () => {
    const confirmed = confirm(`"${noticeTitle}" 글을 삭제하겠습니까?`);
    if (!confirmed) return;

    const noticeIdStr = String(noticeId);

    // 낙관적 업데이트: 대상 위치/데이터 백업 후 제거
    const prevDetail = snapshotNoticeDetail(queryClient, noticeIdStr);
    const snapshot = queryClient.getQueryData(NOTICE_LIST_KEY) as NoticeListInfinite | undefined;
    const backup = snapshotNoticeCardPosition(queryClient, noticeIdStr);

    removeNoticeCardById(queryClient, noticeIdStr);

    setIsLoading(true);
    try { 
      const deleteResult = await deleteNotice(noticeIdStr);

      if (deleteResult.success) {
        queryClient.removeQueries({
          queryKey: noticeDetailKey(noticeIdStr),
          exact: true,
        });

        socket?.emit(SOCKET_EVENTS.NOTICE_DELETED, { noticeId: noticeIdStr });

        router.push(withToastParams(`/notice`, "success", deleteResult.message!));
      } else {
        restoreNoticeCardPosition(queryClient, backup, snapshot);
        restoreNoticeDetail(queryClient, noticeIdStr, prevDetail);
        toast.error(deleteResult.message ?? "삭제에 실패했습니다.");
      }
    } catch (error: unknown) {
      // 롤백: 목록/상세 복원
      restoreNoticeCardPosition(queryClient, backup, snapshot);
      restoreNoticeDetail(queryClient, noticeIdStr, prevDetail);

      if (error instanceof Error && error.message?.includes("권한")) {
        router.push("/notice");
      }
      toast.error("공지사항 삭제 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  }, [noticeId, noticeTitle, queryClient, socket, router]);

  return (
    <button
      type="button"
      className="action-btn"
      onClick={handleDeleteNotice}
      disabled={isLoading}
    >
      {isLoading ? '삭제 중' : '삭제'}
    </button>
  );
};

export default NoticeDelete;
