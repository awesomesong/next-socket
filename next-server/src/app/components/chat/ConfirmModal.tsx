"use client";
import Button from "@/src/app/components/Button";
import Modal from "@/src/app/components/Modal";
import useConversation from "@/src/app/hooks/useConversation";
import useConversationUserList from "@/src/app/hooks/useConversationUserList";
import { ModalProps } from "@/src/app/types/common";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FiAlertTriangle } from 'react-icons/fi'
import { useSocket } from "../../context/socketContext";
import { useQueryClient } from "@tanstack/react-query";
import useUnreadStore from "../../hooks/useUnReadStore";

const ConfirmModal:React.FC<ModalProps> = ({
    isOpen,
    onCloseModal,
    name,
}) => {
    const socket = useSocket();
    const router = useRouter();
    const { conversationId } = useConversation();
    const { setUnreadCount } = useUnreadStore();
    const { data: session } = useSession();
    const { remove, conversationUsers } = useConversationUserList();
    const [ isLoading, setIsLoading ] = useState(false);
    const queryClient = useQueryClient();

    const onDelete = useCallback(() => {
        setIsLoading(true);

        fetch(`/api/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((res) => res.json())
        .then((result) => {
            onCloseModal();
            router.push('/conversations');

            queryClient.setQueryData(['conversationList'], (old: any) => {
                if (!old?.conversations) return old;
                const conversations = old.conversations.filter((c: any) => c.id !== conversationId);
                // 전역 뱃지도 맞춰 갱신 중이라면:
                const total = conversations.reduce((s: number, c: any) => s + (c.unReadCount || 0), 0);
                setUnreadCount(total);
                return { conversations };
              });

            if(socket) {
                const targetUserList = conversationUsers.find((item) => 
                    item.conversationId === conversationId
                );
            
                if (!targetUserList || !result?.existingConversationUsers) return;
            
                const filteredUserIds = targetUserList.userIds.filter(id => 
                    id !== session?.user?.id
                );

                socket.emit("exit:room", {
                        existingUsers: result.existingConversationUsers,
                        conversationId,
                        userIds: filteredUserIds
                    }
                );
            }
            remove(conversationId);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false))
    }, [conversationId, router, onCloseModal]);

    return (
        <Modal
            isOpen={isOpen}
            onCloseModal={onCloseModal}
        >
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
                    <FiAlertTriangle 
                        className="w-6 h-6 text-red-600"
                    />
                </div>
                <div className="
                    mt-3
                    text-center
                    sm:ml-4
                    sm:mt-0
                    sm:text-left
                ">
                    <div className="
                        text-base
                        font-semibold
                        leading-6
                    ">
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
                    variant="flat"
                >
                    확인
                </Button>
                <Button
                    disabled={isLoading}
                    secondary
                    onClick={onCloseModal}
                    color="danger"
                    variant="flat"
                >
                    취소
                </Button>
            </div>
        </Modal>
    )
}

export default ConfirmModal
