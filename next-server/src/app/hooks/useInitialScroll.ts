import { RefObject, useEffect, useRef } from "react";

interface UseInitialScrollOptions {
  scrollRef: RefObject<HTMLElement | null>;
  getLastMessageId: () => string | undefined;
  conversationId: string;
  triggerScroll?: boolean; // ✅ 외부에서 스크롤 트리거 (서버 재시동 등)
  onComplete?: () => void;
  wasAtBottomRef?: { current: boolean };
  isScrollingInitialRef: { current: boolean };
}

/**
 * 초기 진입 시 마지막 메시지까지 렌더링 완료 후 스크롤
 * 간단한 RAF + setTimeout 방식
 */
export function useInitialScroll({
  scrollRef,
  getLastMessageId,
  conversationId,
  triggerScroll,
  onComplete,
  wasAtBottomRef,
  isScrollingInitialRef,
}: UseInitialScrollOptions) {
  const hasScrolledRef = useRef(false);
  const lastConversationIdRef = useRef(conversationId);
  const prevTriggerScrollRef = useRef(triggerScroll);
  
  // ✅ conversationId 변경 시 hasScrolledRef 리셋
  useEffect(() => {
    if (lastConversationIdRef.current !== conversationId) {
      hasScrolledRef.current = false;
      lastConversationIdRef.current = conversationId;
    }
  }, [conversationId]);
  
  // ✅ triggerScroll이 false → true로 변경되면 리셋 (API 재연결)
  useEffect(() => {
    if (!prevTriggerScrollRef.current && triggerScroll) {
      hasScrolledRef.current = false;
      isScrollingInitialRef.current = true; // ✅ 초기 스크롤 플래그도 리셋
    }
    prevTriggerScrollRef.current = triggerScroll;
  }, [triggerScroll, isScrollingInitialRef]);
  
  // ✅ 초기 스크롤 실행
  useEffect(() => {
    // ✅ triggerScroll이 false면 스킵 (데이터 로딩 중)
    if (!triggerScroll) return;
    
    // 이미 스크롤했으면 스킵
    if (hasScrolledRef.current) return;
    
    // 초기 스크롤 중이 아니면 스킵
    if (!isScrollingInitialRef.current) return;
    
    const el = scrollRef.current;
    if (!el) return;
    
    // ✅ wasAtBottomRef 설정
    if (wasAtBottomRef) {
      wasAtBottomRef.current = true;
    }
    
    // ✅ 스크롤 함수
    const doScroll = () => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
    };
    
    // ✅ 통합된 polling: 메시지 대기 + 스크롤 + 안정화 확인
    let attempts = 0;
    const maxAttempts = 40; // 40 × 50ms = 2초
    let prevScrollHeight = 0;
    let stableCount = 0;
    let foundMessage = false;
    
    const pollingInterval = setInterval(() => {
      attempts++;
      
      // 메시지 확인 (첫 발견 시점 기록)
      if (!foundMessage) {
        const lastMessageId = getLastMessageId();
        if (lastMessageId) {
          foundMessage = true;
        }
      }
      
      // 메시지 발견했으면 스크롤 시작
      if (foundMessage) {
        doScroll();
        
        const currentScrollHeight = scrollRef.current?.scrollHeight || 0;
        
        // 높이 안정화 확인
        if (currentScrollHeight === prevScrollHeight) {
          stableCount++;
        } else {
          stableCount = 0;
          prevScrollHeight = currentScrollHeight;
        }
        
        // 안정화됨 (2번 연속 같은 높이)
        const isStable = stableCount >= 2;
        
        // 마지막 메시지 렌더링 확인
        const currentLastId = getLastMessageId();
        const hasLastMessage = currentLastId && el.querySelector(`[data-message-id="${currentLastId}"]`);
        
        // 완료 조건: (메시지 렌더링 + 안정화) 또는 최대 시도
        if ((hasLastMessage && isStable) || attempts >= maxAttempts) {
          clearInterval(pollingInterval);
          
          // 최종 스크롤
          doScroll();
          
          // 플래그 변경
          hasScrolledRef.current = true;
          isScrollingInitialRef.current = false;
          
          // wasAtBottomRef 정리
          if (wasAtBottomRef) {
            requestAnimationFrame(() => {
              if (scrollRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
                wasAtBottomRef.current = scrollTop + clientHeight >= scrollHeight - 50;
              }
            });
          }
          
          onComplete?.();
        }
      } else if (attempts >= maxAttempts) {
        // 타임아웃: 메시지 없음
        clearInterval(pollingInterval);
        isScrollingInitialRef.current = false;
      }
    }, 50);
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [conversationId, triggerScroll]);
}

