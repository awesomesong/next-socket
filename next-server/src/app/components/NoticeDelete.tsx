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
  const [isLoading, setIsLoading] = useState(false); // Fix 3: 중복 클릭 방지

  // Fix 2: 파라미터 제거 (props 클로저 직접 사용)
  // Fix 5: useCallback으로 메모이제이션
  const handleDeleteNotice = useCallback(async () => {
    // Fix 1: 변수명 shadowing 제거 (result → confirmed, deleteResult)
    const confirmed = confirm(`"${noticeTitle}" 글을 삭제하겠습니까?`);
    if (!confirmed) return;

    const noticeIdStr = String(noticeId);

    // 낙관적 업데이트: 대상 위치/데이터 백업 후 제거
    const prevDetail = snapshotNoticeDetail(queryClient, noticeIdStr);
    const snapshot = queryClient.getQueryData(NOTICE_LIST_KEY) as NoticeListInfinite | undefined;
    const backup = snapshotNoticeCardPosition(queryClient, noticeIdStr);

    removeNoticeCardById(queryClient, noticeIdStr);

    setIsLoading(true); // Fix 3
    try {
      const deleteResult = await deleteNotice(noticeIdStr); // Fix 1

      if (deleteResult.success) {
        queryClient.removeQueries({
          queryKey: noticeDetailKey(noticeIdStr),
          exact: true,
        });

        socket?.emit(SOCKET_EVENTS.NOTICE_DELETED, { noticeId: noticeIdStr });

        router.push(withToastParams(`/notice`, "success", deleteResult.message!));
      } else {
        // Fix 4: success: false 케이스 롤백 처리
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

  // Fix 6: 불필요한 Fragment 제거
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
