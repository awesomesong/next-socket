import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ConversationListData, conversationListKey } from "@/src/app/lib/react-query/chatCache";
import { formatErrorMessage, SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";
import { useCallback } from "react";
import { isReusableEmptyAiRoom } from "../utils/chat";
import { useSocket } from "../context/socketContext";

interface UseCreateAIConversationOptions {
  onSettled?: () => void;
}

type CreateArgs = { aiAgentType: string };

// ─── 1) 순수 "생성" 훅: 생성 성공 시 새 방으로 라우팅만 담당 ─────────────────
export const useCreateAIConversation = (
  options?: UseCreateAIConversationOptions,
) => {
  const router = useRouter();
  const socket = useSocket();

  return useMutation({
    mutationFn: async ({ aiAgentType }: CreateArgs) => {
      const response = await fetch("/api/conversations/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aiAgentType }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || "AI 채팅방 생성 중 오류가 발생했습니다.",
        );
      }

      return response.json();
    },
    onSuccess: (data, _vars, context) => {
      const id = String(data?.id ?? "");
      if (!id) return;
      
      // ✅ 소켓 이벤트 발송 (본인 포함 모든 탭/기기에 전달됨)
      if (socket) {
        socket.emit(SOCKET_EVENTS.CONVERSATION_NEW, data);
      }
      
      router.push(`/conversations/${id}`);
    },
    onError: (error: any, _vars, context) => {
      toast.error(
        formatErrorMessage(error, "AI 채팅방 생성 중 오류가 발생했습니다."),
      );
    },
    onSettled: () => {
      options?.onSettled?.();
    },
  });
};


// ─── 2) 런처 훅: "재사용 방으로 이동, 없으면 생성" 로직을 캡슐화 ───────────────
export function useLaunchAiConversation(options?: UseCreateAIConversationOptions) {
  const router = useRouter();
  const qc = useQueryClient();
  const create = useCreateAIConversation(options);

  const launch = useCallback(async ({ aiAgentType }: CreateArgs) => {
      if (create.isPending) return { reused: false, id: "" as const }; // 중복 가드
      // 1) 캐시에서 재사용 가능한 빈 AI방 찾기
      const list = qc.getQueryData(conversationListKey) as ConversationListData | undefined;
      const convs = list?.conversations ?? [];
      const reusable = convs.find((c: any) => isReusableEmptyAiRoom(c));

      if (reusable?.id) {
        router.push(`/conversations/${reusable.id}`);
        return { reused: true, id: String(reusable.id) };
      }

      // 2) 없으면 생성 (성공 시 useCreateAIConversation의 onSuccess가 push)
      const data = await create.mutateAsync({ aiAgentType });
      return { reused: false, id: String(data?.id ?? "") };
    },
    [qc, router, create],
  );

  return {
    launch,                 // 호출: launch({ aiAgentType: "assistant" })
    isPending: create.isPending, // 버튼 disabled 등에 사용
  };
}