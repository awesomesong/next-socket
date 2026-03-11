import { useRouter } from "next/navigation";
import type { FullConversationType } from "@/src/app/types/conversation";
import { useCallback, useState } from "react";
interface UseCreateAIConversationOptions {
  onSettled?: () => void;
  onSuccess?: (data: FullConversationType) => void;
}

type CreateArgs = { aiAgentType: string };

// ✅ 런처 훅: AI도 "드래프트 화면"에서 시작 → 첫 메시지 전송 시에만 서버에서 대화방 생성
export function useLaunchAiConversation(options?: UseCreateAIConversationOptions) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const launch = useCallback(async ({ aiAgentType }: CreateArgs) => {
      if (isPending) return { routed: false as const };
      setIsPending(true);
      try {
        router.push(
          `/conversations/new?aiAgentType=${encodeURIComponent(aiAgentType)}`,
        );
        options?.onSettled?.();
        return { routed: true as const };
      } finally {
        setIsPending(false);
      }
    },
    [router, isPending, options],
  );

  return {
    launch,                 // 호출: launch({ aiAgentType: "assistant" })
    isPending,              // 버튼 disabled 등에 사용
  };
}