"use client";
import Button from "@/src/app/components/Button";
import Modal from "@/src/app/components/Modal";
import useConversation from "@/src/app/hooks/useConversation";
import { ModalProps } from "@/src/app/types/common";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useSocket } from "../../context/socketContext";
import { useQueryClient } from "@tanstack/react-query";
import { formatErrorMessage } from "@/src/app/lib/react-query/utils";
import { deleteConversation } from "@/src/app/lib/deleteConversations";
import useUnreadStore from "../../hooks/useUnReadStore";
import {
  removeConversationById,
  messagesKey,
  conversationKey,
  upsertMessageSortedInCache,
  setTotalUnreadFromList,
} from "@/src/app/lib/react-query/chatCache";
import toast from "react-hot-toast";

const ConfirmModal: React.FC<ModalProps> = ({ isOpen, onCloseModal, name }) => {
  const socket = useSocket();
  const router = useRouter();
  const { conversationId } = useConversation();
  const { setUnreadCount } = useUnreadStore();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const onDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      const { success, payload } = await deleteConversation(conversationId);
      if (!success) return;

      onCloseModal();

      // 타입 가드: success가 true이면 payload는 DeleteConversationSuccessResponse
      if (!payload || !("ok" in payload) || payload.ok !== true) {
        toast.error("삭제 이벤트 응답이 없습니다.");
        return;
      }

      const event = payload.event;
      if (!event?.type) {
        toast.error("삭제 이벤트 응답이 없습니다.");
        return;
      }

      // ✅ 시스템 메시지가 있으면 소켓으로 전송하고 React Query 캐시 업데이트
      if (event.type === "member.left" && event.systemMessage) {
        // 1) 시스템 메시지를 서버로 전송 (서버에서 대화방 참여자들에게 브로드캐스트)
        if (socket) {
          socket.emit("send:message", {
            newMessage: {
              ...event.systemMessage,
              isAIResponse: false, // ✅ 누락된 필드 추가
              isError: false,      // ✅ 누락된 필드 추가
              conversation: {
                isGroup: true,
                userIds: event.recipients || [],
              }
            }
          });
        }

        // 2) React Query 캐시에 시스템 메시지 추가
        upsertMessageSortedInCache(queryClient, String(conversationId), event.systemMessage);
      }

      // 1) 목록에서 제거
      removeConversationById(queryClient, String(conversationId));

      // 2) 해당 방의 상세/메시지 캐시 제거
      queryClient.removeQueries({ queryKey: messagesKey(conversationId), exact: true });
      queryClient.removeQueries({ queryKey: conversationKey(conversationId), exact: true });

      // 3) 전역 미읽음 합계 갱신
      const totalUnread = setTotalUnreadFromList(queryClient);
      if (totalUnread !== undefined) setUnreadCount(totalUnread);

      if (socket) socket.emit("room.event", event); // 서버/클라 규격에 맞춰 payload 유지
      router.push("/conversations");
    } catch (error) {
      toast.error(
        formatErrorMessage(
          error,
          "대화방 삭제 중에 오류가 발생했습니다. 다시 시도해주세요.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    conversationId,
    onCloseModal,
    queryClient,
    router,
    setUnreadCount,
    socket,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onCloseModal={onCloseModal}
      title={
        <div className="flex flex-row items-center gap-x-4">
          <div
            className="
              shrink-0
              flex
              w-8
              h-8
              sm:w-10
              sm:h-10
              items-center
              justify-center
              rounded-full
              bg-red-50
              dark:bg-red-900/20
              border border-red-100
              dark:border-red-900/30
            "
          >
            <FiAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </div>
          <p className="modal-title">
            '{name}' 대화방에서 나갈까요?
          </p>
        </div>
      }
      footer={
        <div
          className="
            flex
            items-center
            justify-end
            gap-x-3
          "
        >
          <Button
            disabled={isLoading}
            onClick={onCloseModal}
            variant="ghostLavender"
            className="px-6"
          >
            취소
          </Button>
          <Button
            disabled={isLoading}
            onClick={onDelete}
            variant="scent"
            className="px-6"
          >
            확인
          </Button>
        </div>
      }
    >
      <div className="max-sm:px-1">
        <div className="flex flex-col space-y-1 ml-0 text-left sm:text-center sm:items-center">
          <p className="modal-description">
            나가시면 모든 대화 기록이 삭제되며 복구할 수 없습니다.
          </p>
          <p className="modal-description">
            그래도 정말 나가시겠어요?
          </p>
        </div>
      </div>
    </Modal >
  );
};

export default ConfirmModal;
