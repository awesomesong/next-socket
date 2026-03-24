"use client";
import useConversation from "@/src/app/hooks/useConversation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { sendMessage } from "@/src/app/lib/sendMessage";
import toast from "react-hot-toast";
import { useCallback, useEffect, useLayoutEffect, useRef, memo, useState } from "react";
import { useFocusInput } from "@/src/app/hooks/useFocusInput";
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
import ChatSubmitButton from "./ChatSubmitButton";

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
        // clientMessageId 포함: 수신 측에서 낙관 메시지와 정확히 매칭 → 중복 삽입 방지
        const socketMessage = normalizeMessage({
          ...data.newMessage,
          clientMessageId: context.messageId,
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
  }, [processQueue]);

  const { register, handleSubmit, setValue, getValues } =
    useForm<Form>({
      defaultValues: {
        message: "",
      },
    });

  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: registerRef, ...registerRest } = register("message", { required: true });
  const { focusInput, focusAndHold, cancelFocus } = useFocusInput("message", messageInputRef);

  const setTextareaRef = useCallback((el: HTMLTextAreaElement | null) => {
    registerRef(el);
    messageInputRef.current = el;
  }, [registerRef]);

  // ImageUploadButton(CldUploadButton) 초기화 중 포커스 탈취 방지용 inert 상태
  // - false(inert): Cloudinary 스크립트 로드 전까지 버튼 비활성화
  // - true: Cloudinary 로드 완료 후 버튼 활성화
  const [uploadButtonActive, setUploadButtonActive] = useState(false);

  // Cloudinary 스크립트 로드 완료 시점 감지 → inert 해제
  // - inert 중에는 ImageUploadButton이 포커스를 받을 수 없으므로,
  //   window.cloudinary 감지 = 스크립트 초기화 완료 = 탈취 시도 끝난 시점
  // - 이후 발생하는 포커스 탈취는 focusAndHold(3000ms) 폴링이 처리
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("cloudinary" in window) {
      setUploadButtonActive(true);
      return;
    }

    const checkId = window.setInterval(() => {
      if (!("cloudinary" in window)) return;
      window.clearInterval(checkId);
      setUploadButtonActive(true);
      
      // ✅ 고정된 시간(300ms)의 한계를 극복하기 위해 확실한 이벤트 리스너 방식 사용
      // Cloudinary 렌더링 시작 후 최대 3초 이내에 발생하는 "비정상적인 포커스 탈취(body로 이동)"를 정확히 1회 잡아냅니다.
      const el = document.getElementById("message") as HTMLTextAreaElement | null;
      if (!el) return;

      let hasRecovered = false;
      const onBlur = () => {
        if (hasRecovered) return;
        // 터치나 클릭이 아닌, 스크립트 렌더링에 의해 포커스가 body로 튕긴 경우
        setTimeout(() => {
          if (document.activeElement === document.body) {
            el.focus();
            hasRecovered = true; // 1회만 복구
          }
        }, 10);
      };

      el.addEventListener("blur", onBlur);
      // 최대 3초 동안만 감시하고 해제 (안드로이드 시스템 뒤로가기 버튼 등 정상적인 blur 방해 방지)
      setTimeout(() => {
        el.removeEventListener("blur", onBlur);
      }, 3000);

    }, 50);

    return () => window.clearInterval(checkId);
  }, []); // 세션 내 최초 1회만 실행 (Cloudinary는 한 번 로드 후 유지)

  // 마운트/대화 전환 시 포커스 유지 폴링 시작
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const fromDraft = sessionStorage.getItem("scent:focusMessage");
    if (fromDraft) sessionStorage.removeItem("scent:focusMessage");
    // Cloudinary 미로드 상태면 inert 초기화 (대화 전환 시 재보호)
    if (!("cloudinary" in window)) {
      setUploadButtonActive(false);
    }
    focusAndHold();
    return () => cancelFocus();
  }, [focusAndHold, cancelFocus, conversationId]);

  // 2) 실제 제출 로직: RHF 데이터 받음
  const onSubmit = useCallback<SubmitHandler<Form>>(async ({ message }) => {
    // (가벼운 프리체크: 필요하면 유지)
    const check = validateUserMessage(String(message || ""));
    if (!check.isValid) {
      toast.error(check.error || "입력값을 확인해주세요.");
      return;
    }

    const messageId = crypto.randomUUID();
    setValue("message", "", { shouldValidate: true });
    cancelFocus(); // focusAndHold 리스너 해제 (onSettled에서 focusInput으로 복구)
    enqueueSend({ conversationId, data: { message }, messageId });
  }, [conversationId, enqueueSend, setValue, cancelFocus]);

  const handleUpload = useCallback(
    async (result: CloudinaryUploadWidgetResults) => {
      if (
        typeof result.info === "string" ||
        !result.info ||
        !("secure_url" in result.info)
      )
        return;
      const messageId = crypto.randomUUID();
      enqueueSend({
        conversationId,
        image: result.info.secure_url,
        messageId,
      });
    },
    [conversationId, enqueueSend]
  );

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
        border-t-default
    ">
      <div inert={!uploadButtonActive || undefined}>
        <ImageUploadButton onUploadSuccess={handleUpload} variant="compact" />
      </div>
      <form
        onSubmit={submit}
        className="flex items-center gap-2 w-full"
      >
        <TextareaAutosize
          id="message"
          ref={setTextareaRef}
          minRows={2}
          maxRows={4}
          {...registerRest}
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
        <ChatSubmitButton type="button" onClick={submit} />
      </form>
    </div>
  );
};

export default memo(Form);