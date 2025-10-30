export const memberCount = (c: any): number => {
    if (Array.isArray(c?.userIds)) return c.userIds.length; 
    if (Array.isArray(c?.users))   return c.users.length;
    const n = c?._count?.users;
    return Number.isFinite(+n) ? +n : 0;
};

export const pickMsgs = (d: any): any[] => {
    if (!d) return [];
    if (Array.isArray(d.messages)) return d.messages;
    if (Array.isArray(d?.pages)) {
      return d.pages.flatMap((p: any) =>
        Array.isArray(p?.messages) ? p.messages
          : Array.isArray(p) ? p           // 일부 페이저가 배열 자체를 담는 케이스
          : [],
      );
    }
    if (Array.isArray(d)) return d;      // 쿼리 데이터가 배열 그 자체인 경우
    return [];
};

// title만 커스텀 메타로 인정
export const hasCustomMeta = (c: any) =>
    typeof c?.title === "string" && c.title.trim().length > 0;

// messages 개수 가정은 삭제. 마지막 메시지 시각만 신뢰
export const lastMessageMs = (c: any): number => {
    const ms = c?.lastMessageAtMs;
    if (typeof ms === "number" && Number.isFinite(ms)) return ms;
    if (typeof ms === "string" && ms !== "" && Number.isFinite(+ms)) return +ms;

    const t = c?.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
};
      
  
  // 서버 관점에서 "비어 보이는"지
export const serverLooksEmpty = (c: any) => lastMessageMs(c) === 0;

export const isReusableEmptyAiRoom = (c: any) => {
    if (c?.isAIChat !== true) return false;
  
    const noServerPreview = serverLooksEmpty(c); // lastMessageAt/Ms만 신뢰
    const noCustom = !hasCustomMeta(c);
    const soloOrLess = memberCount(c) <= 1;
  
    return noServerPreview && noCustom && soloOrLess;
};