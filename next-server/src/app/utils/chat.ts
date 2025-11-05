import type { PartialConversationType, FullMessageType } from "../types/conversation";

/**
 * 대화방의 멤버 수를 계산
 */
export const memberCount = (c: PartialConversationType | null | undefined): number => {
    if (Array.isArray(c?.userIds)) return c.userIds.length; 
    if (Array.isArray(c?.users))   return c.users.length;
    const n = c?._count?.users;
    return n !== undefined && Number.isFinite(+n) ? +n : 0;
};

/**
 * 메시지 데이터 구조에서 메시지 배열을 추출
 */
export const pickMsgs = (d: { messages?: FullMessageType[]; pages?: Array<{ messages?: FullMessageType[] }> } | FullMessageType[] | null | undefined): FullMessageType[] => {
    if (!d) return [];
    if (Array.isArray(d)) {
        // 배열인 경우: 메시지 배열인지 확인
        if (d.length > 0 && 'id' in d[0] && 'body' in d[0]) {
            return d as FullMessageType[];
        }
        // 빈 배열이거나 메시지가 아닌 배열은 빈 배열 반환
        return [];
    }
    if ('messages' in d && Array.isArray(d.messages)) return d.messages;
    if ('pages' in d && Array.isArray(d.pages)) {
      return d.pages.flatMap((p) =>
        Array.isArray(p?.messages) ? p.messages
          : Array.isArray(p) && p.length > 0 && 'id' in p[0] ? p as FullMessageType[]
          : [],
      );
    }
    return [];
};

// name 필드만 커스텀 메타로 인정
export const hasCustomMeta = (c: { name?: string | null } | null | undefined): boolean =>
    typeof c?.name === "string" && c.name.trim().length > 0;

// messages 개수 가정은 삭제. 마지막 메시지 시각만 신뢰
export const lastMessageMs = (c: PartialConversationType | null | undefined): number => {
    const ms = c?.lastMessageAtMs;
    if (typeof ms === "number" && Number.isFinite(ms)) return ms;
    if (typeof ms === "string" && ms !== "" && Number.isFinite(+ms)) return +ms;

    const t = c?.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
};
      
/**
 * 서버 관점에서 "비어 보이는"지 확인
 */
export const serverLooksEmpty = (c: PartialConversationType | null | undefined): boolean => lastMessageMs(c) === 0;
  
export const isReusableEmptyAiRoom = (c: PartialConversationType | null | undefined): boolean => {
    if (c?.isAIChat !== true) return false;
  
    const noServerPreview = serverLooksEmpty(c); // lastMessageAt/Ms만 신뢰
    const noCustom = !hasCustomMeta(c);
    const soloOrLess = memberCount(c) <= 1;
  
    return noServerPreview && noCustom && soloOrLess;
};