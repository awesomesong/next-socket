"use client";
import useConversation from "@/src/app/hooks/useConversation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane } from "react-icons/hi2";
import TextareaAutosize from "react-textarea-autosize";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { sendMessage } from "@/src/app/lib/sendMessage";
import toast from "react-hot-toast";
import { useCallback, useEffect, useRef, memo } from "react";
import ImageUploadButton from "@/src/app/components/ImageUploadButton";
import { CloudinaryUploadWidgetResults } from "next-cloudinary";
import { useSocket } from "../../context/socketContext";
import useComposition from "@/src/app/hooks/useComposition";
import { FullMessageType, normalizePreviewType } from "../../types/conversation";
import { useSession } from "next-auth/react";
import {
  formatErrorMessage,
} from "@/src/app/lib/react-query/utils";
import { validateUserMessage } from "@/src/app/utils/aiPolicy";
import { ObjectId } from "bson";
import { 
  messagesKey,
  bumpConversationOnNewMessage,
  updateMessagePartialById,
  normalizeMessage,
  upsertMessageSortedInCache,
  replaceOptimisticMessage,
} from "@/src/app/lib/react-query/chatCache";
import { resetSeenUsersForLastMessage } from "@/src/app/lib/react-query/chatCache";
import { getPrevPreview } from "@/src/app/lib/react-query/chatCache";
import { useConversationLoading } from "@/src/app/hooks/useConversationLoading";
import { useFailedMessages } from "@/src/app/hooks/useFailedMessages";
import useConversationUserList from "../../hooks/useConversationUserList";

type Form = { message: string };

