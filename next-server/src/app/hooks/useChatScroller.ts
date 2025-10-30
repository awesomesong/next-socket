/**
| 기능                 | 트리거 위치                              | 역할                            |
| ------------------ | ----------------------------------- | ----------------------------- |
| **onUserScroll**   | scroll 이벤트 핸들러 (`handleScroll`)     | 사용자가 스크롤 올리면 “하단 아님” 플래그로 바꿈  |
| **onNewContent**   | 새 메시지 수신 시 (`handleReceiveMessage`) | 하단이면 자동 스크롤, 아니면 화살표 표시       |
| **scrollToBottom** | 화살표 버튼 클릭 시                         | 강제로 맨 아래로 스크롤                 |
| **showArrow**      | 렌더링 조건 (`shouldShowArrow`)          | 스크롤이 올라간 상태에서 새 메시지가 오면 버튼 표시 |
| **wasAtBottomRef** | 자동 스크롤 여부 판단용 ref                   | 현재 뷰포트가 거의 하단인지 추적            |
**/
import { useCallback, useEffect, useRef, useState } from "react";
import { computeScrollFlags } from "@/src/app/utils/scrollMath";

const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "End", "Home", "ArrowDown", "ArrowUp"]);

export function useChatScroller(getEl: () => HTMLElement | null) {
  const [showArrow, setShowArrow] = useState(false);
  const showArrowRef = useRef(showArrow);
  const wasAtBottomRef = useRef(false);
  const autoScrollingRef = useRef(false);
  const userInteractingRef = useRef(false); // 사용자가 직접 스크롤 중인지
  const rafIdRef = useRef<number | null>(null);

  const setArrowVisibility = useCallback((next: boolean) => {
    showArrowRef.current = next;
    setShowArrow(next);
  }, []);

  useEffect(() => {
    showArrowRef.current = showArrow;
  }, [showArrow]);

  const refreshFlags = useCallback(() => {
    if (typeof window === "undefined") {
      return { atBottom: false, showArrow: false } as const;
    }
    const flags = computeScrollFlags(getEl(), true, wasAtBottomRef.current);
    wasAtBottomRef.current = flags.atBottom;
    setArrowVisibility(flags.showArrow);
    return flags;
  }, [getEl, setArrowVisibility]);

  // ✅ 초기 플래그 1회 동기화 (UI 깜빡임 방지)
  useEffect(() => {
    refreshFlags();
  }, []);

  // ✅ 애니메이션 안전 종료 (언마운트 시 RAF 취소)
  useEffect(() => {
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      autoScrollingRef.current = false;
    };
  }, []);

  const scrollToBottom = useCallback((opts?: { instant?: boolean; force?: boolean }) => {
    const el = getEl();
    if (typeof window === "undefined") return; // ✅ SSR 가드
    if (!el) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const instant = !!opts?.instant || reduceMotion;

    autoScrollingRef.current = true;
    setArrowVisibility(false);
    wasAtBottomRef.current = true;

    // ✅ force = true면 즉시 스크롤 (애니메이션 스킵)
    if (opts?.force) {
      const maxTop = el.scrollHeight - el.clientHeight;
      el.scrollTop = maxTop < 0 ? 0 : maxTop;
      autoScrollingRef.current = false;
      refreshFlags();
      return;
    }

    // ✅ instant면 즉시 스크롤
    if (instant) {
      const maxTop = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: maxTop < 0 ? 0 : maxTop, behavior: "auto" });
      autoScrollingRef.current = false;
      refreshFlags();
      return;
    }

    // ✅ Firefox 호환: JavaScript로 부드러운 스크롤 구현
    const startScroll = el.scrollTop;
    const maxTop = el.scrollHeight - el.clientHeight;
    const targetScroll = maxTop < 0 ? 0 : maxTop;
    const distance = targetScroll - startScroll;
    const duration = 500; // ms (더 느리게)
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      // ✅ 매 프레임마다 사용자 인터랙션 체크
      if (userInteractingRef.current) {
        autoScrollingRef.current = false;
        rafIdRef.current = null;
        refreshFlags();
        return; // 즉시 중단
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // ✅ easeInOutCubic: 부드럽고 자연스러운 easing
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      el.scrollTop = startScroll + distance * easeProgress;

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animateScroll);
      } else {
        autoScrollingRef.current = false;
        refreshFlags();
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(animateScroll);
  }, [getEl, refreshFlags]);

  // ✅ 이미지/콘텐츠 증가 보정 (상시 옵저버, 하단일 때만 반응)
  useEffect(() => { 
    const el = getEl();
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      if (wasAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom({ force: true }));
      }
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [getEl, scrollToBottom]); // ✅ 함수 변경 시 옵저버 재부착

  // ✅ 키보드 스크롤 가드 (window 레벨, 입력 필드 제외)
  const isTypingField = useCallback((t: EventTarget | null) => {
    if (!(t instanceof HTMLElement)) return false;
    const tag = t.tagName.toLowerCase();
    const editable = t.getAttribute("contenteditable");
    return tag === "input" || tag === "textarea" || editable === "" || editable === "true";
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!SCROLL_KEYS.has(e.key) || isTypingField(e.target)) return;
    userInteractingRef.current = true;
    if (autoScrollingRef.current) {
      autoScrollingRef.current = false;
      wasAtBottomRef.current = false;
      setArrowVisibility(true);
    }
  }, [isTypingField, setArrowVisibility]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!SCROLL_KEYS.has(e.key)) return;
    setTimeout(() => {
      userInteractingRef.current = false;
      refreshFlags();
    }, 200);
  }, [refreshFlags]);

  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ SSR 가드

    const handleKeyDownWithTimer = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };

    const handleKeyUpWithTimer = (e: KeyboardEvent) => {
      handleKeyUp(e);
    };

    window.addEventListener("keydown", handleKeyDownWithTimer, { passive: false });
    window.addEventListener("keyup", handleKeyUpWithTimer, { passive: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDownWithTimer);
      window.removeEventListener("keyup", handleKeyUpWithTimer);
    };
  }, [handleKeyDown, handleKeyUp]);

  const onInitialLoad = useCallback(() => {
    // 레이아웃 반영 후 하단 고정
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        scrollToBottom({ instant: true });
      }),
    );
  }, [scrollToBottom]);

  const onUserScroll = useCallback(() => {
    // ✅ 사용자가 직접 스크롤(wheel/touch) 중이면 자동 스크롤 중단
    if (userInteractingRef.current && autoScrollingRef.current) {
      autoScrollingRef.current = false;
      wasAtBottomRef.current = false;
      setArrowVisibility(true);
    }

    // 자동 스크롤 중이 아닐 때만 플래그 업데이트
    if (!autoScrollingRef.current) {
      refreshFlags();
    }
  }, [refreshFlags, setArrowVisibility]);

  const onNewContent = useCallback((opts?: { isScrollingInitial?: boolean }) => {
    // 이미 아래화살표가 보이면 자동 스크롤 금지 (요구사항)
    if (showArrowRef.current) {
      return;
    }

    const shouldStick = wasAtBottomRef.current; // ← 이전 상태 사용 (더 안정적)

    // ✅ 연속 스크롤 요청 시 이전 스크롤 취소하고 새로운 스크롤 시작
    if (autoScrollingRef.current) {
      // 이전 스크롤 애니메이션 취소
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      autoScrollingRef.current = false;
    }

    // ✅ 연속 메시지 전송 시 스크롤 지연 최소화 (단일 RAF)
    requestAnimationFrame(() => {
      // ✅ RAF 실행 시점에 사용자가 스크롤 중이면 중단
      if (userInteractingRef.current) {
        return;
      }
      
      if (shouldStick) {
        // ✅ 초기 스크롤 중이면 force: true (즉시)
        if (opts?.isScrollingInitial) {
          scrollToBottom({ force: true });
        } else {
          // ✅ 하단 고정 상태에서는 즉시 이동
          scrollToBottom({ force: true });
        }
      } else {
        setArrowVisibility(true); // 아니면 버튼만 노출
      }
    });
  }, [scrollToBottom, setArrowVisibility]);

  // ✅ 실제 사용자 인터랙션(wheel/touch) 감지 → 즉시 자동 스크롤 중단
  useEffect(() => {
    const el = getEl();
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleInteractionStart = () => {
      // ✅ 즉시 플래그 설정 (pending RAF 차단)
      userInteractingRef.current = true;
      
      // ✅ 자동 스크롤 중이면 즉시 중단
      if (autoScrollingRef.current) {
        autoScrollingRef.current = false;
        wasAtBottomRef.current = false;
        setArrowVisibility(true);
      }
      
      // 200ms 후 플래그 초기화
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        userInteractingRef.current = false;
      }, 200);
    };

    el.addEventListener("wheel", handleInteractionStart, { passive: true });
    el.addEventListener("touchstart", handleInteractionStart, { passive: true });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      el.removeEventListener("wheel", handleInteractionStart);
      el.removeEventListener("touchstart", handleInteractionStart);
    };
  }, [getEl]);

  // ✅ 탭 전환 감지 (브라우저 탭)
  const wasAtBottomOnTabLeaveRef = useRef<boolean | null>(null);
  const needScrollAfterTabReturnRef = useRef(false);
  
  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ SSR 가드
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 탭 복귀: 맨 아래였으면 스크롤 플래그 설정
        if (wasAtBottomOnTabLeaveRef.current === true) {
          needScrollAfterTabReturnRef.current = true;
          wasAtBottomRef.current = true;
        }
        wasAtBottomOnTabLeaveRef.current = null;
      } else {
        // 탭 이탈: 스크롤 상태 저장
        const flags = refreshFlags();
        wasAtBottomOnTabLeaveRef.current = flags?.atBottom ?? false;
      }
    };
    
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshFlags]);
  
  // ✅ 탭 복귀 후 스크롤 실행 (allMessages 렌더링 후 호출)
  const executeTabReturnScroll = useCallback(() => {
    if (needScrollAfterTabReturnRef.current) {
      needScrollAfterTabReturnRef.current = false;
      wasAtBottomRef.current = true;
      scrollToBottom();
      requestAnimationFrame(() => refreshFlags()); // ✅ 탭 복귀 후 상태 동기화
    }
  }, [scrollToBottom, refreshFlags]);

  return {
    showArrow,
    wasAtBottomRef,
    autoScrollingRef,
    onInitialLoad,
    onUserScroll,
    onNewContent,
    scrollToBottom,
    refreshFlags,
    executeTabReturnScroll,
  };
};
