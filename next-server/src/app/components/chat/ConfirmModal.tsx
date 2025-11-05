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
    <Modal isOpen={isOpen} onCloseModal={onCloseModal}>
      <div className="sm:flex sm:items-start">
        <div
          className="
            mx-auto
            flex
            w-12
            h-12
            flex-shrink-0
            items-center
            justify-center
            rounded-full
            bg-red-100
            sm:mx-0
            sm:w-10
            sm:h-10
          "
        >
          <FiAlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div
          className="
            mt-3
            text-center
            sm:ml-4
            sm:mt-0
            sm:text-left
          "
        >
          <div
            className="
              text-base
              font-semibold
              leading-6
            "
          >
            {name}(의) 대화방을 나가겠습니까?
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              대화방의 모든 내용이 삭제됩니다.
            </p>
          </div>
        </div>
      </div>
      <div
        className="
          flex
          justify-center
          sm:justify-start
          sm:flex-row-reverse
          gap-2
          mt-3
          sm:mt-4
        "
      >
        <Button
          disabled={isLoading}
          danger
          onClick={onDelete}
          color="primary"
          variant="solid"
        >
          확인
        </Button>
        <Button
          disabled={isLoading}
          secondary
          onClick={onCloseModal}
          color="danger"
          variant="solid"
        >
          취소
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
