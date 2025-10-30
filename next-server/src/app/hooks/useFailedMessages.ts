import { useCallback, useEffect, useState } from "react";
import type { FullMessageType } from "../types/conversation";

const STORAGE_KEY = "failed_messages";

interface FailedMessageData {
    conversationId: string;
    message: FullMessageType;
    timestamp: number;
}

interface FailedMessagesStorage {
    [conversationId: string]: FailedMessageData[];
}

// localStorage에서 실패한 메시지 가져오기
const getFailedMessagesFromStorage = (): FailedMessagesStorage => {
    if (typeof window === "undefined") return {};
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return {};
        const parsed = JSON.parse(stored);
        
        // Date 객체 복원
        Object.keys(parsed).forEach((conversationId) => {
            parsed[conversationId] = parsed[conversationId].map((item: FailedMessageData) => ({
                ...item,
                message: {
                    ...item.message,
                    createdAt: new Date(item.message.createdAt),
                },
            }));
        });
        
        return parsed;
    } catch (error) {
        console.error("Failed to parse failed messages from localStorage:", error);
        return {};
    }
};

// localStorage에 실패한 메시지 저장하기
const saveFailedMessagesToStorage = (data: FailedMessagesStorage): void => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save failed messages to localStorage:", error);
    }
};

export const useFailedMessages = (conversationId?: string) => {
    const [failedMessages, setFailedMessages] = useState<FailedMessagesStorage>({});

    // localStorage에서 초기 데이터 로드
    useEffect(() => {
        setFailedMessages(getFailedMessagesFromStorage());
    }, []);

    // 실패한 메시지 추가
    const addFailedMessage = useCallback((conversationId: string, message: FullMessageType) => {
        setFailedMessages((prev) => {
            const newData = {
                ...prev,
                [conversationId]: [
                    ...(prev[conversationId] || []),
                    {
                        conversationId,
                        message,
                        timestamp: Date.now(),
                    },
                ],
            };
            saveFailedMessagesToStorage(newData);
            return newData;
        });
    }, []);

    // 실패한 메시지 제거 (성공 시 또는 수동 삭제 시)
    const removeFailedMessage = useCallback((conversationId: string, messageId: string) => {
        setFailedMessages((prev) => {
            const newData = {
                ...prev,
                [conversationId]: (prev[conversationId] || []).filter(
                    (item) => String(item.message.id) !== String(messageId)
                ),
            };
            // 빈 배열이면 해당 conversationId 키 삭제
            if (newData[conversationId].length === 0) {
                delete newData[conversationId];
            }
            saveFailedMessagesToStorage(newData);
            return newData;
        });
    }, []);

    // 특정 대화방의 실패한 메시지 모두 제거
    const clearFailedMessages = useCallback((conversationId: string) => {
        setFailedMessages((prev) => {
            const newData = { ...prev };
            delete newData[conversationId];
            saveFailedMessagesToStorage(newData);
            return newData;
        });
    }, []);

    // 특정 대화방의 실패한 메시지 가져오기
    const getFailedMessagesForConversation = useCallback((convId: string): FullMessageType[] => {
        const messages = failedMessages[convId] || [];
        return messages.map((item) => item.message);
    },[failedMessages]);

    // 현재 대화방의 실패한 메시지
    const currentFailedMessages = conversationId ? getFailedMessagesForConversation(conversationId) : [];

    return {
        failedMessages,
        currentFailedMessages,
        addFailedMessage,
        removeFailedMessage,
        clearFailedMessages,
        getFailedMessagesForConversation,
    };
};