const Form = () => {
  const socket = useSocket();
  const { conversationId } = useConversation();
  const { conversationUsers } = useConversationUserList();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // 커스텀 훅을 사용하여 로딩 상태 확인
  const { isLoading: isConversationLoading } = useConversationLoading();
  
  // 실패한 메시지 관리 훅
  const { addFailedMessage, removeFailedMessage } = useFailedMessages(conversationId);

  const { mutateAsync } = useMutation({
    mutationFn: sendMessage,
    onMutate: async (newMessage) => {
      const conversationId = newMessage.conversationId;
      const tempId = newMessage.messageId; // 클라에서 만든 임시 ID

      const body = newMessage.data?.message?.trim() || null;
      const image = newMessage.image || null;
      const optimisticType = image ? "image" : "text";
      
      // ✅ conversationList 미리보기용 body
      // 이미지 메시지는 body를 null로 설정 (ConversationBox에서 type으로 판단)
      const previewBody = image ? null : (body || "");

      const previousData = queryClient.getQueryData<
        InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }>
      >(messagesKey(conversationId));

      const user = session?.user;
      // 로그인된 사용자가 없으면 낙관적 업데이트를 생성하지 않음
      if (!user?.id) {
        return { previousData: undefined };
      }

      const userIds = conversationUsers.find((item) => item.conversationId === conversationId)
        ?.userIds ?? [];

      const isGroupChat = userIds.length > 2;
      // normalizeMessage를 사용하여 낙관적 메시지 생성
      const optimisticMessage = normalizeMessage({
        id: tempId,
        clientMessageId: tempId, // 낙관/서버 매칭용
        conversationId,
        body,
        image,
        createdAt: new Date(),
        type: image ? "image" : "text",
        senderId: user.id,
        sender: {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        },
        conversation: { 
          isGroup: isGroupChat, 
          userIds 
        },
        isAIResponse: false,
        isWaiting: false,
        isTyping: false,
        isError: false,
      });

      // ✅ 낙관 메시지 시간 정규화 (첫 노출이 항상 맨 아래로 안정적)
      const normalizedOptimistic = {
        ...optimisticMessage,
        id: tempId, // 임시 id
        clientMessageId: tempId, // ✅ 교체/중복 방지용 키
        createdAt: new Date(), // ✅ 정렬 안정
        serverCreatedAtMs: Date.now(), // ✅ 정렬 안정
      };

      // ✅ 메시지 목록에 낙관적 업데이트 (정렬 삽입 방식)
      upsertMessageSortedInCache(
        queryClient,
        conversationId,
        normalizedOptimistic,
      );

      // ✅ 새 메시지 전송 시 읽음 상태 리셋 (내가 보낸 메시지이므로 읽음 상태 초기화)
      resetSeenUsersForLastMessage(queryClient, conversationId, tempId);

      // ✅ 연속 메시지 전송 시 스크롤 지연 최소화
      // 큐에 메시지가 쌓여있으면 즉시 스크롤, 아니면 RAF 사용
      if (queueRef.current.length > 0) {
        // 큐에 메시지가 있으면 즉시 스크롤 (연속 전송 중)
        window.dispatchEvent(new CustomEvent("chat:new-content"));
      } else {
        // 단일 메시지면 RAF 사용
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent("chat:new-content"));
        });
      }

      // ✅ 낙관적 업데이트: conversationList 미리보기도 즉시 업데이트
      const prevPreview = getPrevPreview(queryClient, conversationId);
      
      bumpConversationOnNewMessage(queryClient, conversationId, {
        id: tempId,
        clientMessageId: tempId, // ✅ 낙관적 업데이트용 중복 체크
        body: previewBody,
        type: normalizePreviewType(optimisticType),
        image: image || undefined,
        createdAt: normalizedOptimistic.createdAt,
        isAIResponse: false,
      });

      return { 
        previousData, 
        messageId: tempId,
        optimisticType,
        body,
        previewBody,
        image,
        prevPreview, // ✅ 실패 시 복원용
      };
    },
    onSuccess: (data, variables, context) => {
      // ✅ 끊김 없는 교체 (일반 성공)
      if (context?.messageId) {
        replaceOptimisticMessage(
          queryClient,
          conversationId,
          context.messageId,
          data.newMessage
        );
        // 성공 시 실패 목록에서 제거 (재전송 성공한 경우)
        removeFailedMessage(conversationId, context.messageId);
      }
      
      // ✅ 성공 시에만 conversationList 업데이트 (로딩 상태 확인)
      // 스크롤 호출하지 않음 - 중복 가드로 리스트 재정렬 방지
      if (!isConversationLoading && context) {
        bumpConversationOnNewMessage(queryClient, conversationId, {
          id: data.newMessage.id,
          clientMessageId: context.messageId, // ✅ 중복 체크용 임시 ID 추가
          body: context.previewBody, // ✅ 미리보기용 body (이미지일 때 null)
          type: normalizePreviewType(context.optimisticType),
          image: context.image || undefined, // ✅ 이미지 URL 추가
          createdAt: data.newMessage.createdAt,
          isAIResponse: false,
        });
      }
      
      // 소켓으로 메시지 브로드캐스트 (소켓 서버가 기대하는 구조로 전송)
      if (socket && data.newMessage) {
        // ✅ conversationUsers에서 참여자 정보 가져오기
        const currentConversationUsers = conversationUsers.find((item) => item.conversationId === conversationId);
        const userIds = currentConversationUsers?.userIds || [];
        
        // 소켓 전송용 메시지 정규화 (FullMessageType 구조 보장)
        const socketMessage = normalizeMessage({
          ...data.newMessage,
          conversation: {
            isGroup: userIds.length > 2,
            userIds: userIds,
          },
        });
        
        socket.emit("send:message", {
          newMessage: socketMessage,
        });
      }
    },
    onError: (error, _variables, context) => {
      // 실패한 메시지를 목록에서 제거하지 말고 오류 상태로 표시하여 재전송 가능하게 유지
      if (context?.messageId) {
        // 캐시에서 실패 상태 업데이트
        updateMessagePartialById(
          queryClient,
          _variables.conversationId,
          context.messageId,
          { isError: true },
        );
        
        // 실패한 메시지를 localStorage에 저장하여 리패치 후에도 보이도록 함
        const failedMessage = queryClient.getQueryData<InfiniteData<{ messages: FullMessageType[]; nextCursor: string | null }>>(
            messagesKey(_variables.conversationId)
          )
          ?.pages[0]?.messages.find((m) => String(m.id) === String(context.messageId));
        
        if (failedMessage) {
          addFailedMessage(_variables.conversationId, {
            ...failedMessage,
            isError: true,
          });
        }
      }

      // ✅ 실패 시 conversationList 미리보기 복원 (이전 메시지가 있을 때만)
      if (context?.prevPreview) {
        bumpConversationOnNewMessage(queryClient, _variables.conversationId, {
          id: context.prevPreview.id,
          body: context.prevPreview.body,
          type: normalizePreviewType(context.prevPreview.type),
          image: context.prevPreview.image,
          createdAt: context.prevPreview.createdAt,
          isAIResponse: context.prevPreview.isAIResponse || false,
        });
      }

      toast.error(
        formatErrorMessage(
          error,
          "메시지 전송에 실패했습니다. 다시 시도해주세요.",
        ),
      );
    },
    onSettled: () => {},
  });

  // ✅ 전송 직렬화를 위한 큐
  type SendVariables = {
    conversationId: string;
    data?: FieldValues;
    image?: string;
    messageId: string;
  };
  const queueRef = useRef<SendVariables[]>([]);
  const sendingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        // 큐에서 먼저 꺼내 실패해도 다음 항목이 진행되도록 함
        const vars = queueRef.current.shift();
        if (!vars) continue;
        try {
          // 직렬 전송: 이전 요청 완료까지 대기
          await mutateAsync(vars);
        } catch {
          // 에러는 상단 onError에서 처리됨. 다음 항목 진행
        }
      }
    } finally {
      sendingRef.current = false;
    }
  }, [mutateAsync]);

  const enqueueSend = useCallback((vars: SendVariables) => {
      queueRef.current.push(vars);
      // 즉시 처리 시도 (진행 중이면 반환)
      void processQueue();
  },[processQueue]);

  const { register, handleSubmit, setValue, getValues, setFocus } =
    useForm<Form>({
      defaultValues: {
        message: "",
      },
    });

  useEffect(() => {
    setFocus("message");
  }, [setFocus]);

  // 2) 실제 제출 로직: RHF 데이터 받음
  const onSubmit = useCallback<SubmitHandler<Form>>(async ({ message }) => {
    // (가벼운 프리체크: 필요하면 유지)
    const check = validateUserMessage(String(message || ""));
    if (!check.isValid) {
      toast.error(check.error || "입력값을 확인해주세요.");
      return;
    }

    const messageId = new ObjectId().toHexString();
    // 즉시 비우기 + 포커스
    setValue("message", "", { shouldValidate: true });
    setFocus("message");

    enqueueSend({ conversationId, data: { message }, messageId });
  }, [conversationId, enqueueSend, setValue, setFocus]);

  const handleUpload = async (result: CloudinaryUploadWidgetResults) => {
    if (typeof result.info === 'string' || !result.info || !('secure_url' in result.info)) return;

    const messageId = new ObjectId().toHexString();
    enqueueSend({ conversationId, image: result.info.secure_url, messageId });
  };

  // 3) RHF 핸들러를 메모이즈해서 모든 제출 경로에서 사용
  const submit = useCallback(() => handleSubmit(onSubmit)(), [handleSubmit, onSubmit]);

  // ✅ 조합 입력 훅 적용
  const { isComposing, handleCompositionStart, handleCompositionEnd } =
    useComposition();

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (isComposing()) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (getValues("message").trim().length === 0) return;
      submit(); // ✅ RHF 검증 경로
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
      <ImageUploadButton onUploadSuccess={handleUpload} variant="compact" />
      <form
        onSubmit={submit}
        className="flex items-center gap-2 w-full"
      >
        <TextareaAutosize
          id="message"
          minRows={2}
          maxRows={4}
          {...register("message", { required: true })}
          placeholder="메시지를 작성해주세요."
          onKeyDown={handleKeyPress}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
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
          type="button"
          onClick={submit}
          className="
            rounded-full
            p-2
            bg-sky-500
            cursor-pointer
            hover:bg-sky-600
            transition
          "
        >
          <HiPaperAirplane size={20} className="text-white" />
        </button>
      </form>
    </div>
  );
};

export default memo(Form);