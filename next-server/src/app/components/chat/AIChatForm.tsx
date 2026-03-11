"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
import useComposition from "@/src/app/hooks/useComposition";
import TextareaAutosize from "react-textarea-autosize";
import { useSession } from "next-auth/react";
import { ObjectId } from "bson";
import { formatErrorMessage } from "@/src/app/lib/react-query/utils";
import { validatePrompt as validateAIPrompt } from "@/src/app/utils/aiPolicy";
import { FullMessageType, normalizePreviewType } from "@/src/app/types/conversation";
import {
  upsertMessageSortedInCache,
  replaceOptimisticMessage,
  bumpConversationOnNewMessage,
  updateMessagePartialById,
} from "@/src/app/lib/react-query/chatCache";
import { useConversationLoading } from "@/src/app/hooks/useConversationLoading";
import { sendMessage } from "@/src/app/lib/sendMessage";
import { useFailedMessages } from "@/src/app/hooks/useFailedMessages";
import { useAIStream } from "@/src/app/hooks/useAIStream";
import ChatSubmitButton from "./ChatSubmitButton";

// Form 타입 정의
type Form = { message: string };

interface Props {
  conversationId: string;
  aiAgentType?: "assistant";
}

const AIChatForm = ({
  conversationId,
  aiAgentType = "assistant",
}: Props) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const isSessionLoading = sessionStatus === "loading";
  const rafIdRef = useRef<number | null>(null);

  // 커스텀 훅을 사용하여 로딩 상태 확인
  const { isLoading: isConversationLoading } = useConversationLoading();

  // 실패한 메시지 관리 훅
  const { addFailedMessage, removeFailedMessage } = useFailedMessages(conversationId);

  // 새 컨텐츠 알림: 프레임당 1회로 coalesce
  const notifyNewContent = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("chat:new-content"));
      rafIdRef.current = null;
    });
  }, []);

  // AI 스트림 요청 훅
  const { requestAI, abort: abortAI } = useAIStream({
    conversationId,
    aiAgentType,
    onNewContent: notifyNewContent,
  });

  // ✅ 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      abortAI();
    };
  }, [abortAI]);

  const { register, handleSubmit, setValue, getValues, setFocus } =
    useForm<Form>({
      defaultValues: { message: "" },
    });

  useEffect(() => {
    setFocus("message");
  }, [setFocus]);

  // 세션 로드 완료 시 포커스 재적용 (세션 로딩 중 리렌더링으로 포커스 유실 방지)
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      setFocus("message");
    }
  }, [sessionStatus, setFocus]);

  // 드래프트 페이지에서 첫 메시지 전송 후 이동해온 경우: pending AI 스트림 자동 시작
  const hasPendingTriggeredRef = useRef(false);
  useEffect(() => {
    if (hasPendingTriggeredRef.current) return;
    if (sessionStatus !== "authenticated" || !session?.user?.id) return;

    const pendingStr = sessionStorage.getItem("scent:pendingAI");
    if (!pendingStr) return;

    let pending: { conversationId: string; userMessage: string; userMessageId: string };
    try {
      pending = JSON.parse(pendingStr);
    } catch {
      sessionStorage.removeItem("scent:pendingAI"); return;
    }
    if (pending.conversationId !== conversationId) return;

    hasPendingTriggeredRef.current = true;
    sessionStorage.removeItem("scent:pendingAI");

    const user = session.user;
    // setTimeout(0): React Strict Mode의 effect→cleanup→effect 사이클 이후에 실행되도록 지연
    // cleanup이 먼저 실행되면 'started = false'이므로 sessionStorage를 복원해 재시도 가능
    let started = false;
    const tid = setTimeout(() => {
      started = true;
      setIsDisabled(true);
      requestAI({
        userMessage: pending.userMessage,
        userMessageId: pending.userMessageId,
        currentUser: {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        },
        conversation: { isGroup: false, userIds: [user.id] },
      }).finally(() => setIsDisabled(false));
    }, 0);

    return () => {
      clearTimeout(tid);
      if (!started) {
        // Strict Mode cleanup: sessionStorage 복원 + 플래그 초기화 → 재실행 시 재시도 가능
        hasPendingTriggeredRef.current = false;
        sessionStorage.setItem("scent:pendingAI", JSON.stringify(pending));
      }
    };
  }, [sessionStatus, session, conversationId, requestAI]);

  const onSubmit = useCallback<SubmitHandler<Form>>(async ({ message }) => {
    if (isDisabled) return;
    if (isSessionLoading) return; // 세션 로딩 중 조용히 대기 (에러 toast 없음)

    const check = validateAIPrompt(String(message || ""));
    if (!check.isValid) {
      toast.error(check.error || "입력값을 확인해주세요.");
      return;
    }
    if (!session?.user?.id) { // 로그인 가드
      toast.error("로그인 후 이용해주세요.");
      return;
    }

    setIsDisabled(true);
    // 위의 가드로 인해 session.user는 존재함이 보장됨
    const user = session.user;
    const userId = user.id;
    const userName = user.name ?? "";
    const userEmail = user.email ?? "";

    // ✅ 입력 필드 초기화
    setValue("message", "", { shouldValidate: true });
    setFocus("message");

    const userMessageId = new ObjectId().toHexString();
    const now = new Date();

    // ✅ 사용자 메시지
    const optimisticUserMessage: FullMessageType = {
      id: userMessageId,
      body: message,
      image: null,
      createdAt: now,
      type: "text",
      conversationId,
      senderId: userId,
      sender: {
        id: userId,
        name: userName,
        email: userEmail,
        image: user.image ?? null,
      },
      conversation: { isGroup: false, userIds: [userId] },
      isAIResponse: false,
      isError: false,
    };

    upsertMessageSortedInCache(queryClient, conversationId, optimisticUserMessage);
    notifyNewContent();

    try {
      const result = await sendMessage({
        conversationId,
        messageId: userMessageId,
        data: { body: message, type: "text", isAIResponse: false, isError: false },
      });

      // 성공: 서버 응답으로 낙관적 메시지 교체
      replaceOptimisticMessage(queryClient, conversationId, userMessageId, result.newMessage);
      removeFailedMessage(conversationId, userMessageId);

      // ✅ 성공 시에만 conversationList 업데이트 (로딩 상태 확인)
      if (!isConversationLoading) {
        // 서버에서 반환한 메시지 타입을 사용 (이미지가 있을 경우 "image")
        const messageType = result.newMessage.type || (result.newMessage.image ? "image" : "text");
        const previewBody = messageType === "image" ? "사진을 보냈습니다." : (message.length > 50 ? message.substring(0, 50) : message);

        bumpConversationOnNewMessage(queryClient, conversationId, {
          id: result.newMessage.id,
          clientMessageId: userMessageId, // ✅ AI 채팅 시 임시 ID로 중복 체크
          body: previewBody,
          type: normalizePreviewType(messageType),
          image: result.newMessage.image || undefined,
          createdAt: result.newMessage.createdAt,
          isAIResponse: false,
        });
      }

      await requestAI({
        userMessage: message,
        userMessageId, // 서버가 이 ID로 조회하여 시간 계산
        currentUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        conversation: { isGroup: false, userIds: [user.id] },
      });
    } catch (err) {
      updateMessagePartialById(queryClient, conversationId, userMessageId, { isError: true });
      addFailedMessage(conversationId, { ...optimisticUserMessage, isError: true });
      toast.error(formatErrorMessage(err, "사용자 메시지 저장에 실패했습니다."));
    } finally {
      setIsDisabled(false);
    }
  }, [conversationId, queryClient, requestAI, removeFailedMessage, addFailedMessage, isConversationLoading, setFocus, setValue, session, isSessionLoading, isDisabled, notifyNewContent]);

  // ✅ 제출 경로 통일 (사파리 모바일 호환: 명시적 preventDefault)
  // handleSubmit은 이벤트 객체가 없어도 작동하지만, 폼 제출 시에는 명시적으로 전달
  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const submit = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const { isComposing, handleCompositionStart, handleCompositionEnd } = useComposition();

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing()) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isDisabled || isSessionLoading || getValues("message").trim().length === 0) return;
      submit();
    }
  }, [isComposing, isSessionLoading, isDisabled, getValues, submit]);

  return (
    <div
      className="
        flex
        items-start
        gap-2
        w-full
        px-4
        py-2
        border-t-default
    ">
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2 w-full"
        noValidate
      >
        <TextareaAutosize
          id="message"
          minRows={2}
          maxRows={4}
          {...register("message", { required: true })}
          placeholder={
            isDisabled
              ? "AI 응답이 완료될 때까지 기다려주세요."
              : "향수 AI 어시스턴트에게 궁금한 점을 물어보세요."
          }
          onKeyDown={handleKeyPress}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          disabled={isDisabled}
          className="
            w-full 
            bg-default
            border-default
            rounded-lg
            p-2
            font-light
            resize-none
            focus:outline-none
          "
        />
        <ChatSubmitButton
          type="submit"
          disabled={isDisabled || isSessionLoading}
        />
      </form>
    </div>
  );
};

export default memo(AIChatForm, (prevProps, nextProps) => {
  return (
    prevProps.conversationId === nextProps.conversationId &&
    prevProps.aiAgentType === nextProps.aiAgentType
  );
});
