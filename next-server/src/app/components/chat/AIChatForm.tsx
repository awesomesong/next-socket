"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  memo,
} from "react";
import useComposition from "@/src/app/hooks/useComposition";
import { HiPaperAirplane } from "react-icons/hi2";
import TextareaAutosize from "react-textarea-autosize";
import { useSession } from "next-auth/react";
import { ObjectId } from "bson";
import { formatErrorMessage } from "@/src/app/lib/react-query/utils";
import { validatePrompt as validateAIPrompt } from "@/src/app/utils/aiPolicy";
import { FullMessageType, normalizePreviewType } from "@/src/app/types/conversation";
import {
  upsertMessageSortedInCache,
  replaceOptimisticMessage,
  messagesKey,
  bumpConversationOnNewMessage,
  updateMessagePartialById,
} from "@/src/app/lib/react-query/chatCache";
import { useConversationLoading } from "@/src/app/hooks/useConversationLoading";
import { sendMessage } from "@/src/app/lib/sendMessage";
import { useFailedMessages } from "@/src/app/hooks/useFailedMessages";
import { useAIStream } from "@/src/app/hooks/useAIStream";

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
  const { data: session } = useSession();
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

  const onSubmit = useCallback<SubmitHandler<Form>>(async ({ message }) => {
    if (isDisabled) return;
    
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
      const failed = queryClient.getQueryData<InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }>>(
        messagesKey(conversationId)
      )?.pages[0]?.messages.find(m => String(m.id) === String(userMessageId));
      if (failed) addFailedMessage(conversationId, { ...failed, isError: true });
      toast.error(formatErrorMessage(err, "사용자 메시지 저장에 실패했습니다."));
    } finally {
      setIsDisabled(false);
    }
  }, [conversationId, queryClient, requestAI, removeFailedMessage, addFailedMessage, isConversationLoading, setFocus, setValue, session, isDisabled, notifyNewContent]);

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing()) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isDisabled || getValues("message").trim().length === 0) return;
      submit();
    }
  };

  return (
    <div
      className="
        flex
        items-start
        gap-2
        w-full
        px-4
        py-2
        bg-default
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
              : "하이트진로 AI 어시스턴트에게 궁금한 점을 물어보세요."
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
        <button
          type="submit"
          disabled={isDisabled}
          className="
            rounded-full
            p-2
            bg-sky-500
            cursor-pointer
            hover:bg-sky-600
            transition
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          <HiPaperAirplane size={20} className="text-white" />
        </button>
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
