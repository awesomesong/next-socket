import { transliterateNameToKorean } from './transliterate';
import prisma from '@/prisma/db';

/**
 * 네이버 쇼핑 검색 API (https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md)
 * - 무료 25,000건/일
 * - sort=sim (정확도순) — 네이버 자체 랭킹(인기·판매·매칭정확도)으로 정품 인기 상품 상위 노출
 * - 가격 절대값 게이트 없음 (저렴한 정품 미니/디스커버리/저렴 브랜드를 살리기 위함)
 *
 * 다층 정품 신호 (가격 의존 X):
 *  1) [필수 차단] 샘플/디캔트/짝퉁 키워드 — 명백한 비정품
 *  2) [필수 차단] 1~15ml 소분 사이즈
 *  3) [필수 차단] per-ml 단가 ≥ ₩500 (정품 평균 ₩1,500~3,000/ml — 명백 가짜만 컷)
 *  4) [필수 차단] 향수 카테고리 매칭 — 옷·가방 등 자동 제거
 *  5) [정렬 우대] 신뢰 점수 = 화이트리스트 mall(30점) + 향수 카테고리(20점)
 *                          + productType=2(20점) + 단가 정상범위(10~20점)
 *
 * 신뢰 점수 가중치 설계:
 *  - 화이트리스트 mall(+30): 사람이 검증한 mall — 가장 강한 정품 신호
 *  - 향수 카테고리(+20): mall이 향수로 분류 — 일반 종합몰의 향수도 정상 평가
 *  - productType=2(+20): 네이버 자동 카탈로그 매핑 — 중간 신호 (catalog 페이지가
 *    비활성/매핑해제되는 케이스가 많아 +50→+20으로 강등)
 *  - per-ml 단가(+10~20): 보조 신호
 *
 * URL 정책:
 *  1) item.link (네이버 공식 deeplink) → 원본 mall 상품 페이지 (가장 안정적)
 *  2) link 없으면 → 검색 URL (최후 fallback)
 *  - catalog URL은 비활성/매핑 해제 빈번해서 사용 안 함 (productType=2여도)
 *  - productType=2는 URL이 아니라 신뢰 점수·배지 계산에만 활용
 */

export type TrustBadge = 'verified_catalog' | 'department' | 'official' | 'beauty_store';

/**
 * 네이버 쇼핑 API의 productType (https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md):
 *   '1' = 일반 mall 상품 (productId는 mall 상품 ID — catalog URL로 가면 404)
 *   '2' = 가격비교 카탈로그 상품 (productId가 진짜 catalog ID — catalog URL 작동)
 *   '3' = 가격비교 비매칭
 *   '4' = 중고
 */
export type NaverProductType = '1' | '2' | '3' | '4';

/**
 * 검색 결과 정렬 모드:
 *  - 'price' : 신뢰 tier 내 최저가 순 → 가격 비교 (기본값)
 *  - 'trust' : 배지 우선순위 → trustScore 순 → 신뢰 스토어 추천 (가격 무시)
 *
 * 'trust' 모드 추가 동작:
 *  - 병행수입 상품 차단 (공식 국내 유통만 허용)
 *  - 뷰티 전문몰(올리브영·시코르) > 백화점 > 공식몰 > 나머지 순으로 정렬
 */
export type SearchMode = 'price' | 'trust';

/** 응답 productType이 알려진 값인지 확인 (그 외엔 undefined로 처리). */
function isKnownProductType(v: string | undefined): v is NaverProductType {
  return v === '1' || v === '2' || v === '3' || v === '4';
}

export interface NaverShoppingItem {
  source: 'naver';
  mall: string;
  price: number;
  url: string;
  title: string;
  thumbnail: string;
  size: string | null;
  productId?: string;
  /** 네이버 productType (UI 배지·정렬 우대용) */
  productType?: NaverProductType;
  /** per-ml 단가 (원). size 모르면 null */
  pricePerMl: number | null;
  /** 다층 신호 합산 신뢰 점수 (0-100). 높을수록 정품 가능성 ↑ */
  trustScore: number;
  /** UI에 표시할 신뢰 배지 (복수 가능) */
  badges: TrustBadge[];
}

/**
 * 내부 처리용 확장 type — 필터·로그 단계에서 정규식 결과 재사용을 위함.
 * 외부 API 응답에는 노출하지 않음 (return 직전 strip).
 */
type InternalNaverItem = NaverShoppingItem & {
  _hasFragranceCat: boolean;
  _categoryPath: string;
};

const NAVER_API = 'https://openapi.naver.com/v1/search/shop.json';
const TIMEOUT_MS = 5000;
// 네이버 API 최대값 100. brand.naver.com 같은 공식 스토어가 30위 밖일 수 있어
// 풀을 최대로 늘려서 필터링 후 상위 N개 반환. 응답 약간 무거워지지만 체감 차이 적음.
const FETCH_COUNT = 100;

// 상세 디버그 로그 토글 — 운영 환경에선 false (콘솔 시끄러움 방지),
// 개발·진단 시 SCAN_DEBUG=1로 활성. 핵심 한 줄(summary) 로그는 항상 출력.
const SCAN_DEBUG =
  process.env.SCAN_DEBUG === '1' || process.env.NODE_ENV !== 'production';

// 샘플·소분·디캔트류 (직접적인 비정품 신호). 매 검사 시 toLowerCase() 회피 위해
// 모듈 로드 시 미리 소문자로 정규화 (한국어는 대소문자 영향 없지만 일관성을 위해).
const SAMPLE_KEYWORDS_LOWER = [
  '샘플', '시향', '시향지', '시향노트',
  '디캔트', '디캔', '디켄트',
  '테스터', '테스타', 'tester',
  '소분', '소량', '분할', '분배', '용량분배', '용량소분',
  '분증', '분해', '분주',
  '미니어처', '미니어쳐', '미니',
  '트래블', '트라벨', '트레블', 'travel',
  '공병', '리필', '리필용',
  '휴대용', '휴대',
].map((k) => k.toLowerCase());

// 짝퉁·이미테이션·비공식 유통 키워드 (비정품·해외 비공식 신호)
const IMITATION_KEYWORDS_LOWER = [
  '짝퉁', '이미테이션', '이미타시옹',
  '인스파이어', '인스파이어드', 'inspired',
  '유사향', '유사', '비슷한향', '비슷한',
  '미러', 'mirror',
  '복제', '모방',
  'dupe', 'duplicate',
  '카피향', '카피',
  '저렴이', '저렴한',
  '대체향', '대체',
  // 병행수입은 SearchMode='trust' 일 때만 차단 (가격 비교에서는 허용)
  // → runSingleSearch filterParallelImport 파라미터로 처리
].map((k) => k.toLowerCase());

// 1~15ml 소분 사이즈 (정품 최소가 보통 30ml 이상)
const SMALL_SIZE_REGEX = /(?:^|[^\d])(1|1\.5|2|2\.5|3|4|5|6|7|7\.5|8|9|10|12|15)\s*ml\b/i;

// oz 소분 사이즈 — 0.x oz는 전부 샘플/미니 (0.33 oz ≈ 10ml, 0.5 oz ≈ 15ml)
// 1 oz ≈ 30ml도 미니이지만 허용; 0.x oz만 차단
const SMALL_SIZE_OZ_REGEX = /(?:^|[^\d])0\.\d{1,2}\s*(?:fl\.?\s*)?oz\b/i;

// per-ml 단가 하한 — 정품은 보통 ₩1,500~3,000/ml. ₩500 미만은 명백히 가짜·소분 의심.
// (size 추출 못 하면 이 게이트는 건너뜀)
const MIN_PRICE_PER_ML = 500;
// per-ml 단가 정상 범위 — 신뢰 점수 가산 기준
const NORMAL_PRICE_PER_ML = 1_000;

/**
 * 신뢰할 수 있는 mall 화이트리스트 (mallName이 포함하면 매칭).
 *
 * 정책: **검증된 mall 패턴만 유지**. generic 키워드(/공식|오피셜|official/) 같은
 * 자유 텍스트 매칭은 mall이 자기 이름에 임의로 그 단어를 붙이면 자동 통과되므로
 * 검증 효과가 약함 (예: "듀씨엘 공식 스토어" 같은 미검증 mall도 +30점 받게 됨).
 *
 * 추가 기준:
 *  - 백화점·면세점: 한국에서 공인된 정품 유통 채널
 *  - 뷰티 전문몰: 시코르·올리브영처럼 공식 입점 검증 채널
 *  - 브랜드 직영: 도메인이 brand.naver.com인 경우 isOfficialNaverBrandStore로 자동 부여
 *    (코드에 명시적 브랜드명 패턴은 검증된 것만 유지)
 */
const TRUSTED_MALL_PATTERNS: { pattern: RegExp; badge: TrustBadge }[] = [
  // 백화점 (한국 정품 유통 공인 채널)
  { pattern: /롯데(닷컴|온|백화점|면세점)?/i, badge: 'department' },
  { pattern: /현대(Hmall|백화점|면세점|H몰)?/i, badge: 'department' },
  { pattern: /신세계(몰|백화점|면세점|TV쇼핑)?/i, badge: 'department' },
  { pattern: /SSG/i, badge: 'department' },
  { pattern: /갤러리아/i, badge: 'department' },
  { pattern: /AK(몰|플라자)?/i, badge: 'department' },

  // 면세점 (공인 정품 유통)
  { pattern: /(신라|롯데|현대|신세계)면세점/i, badge: 'department' },

  // 뷰티·향수 전문몰 (입점 검증 채널)
  { pattern: /시코르|chicor/i, badge: 'beauty_store' },
  { pattern: /올리브영|oliveyoung/i, badge: 'beauty_store' },
  { pattern: /(부띠끄|코스메스토어|비비더비|아리따움|닥터자르트)/i, badge: 'beauty_store' },

  // 브랜드 직영 — 다음 두 가지 신호 합치:
  //  1) generic "공식/오피셜/official" 단어 (의류 겸업 브랜드는 검증된 mall 풀이 적어,
  //     이 패턴이 정렬에 필요. URL 검증(verifyAndFill)이 빈 페이지 mall을 제거하니
  //     자유 단어로 점수만 받아도 사용자가 실제로 빈 페이지 만나지 않음)
  //  2) 명시적 글로벌 브랜드명 (디올·샤넬 등)
  //  3) brand.naver.com 도메인은 isOfficialNaverBrandStore가 별도로 official 부여
  { pattern: /공식|오피셜|official/i, badge: 'official' },
  { pattern: /(dior|chanel|hermes|tom\s*ford|jo\s*malone|byredo|diptyque|le\s*labo)\s*(직영|brand)?/i, badge: 'official' },
];

function stripHtml(s: string): string {
  return s.replace(/<\/?[^>]+>/g, '').trim();
}

function extractSize(title: string): string | null {
  const ml = title.match(/(\d+(?:\.\d+)?)\s*ml\b/i);
  if (ml) return `${ml[1]}ml`;
  const oz = title.match(/(\d+(?:\.\d+)?)\s*(?:fl\.?\s*)?oz\b/i);
  if (oz) return `${oz[1]}oz`;
  return null;
}

/**
 * 추출된 size 문자열에서 ml 환산값 반환 (oz → ml 변환 포함).
 * 단가 계산과 소분 크기 게이트에 사용.
 */
function extractMlNumber(size: string | null): number | null {
  if (!size) return null;
  const ml = size.match(/^(\d+(?:\.\d+)?)\s*ml$/i);
  if (ml) return parseFloat(ml[1]);
  const oz = size.match(/^(\d+(?:\.\d+)?)\s*oz$/i);
  if (oz) return Math.round(parseFloat(oz[1]) * 29.5735); // 1 fl oz = 29.5735 ml
  return null;
}

/**
 * 비정품 의심도 판정 — 키워드/사이즈/단가 3중 게이트 (가격 절대값은 사용 X).
 * 하나라도 걸리면 true (= 결과에서 제외).
 *
 * 정품인데 저렴한 케이스(미니/디스커버리/저렴 브랜드)를 살리기 위해 가격 절대값 게이트 제거.
 * 대신 per-ml 단가가 명백히 비정상(₩500/ml 미만)이면 차단.
 */
function isLikelySample(
  title: string,
  price: number,
  pricePerMl: number | null,
): boolean {
  const lower = title.toLowerCase();

  // 1) 샘플·소분·디캔트 키워드 (사전 lowercase로 호출당 변환 절감)
  if (SAMPLE_KEYWORDS_LOWER.some((k) => lower.includes(k))) return true;

  // 2) 짝퉁·이미테이션 키워드 (별도 — 사용자 신뢰가 핵심)
  if (IMITATION_KEYWORDS_LOWER.some((k) => lower.includes(k))) return true;

  // 3) 1~15ml 소분 사이즈 (ml) 또는 0.x oz (oz 단위 샘플 — 0.33 oz ≈ 10ml)
  if (SMALL_SIZE_REGEX.test(title)) return true;
  if (SMALL_SIZE_OZ_REGEX.test(title)) return true;

  // 4) per-ml 단가 명백 비정상 (size 알 수 있을 때만)
  if (pricePerMl !== null && pricePerMl < MIN_PRICE_PER_ML) return true;

  // 5) 가격 자체가 비정상 (₩1,000 미만은 거의 확실히 광고/오류)
  if (price < 1_000) return true;

  return false;
}

/**
 * link URL이 네이버 인증 브랜드 공식 스토어(brand.naver.com)인지 판정.
 *
 * 왜 강한 신호인가:
 *  - brand.naver.com 도메인은 네이버와 직접 제휴 계약을 맺은 브랜드만 발급받음
 *  - smartstore.naver.com은 일반 셀러도 가능 → 신뢰도 다양
 *  - brand.naver.com은 디올·샤넬·랄프로렌 프래그런스 등 공식 스토어 전용
 *
 * mall 이름 매칭(화이트리스트)이 놓치는 케이스를 잡음:
 *  - mall명이 "랄프로렌 프래그런스" → 화이트리스트에 "랄프"가 없어도
 *    link 도메인으로 공식몰 인증 가능
 */
function isOfficialNaverBrandStore(link: string): boolean {
  if (!link) return false;
  try {
    const url = new URL(link);
    return url.hostname === 'brand.naver.com' || url.hostname.endsWith('.brand.naver.com');
  } catch {
    // URL 파싱 실패 (잘못된 link) → 일반 mall로 취급
    return false;
  }
}

/**
 * mall 이름 + link 도메인 조합으로 신뢰 배지 반환.
 *
 * 두 신호를 합쳐서 평가:
 *  1) link가 brand.naver.com → 자동 official 배지 (가장 강력)
 *  2) mallName 패턴 매칭 → 백화점·시코르·올리브영 등 배지
 *
 * 두 신호 모두 official 배지를 부여하면 중복 추가 안 함.
 */
function getMallBadges(mallName: string, link: string): TrustBadge[] {
  const badges: TrustBadge[] = [];

  // 1) link 도메인이 네이버 브랜드 공식 스토어 → official
  if (isOfficialNaverBrandStore(link)) {
    badges.push('official');
  }

  // 2) mallName 패턴 매칭 (백화점·뷰티 전문·기타 공식 표기)
  for (const { pattern, badge } of TRUSTED_MALL_PATTERNS) {
    if (pattern.test(mallName) && !badges.includes(badge)) {
      badges.push(badge);
    }
  }
  return badges;
}

/**
 * 다층 신호를 합산한 신뢰 점수 (0~100).
 *  - mall 화이트리스트: +30점 (백화점/면세점/공식몰/뷰티 전문 — 사람이 검증)
 *  - 카테고리 "향수" 매칭: +20점 (mall이 향수로 분류 — 의류 겸업 브랜드 정품도 정상 평가)
 *  - productType='2' (가격비교 카탈로그): +20점 (이전 +50에서 강등.
 *    catalog 페이지가 비활성/매핑해제되는 경우가 많아 강한 신호로 보기 어려움)
 *  - per-ml 단가 정상 (≥ ₩1,000): +10점
 *  - per-ml 단가 매우 정상 (≥ ₩2,000): 추가 +10점 (총 +20)
 *
 * 의도: 시코르·백화점에 입점하지 않는 브랜드(랄프로렌·캘빈클라인 등 의류 겸업) 향수도
 * 향수 카테고리 + 단가 정상으로 50점 가까이 받아 정상 노출됨.
 */
function calcTrustScore(
  productType: NaverProductType | undefined,
  badges: TrustBadge[],
  categoryIsFragrance: boolean,
  pricePerMl: number | null,
): number {
  let score = 0;
  if (badges.length > 0) score += 30;
  if (categoryIsFragrance) score += 20;
  if (productType === '2') score += 20;
  if (pricePerMl !== null) {
    if (pricePerMl >= NORMAL_PRICE_PER_ML) score += 10;
    if (pricePerMl >= NORMAL_PRICE_PER_ML * 2) score += 10;
  }
  return score;
}

/**
 * URL 정책 — 항상 item.link (네이버 공식 deeplink) 우선.
 *
 * catalog URL을 폐기한 이유:
 *  - productType=2(가격비교 카탈로그)여도 실제 catalog 페이지가 "상품 정보 없음"으로 뜨는
 *    경우가 빈번. 카탈로그가 비활성화/만료/매핑 해제됐을 수 있음.
 *  - mall들이 다 빠진 빈 카탈로그면 사용자가 빈 페이지를 보게 됨.
 *  - 반면 item.link는 네이버가 만든 공식 deeplink로 mall 상품 페이지에 직행 →
 *    상품이 살아있는 한 거의 항상 작동.
 *
 * productType=2 신호는 URL 라우팅에서 제거되었지만 신뢰 점수/배지에는 그대로 유지
 * (네이버 카탈로그 매칭 자체는 정품 신호로 여전히 유효).
 *
 * 우선순위:
 *  1) item.link (http 시작) → 원본 mall 상품 페이지
 *  2) 없으면 → 검색 URL fallback
 */
function buildItemUrl(originalLink: string, title: string): string {
  if (originalLink && originalLink.startsWith('http')) {
    return originalLink;
  }
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(title)}`;
}

/**
 * URL이 살아있는지 HEAD 요청으로 검증.
 *
 * 설계 결정:
 *  - HEAD 사용 (GET보다 가벼움, body 안 받음)
 *  - timeout 3초 (느린 mall이 전체 응답 막지 않게)
 *  - redirect: 'follow' (mall 사이트가 흔히 리다이렉트 사용)
 *  - 실패(timeout/예외) 시 true 반환 — 보수적 통과
 *    이유: HEAD를 차단하는 mall들도 정상 작동하므로, 잘못 죽이는 false negative
 *    피하는 게 우선. 잘못 통과시키는 false positive는 빈 페이지 노출이지만
 *    그건 받아들임 (HEAD 차단 mall은 결국 검증 불가능).
 *
 *  - 200~399: 살아있음
 *  - 4xx/5xx: 죽었거나 비활성 → 제외
 */
async function checkUrlAlive(url: string): Promise<boolean> {
  if (!url || !url.startsWith('http')) return false;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
      redirect: 'follow',
    });
    return res.status >= 200 && res.status < 400;
  } catch {
    // timeout, network error, HEAD 차단 등 → 보수적으로 통과 (false negative 회피)
    return true;
  }
}

/**
 * 신뢰 점수 정렬된 후보 목록에서 URL 검증 통과한 항목만 골라 target개 채움.
 *
 *  - 후보를 순서대로 검증, 통과한 것만 result에 추가
 *  - target개 채워지면 즉시 종료 (불필요한 HEAD 요청 절약)
 *  - 후보 부족(검증 통과가 target 미만)이면 통과한 것만 반환
 *
 * HEAD 요청 병렬화: 한 번에 5개씩 batch로 검증해서 응답 시간 단축.
 */
async function verifyAndFill<T extends { url: string }>(
  candidates: T[],
  target: number,
): Promise<T[]> {
  const result: T[] = [];
  const batchSize = 5;

  for (let i = 0; i < candidates.length && result.length < target; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const aliveFlags = await Promise.all(batch.map((c) => checkUrlAlive(c.url)));

    for (let j = 0; j < batch.length; j++) {
      if (result.length >= target) break;
      if (aliveFlags[j]) result.push(batch[j]);
    }
  }

  return result;
}

/**
 * 향수 카테고리 매칭 패턴 (네이버 응답의 category1~4 중 하나라도 매칭되면 통과).
 *
 * 네이버 쇼핑은 향수를 mall에 따라 다양한 경로로 분류:
 *   - "화장품/미용 > 향수" (대부분)
 *   - "패션잡화 > 남성향수/여성향수" (일부)
 *   - "백화점 > 향수" 등
 *
 * 의류 카테고리(상의/하의/원피스/셔츠/티셔츠 등)는 자동으로 떨어짐.
 */
const FRAGRANCE_CATEGORY_REGEX = /향수|perfume|fragrance|코롱|cologne|오\s*드\s*(퍼퓸|뚜왈렛|뚜왈레)|edp|edt|edc|parfum/i;

/**
 * 상품 title에서 향수 관련 단서를 찾는 패턴 (positive signal).
 *
 * 진짜 향수라면 보통 title에 부향률·"향수"·"perfume" 등 신호가 함께 인쇄됨.
 * EDP/EDT/EDC는 word boundary로 감싸 "edit", "edition" 같은 단어 오매칭 방지.
 */
const TITLE_FRAGRANCE_KEYWORDS_REGEX =
  /향수|코롱|오\s*드\s*(퍼퓸|뚜왈렛|뚜왈레|코롱)|오드퍼퓸|오드뚜왈렛|perfume|fragrance|cologne|eau\s*de|\bedp\b|\bedt\b|\bedc\b|parfum|extrait/i;

function hasTitleFragranceSignal(title: string): boolean {
  return TITLE_FRAGRANCE_KEYWORDS_REGEX.test(title);
}

/**
 * title에 명백한 비-향수(옷·잡화) 단어가 있으면 차단 (negative signal).
 *
 * 이 방식이 "향수 단어 없으면 차단"보다 정확:
 *  - 정품 누락 위험 거의 없음 (옷 단어가 정품 향수 title에 들어가는 일은 사실상 없음)
 *  - mall이 카테고리를 옷→향수로 잘못 분류해도 title은 못 속임
 *  - 예: "Ralph Lauren Polo Shirt" → "shirt" 매칭 → 차단
 *  - 예: "Ralph Lauren Polo Blue 100ml" → 옷 단어 없음 → 통과
 *
 * 의류·잡화 핵심 키워드만 (false positive 최소화).
 */
const TITLE_CLOTHING_KEYWORDS_REGEX =
  /셔츠|\bshirt\b|티셔츠|t-?shirt|폴로\s*셔츠|polo\s*shirt|블라우스|blouse|니트|knit|스웨터|sweater|후드|hoodie|자켓|jacket|점퍼|jumper|코트|\bcoat\b|패딩|padding|조끼|vest|가디건|cardigan|원피스|드레스|\bdress\b|치마|skirt|팬츠|pants|바지|진|jean|반바지|shorts|레깅스|leggings|트레이닝|tracksuit|운동복|가방|\bbag\b|백팩|backpack|크로스백|토트백|tote|클러치|clutch|지갑|wallet|벨트|belt|모자|\bcap\b|\bhat\b|비니|beanie|운동화|sneakers|구두|loafer|로퍼|샌들|sandal|슬리퍼|slipper|부츠|boots|양말|socks|언더웨어|underwear|속옷|brassiere|브래지어|팬티|스카프|scarf|머플러|muffler|장갑|gloves|시계|watch|쥬얼리|jewelry|반지|ring|목걸이|necklace|귀걸이|earring|팔찌|bracelet|선글라스|sunglasses|안경|eyewear/i;

function hasTitleClothingSignal(title: string): boolean {
  if (!TITLE_CLOTHING_KEYWORDS_REGEX.test(title)) return false;

  // 향수 표지가 같이 있으면 옷 차단하지 않음 — 사은품(가방·파우치) 케이스 false positive 방지
  //   예: "랄프로렌 향수 폴로67 EDT 125ML +폴로파우치 가방"
  //     → "가방"이 옷으로 잡히지만 "향수", "EDT"가 분명히 있어 진짜 향수
  //     → 향수 표지 있으면 옷 차단 무시 → 통과 ✓
  if (TITLE_FRAGRANCE_KEYWORDS_REGEX.test(title)) return false;

  return true;
}

/**
 * 매칭 단계에서 무시할 관사·연결어 (stop words).
 * mall이 등록한 title에 이런 단어가 빠질 수 있어 매칭 요구에서 제외.
 *
 *  예) name="PEACH & TEA" → "and" 자동 분리 → ["peach", "tea"]
 *      name 한글="피치 앤 티" → "앤" stop으로 제거 → ["피치", "티"]
 *      → mall title "피치티" / "피치 티" / "피치앤티" 모두 매칭 ✓
 */
const MATCH_STOP_WORDS = new Set([
  '앤', 'and',
  '의', 'of',
  '더', 'the',
  '오브',
  '인', 'in',
  '온', 'on',
]);

/**
 * 매칭용 정규화 — 띄어쓰기·특수문자 제거 + 소문자.
 * 같은 단어가 mall마다 다르게 표기되는 차이 흡수.
 *
 *  "피치 앤 티"   → "피치앤티"
 *  "피치 & 티"    → "피치티"
 *  "PEACH-TEA"   → "peachtea"
 *  "Polo · 67"   → "polo67"
 */
function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[\s&·\-_/]+/g, '');
}

/**
 * title이 검색한 brand 또는 name과 매칭되는지 검증.
 *
 * 동기: 네이버 API가 마이너 브랜드(LOE 등)에 그 향수가 없으면 부분 키워드(향수,
 * 50ml, EDT)로 무관한 향수들을 반환. 우리 신뢰 점수만 보면 그 무관한 향수가
 * 90점 받고 1위 노출됨. → title 매칭 검증으로 차단.
 *
 * 통과 조건 (둘 중 하나):
 *  - normalize한 title에 normalize한 brand 단어 포함 (3자 이상 brand만)
 *  - normalize한 title에 name의 **모든 핵심 단어**가 매칭
 *    (stop words 제외, 2자 이상)
 *
 * 표기 차이 흡수 (normalize + stop):
 *  - 띄어쓰기: "피치 티" vs "피치티" → normalize로 동일
 *  - 관사: "피치 앤 티" vs "피치 티" → "앤" stop으로 동일
 *  - 특수문자: "PEACH & TEA" vs "PEACH-TEA" → normalize로 동일
 *
 * 예시:
 *  - "LOE 피치 앤 티" + mall "피치앤티 50ml" → 정상 매칭 ✓
 *  - "LOE 피치 앤 티" + mall "피치 티 향수" → "앤" stop, 피치·티 모두 매칭 ✓
 *  - "LOE PEACH & TEA" + mall "Tea Rose" → "peach" 없음 → 제외 ✓
 *  - "Ralph Lauren Polo 67" + mall "랄프로렌 폴로67 EDT" → polo+67 모두 매칭 ✓
 *  - "Ralph Lauren Polo 67" + mall "랄프로렌 폴로 블루" → "67" 없음 → 제외 ✓ (다른 모델)
 */
function titleMatchesQuery(
  title: string,
  brand: string,
  name: string,
  koreanName?: string | null,
): boolean {
  const titleNorm = normalizeForMatch(title);
  const brandNorm = normalizeForMatch(brand);

  // brand 매칭 (3자 이상만 — 짧은 brand는 false positive 위험)
  if (brandNorm.length >= 3 && titleNorm.includes(brandNorm)) return true;

  // name 단어 매칭 시도 (영문 + 한글 변환된 name 둘 다)
  //  - 영문 mall title은 영문 name 매칭
  //  - 한글 mall title("폴로67")은 한글 변환 name("폴로 67") 매칭
  // 둘 중 하나라도 매칭되면 통과 → 영문·한글 mall 모두 잡힘
  if (matchByNameWords(titleNorm, name)) return true;
  if (koreanName && matchByNameWords(titleNorm, koreanName)) return true;

  return false;
}

/**
 * name의 핵심 단어가 모두 title에 substring으로 있는지 검증.
 * stop words 제외, 2자 이상 단어만 매칭 필수.
 */
function matchByNameWords(titleNorm: string, name: string): boolean {
  const nameLower = name.toLowerCase().trim();
  if (!nameLower) return false;

  const nameWords = nameLower
    .split(/[\s&]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !MATCH_STOP_WORDS.has(w));
  if (nameWords.length === 0) return false;

  return nameWords.every((w) => titleNorm.includes(normalizeForMatch(w)));
}

/**
 * 검색 쿼리에서 중복 단어 제거 (대소문자 무시).
 *
 * OCR이 brand를 잘못 잡아서 brand+name 합칠 때 중복 발생하는 케이스 대응.
 *   예) brand="Polo", name="Polo 67" → "Polo Polo 67" → "Polo 67"
 *   예) brand="랄프로렌", name="랄프로렌 폴로 67" → "랄프로렌 폴로 67"
 *
 * brand가 잘못 추출돼도 검색 정확도 유지. 부작용 없음 (중복 단어는 검색에 무익).
 */
function dedupeWords(query: string): string {
  const words = query.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    unique.push(w);
  }
  return unique.join(' ');
}

/**
 * 검색 쿼리 정규화 — 중복 단어 제거 + "향수" 키워드 보강.
 * - 의류·잡화 겸업 브랜드의 향수 검색 시 의류 결과 우대 차단
 * - 이미 "향수/코롱/perfume/fragrance/cologne/eau de" 있으면 추가 안 함
 */
function enhanceQueryForFragrance(query: string): string {
  const deduped = dedupeWords(query);
  const lower = deduped.toLowerCase();
  const hasFragranceKeyword =
    /향수|코롱|perfume|fragrance|cologne|eau\s*de/i.test(lower);
  return hasFragranceKeyword ? deduped : `${deduped} 향수`;
}

/**
 * 단일 검색 라운드 — 네이버 API 호출 + 필터링까지.
 * 정렬·slice·strip은 상위 호출자(searchNaverShopping)에서 처리.
 *
 * 반환 객체에 통계(로그용)와 final passed 리스트 함께 담아 호출자가 1·2차 결과를
 * 비교·병합하기 쉽게 만듦.
 */
interface SearchRoundResult {
  query: string; // enhance 적용된 실제 쿼리
  receivedCount: number; // 네이버 API가 반환한 raw item 수
  passed: InternalNaverItem[]; // 모든 필터 통과 (안전망으로 1차 결과)
  stats: {
    afterPrimaryFilter: number; // 키워드/사이즈/단가 통과
    afterFragranceFilter: number; // 옷·카테고리 통과
    afterTitleMatch: number; // title이 검색어와 매칭됨
    rejectedClothing: number;
    rejectedNonFragranceCategory: number;
    rejectedTitleMismatch: number;
  };
  blockedSamples: string[];
}

async function runSingleSearch(
  rawQuery: string,
  brand: string,
  name: string,
  koreanName: string | null = null,
  filterParallelImport = false,
): Promise<SearchRoundResult> {
  const clientId = process.env.NAVER_SHOPPING_CLIENT_ID;
  const clientSecret = process.env.NAVER_SHOPPING_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('NAVER_SHOPPING_CLIENT_ID/SECRET missing');
  }

  const query = enhanceQueryForFragrance(rawQuery);
  // exclude=used:cbshop — 중고·해외직구를 API 레벨에서 차단 (소스 차단이 가장 확실)
  const url = `${NAVER_API}?query=${encodeURIComponent(query)}&display=${FETCH_COUNT}&sort=sim&exclude=used:cbshop`;

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Naver Shopping API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    items?: {
      title: string;
      link: string;
      image: string;
      lprice: string;
      mallName: string;
      productId?: string;
      productType?: string;
      category1?: string;
      category2?: string;
      category3?: string;
      category4?: string;
    }[];
  };

  const stats = {
    afterPrimaryFilter: 0,
    afterFragranceFilter: 0,
    afterTitleMatch: 0,
    rejectedClothing: 0,
    rejectedNonFragranceCategory: 0,
    rejectedTitleMismatch: 0,
  };
  const blockedSamples: string[] = [];

  if (!data.items || data.items.length === 0) {
    return { query, receivedCount: 0, passed: [], stats, blockedSamples };
  }

  // ── parse ──────────────────────────────────────────
  const allItems: InternalNaverItem[] = data.items
    .map((item): InternalNaverItem => {
      const cleanTitle = stripHtml(item.title);
      const size = extractSize(cleanTitle);
      const ml = extractMlNumber(size);
      const price = parseInt(item.lprice, 10);
      const pricePerMl =
        ml !== null && ml > 0 && Number.isFinite(price)
          ? Math.round(price / ml)
          : null;
      const badges = getMallBadges(item.mallName, item.link);
      const productType: NaverProductType | undefined = isKnownProductType(item.productType)
        ? item.productType
        : undefined;
      const categoryPath = [
        item.category1,
        item.category2,
        item.category3,
        item.category4,
      ]
        .filter(Boolean)
        .join(' > ');
      const hasFragranceCat =
        categoryPath.length > 0 && FRAGRANCE_CATEGORY_REGEX.test(categoryPath);
      const trustScore = calcTrustScore(productType, badges, hasFragranceCat, pricePerMl);

      return {
        source: 'naver' as const,
        mall: item.mallName,
        price,
        url: buildItemUrl(item.link, cleanTitle),
        title: cleanTitle,
        thumbnail: item.image,
        size,
        productId: item.productId,
        productType,
        pricePerMl,
        trustScore,
        badges,
        _hasFragranceCat: hasFragranceCat,
        _categoryPath: categoryPath,
      };
    })
    .filter((item) => Number.isFinite(item.price) && item.price > 0 && item.productType !== '4');

  // ── 1차: 키워드/사이즈/단가 게이트 ────────────────
  const primaryPassed = allItems.filter((item) => {
    if (isLikelySample(item.title, item.price, item.pricePerMl)) return false;
    if (filterParallelImport) {
      // trust 모드: 병행수입 차단 (가격 비교에서는 허용)
      if (item.title.toLowerCase().includes('병행수입')) return false;
    }
    return true;
  });
  stats.afterPrimaryFilter = primaryPassed.length;

  // ── 2차: 옷·비-향수 카테고리 차단 (negative signal) ──
  // 향수명 자체에 의류 단어 포함(e.g. "WHITE SHIRTS", "POLO SHIRT") 시 의류 필터 면제
  // — 해당 단어가 상품명 일부이므로 셀러 title에 그 단어가 있어도 의류가 아님
  const nameHasClothingWord =
    TITLE_CLOTHING_KEYWORDS_REGEX.test(name) ||
    (koreanName ? TITLE_CLOTHING_KEYWORDS_REGEX.test(koreanName) : false);

  const fragrancePassed = primaryPassed.filter((item) => {
    if (!nameHasClothingWord && hasTitleClothingSignal(item.title)) {
      stats.rejectedClothing++;
      if (blockedSamples.length < 5) {
        blockedSamples.push(`[옷 title] ${item.mall} | ${item.title.slice(0, 50)}`);
      }
      return false;
    }
    if (item._categoryPath.length > 0 && !item._hasFragranceCat) {
      stats.rejectedNonFragranceCategory++;
      if (blockedSamples.length < 5) {
        blockedSamples.push(
          `[비-향수 cat] ${item.mall} | ${item.title.slice(0, 40)} | cat="${item._categoryPath}"`,
        );
      }
      return false;
    }
    return true;
  });
  stats.afterFragranceFilter = fragrancePassed.length;

  // 3차: title 매칭 검증 — 검색어와 무관한 향수 차단 (마이너 브랜드 케이스 핵심)
  //   네이버가 "LOE PEACH & TEA" 검색에 "딥티크 오 로즈"를 반환하는 경우 같은
  //   부분 키워드 매칭 노이즈를 거름. brand 또는 name 단어가 title에 있어야 통과.
  //   koreanName이 있으면 한글 mall title("폴로67")도 매칭 시도.
  const titleMatched = fragrancePassed.filter((item) => {
    if (titleMatchesQuery(item.title, brand, name, koreanName)) return true;
    stats.rejectedTitleMismatch++;
    if (blockedSamples.length < 5) {
      blockedSamples.push(
        `[title 불일치] ${item.mall} | ${item.title.slice(0, 50)}`,
      );
    }
    return false;
  });
  stats.afterTitleMatch = titleMatched.length;

  // title 매칭이 정확도 우선의 마지막 게이트. 0건이면 0건으로 정직 반환.
  //  - LOE 같은 마이너 브랜드 케이스: 무관한 향수 차단이 핵심 의도
  //  - 안전망(폴백)을 두면 의도 위반 — 차라리 PriceCards 0건 표시 + 네이버 검색 링크 fallback
  const passed = titleMatched;

  return { query, receivedCount: allItems.length, passed, stats, blockedSamples };
}

/**
 * 두 SearchRoundResult를 병합 — 1차(영문) + 2차(한글) 결과 통합.
 *  - URL 기준 중복 제거 (1차 우선)
 *  - 통계는 합산 (디버그용)
 *  - query는 "1차 | 2차" 형식
 */
function mergeRounds(r1: SearchRoundResult, r2: SearchRoundResult): SearchRoundResult {
  const seenUrls = new Set(r1.passed.map((i) => i.url));
  const additions = r2.passed.filter((i) => !seenUrls.has(i.url));
  return {
    query: `${r1.query} | ${r2.query}`,
    receivedCount: r1.receivedCount + r2.receivedCount,
    passed: [...r1.passed, ...additions],
    stats: {
      afterPrimaryFilter: r1.stats.afterPrimaryFilter + r2.stats.afterPrimaryFilter,
      afterFragranceFilter: r1.stats.afterFragranceFilter + r2.stats.afterFragranceFilter,
      afterTitleMatch: r1.stats.afterTitleMatch + r2.stats.afterTitleMatch,
      rejectedClothing: r1.stats.rejectedClothing + r2.stats.rejectedClothing,
      rejectedNonFragranceCategory:
        r1.stats.rejectedNonFragranceCategory + r2.stats.rejectedNonFragranceCategory,
      rejectedTitleMismatch:
        r1.stats.rejectedTitleMismatch + r2.stats.rejectedTitleMismatch,
    },
    blockedSamples: [...r1.blockedSamples, ...r2.blockedSamples].slice(0, 5),
  };
}

/**
 * 메인 검색 — brand+name 분리 받아 1회 검색 후 정렬·반환.
 *
 * 흐름:
 *   1) "${brand} ${name}" 쿼리로 네이버 API 호출 (1회만)
 *   2) 필터링·신뢰 점수 정렬 → 상위 display개 반환
 *
 * brand.naver.com 공식 스토어가 API 결과에 없으면 우리가 어떻게 할 수 없음
 * (네이버 API의 한계). 그 경우는 UI에서 "네이버 쇼핑에서 보기" 링크로 우회 —
 * buildFallbackSearchUrl가 만든 URL을 응답에 항상 포함.
 *
 * 시그너처를 brand+name 분리해서 받는 이유:
 *  - 호출자(prices route)가 brand/name 따로 갖고 있음
 *  - 향후 검색 전략 변경(예: brand만으로 fallback) 시 코드 수정 최소화
 */
export interface SearchResult {
  items: NaverShoppingItem[];
  /**
   * 한글 변환된 name (LLM 호출 결과). prices route가 naverSearchUrl 생성에 활용.
   * 변환 실패 또는 입력과 동일하면 null.
   *
   * 항상 한글 변환을 시도 — 1차 결과 유무와 무관하게. 사용자가 "네이버 쇼핑에서
   * 검색하기" 클릭 시 한글로 정확히 검색되도록 (네이버는 띄어쓰기·표기에 민감).
   */
  koreanName: string | null;
}

export async function searchNaverShopping(
  brand: string,
  name: string,
  display = 5,
  mode: SearchMode = 'price',
): Promise<SearchResult> {
  const trimmedBrand = brand.trim();
  const trimmedName = name.trim();
  const rawQuery = [trimmedBrand, trimmedName].filter(Boolean).join(' ');

  // 한글 변환 — DB 캐시 우선, 없으면 LLM 호출 후 저장.
  // (병렬 처리 불가: title 매칭이 koreanName에 의존해서 직렬)
  let koreanName = '';
  if (trimmedName) {
    const cached = await prisma.fragranceKoreanName.findUnique({
      where: { brand_name: { brand: trimmedBrand, name: trimmedName } },
    });
    if (cached) {
      koreanName = cached.korean;
    } else {
      koreanName = await transliterateNameToKorean(trimmedName);
      if (koreanName) {
        await prisma.fragranceKoreanName.upsert({
          where: { brand_name: { brand: trimmedBrand, name: trimmedName } },
          create: { brand: trimmedBrand, name: trimmedName, korean: koreanName },
          update: { korean: koreanName },
        });
      }
    }
  }

  const isTrustMode = mode === 'trust';

  // 1차: 영문 쿼리로 검색 (단 title 매칭은 영문 + 한글 둘 다 시도)
  let round = await runSingleSearch(
    rawQuery,
    trimmedBrand,
    trimmedName,
    koreanName || null,
    isTrustMode,
  );
  let koreanRound: SearchRoundResult | null = null;

  // 1차 결과 0건 + 한글 변환 성공 → 2차 한글 쿼리로 재검색
  if (round.passed.length === 0 && koreanName) {
    const koreanQuery = [trimmedBrand, koreanName].filter(Boolean).join(' ');
    koreanRound = await runSingleSearch(
      koreanQuery,
      trimmedBrand,
      koreanName,
      null, // 이미 한글로 검색했으니 추가 한글 매칭 X
      isTrustMode,
    );
    round = mergeRounds(round, koreanRound);
  }

  // ── 정렬 ──────────────────────────────────────────────────────────────
  // 'price' 모드: 신뢰 tier 내 최저가 순 (가격 비교용)
  //   Tier 0 (trustScore >= 20): 향수 카테고리·카탈로그·신뢰 몰 — 최저가 순
  //   Tier 1 (trustScore < 20) : 신호 없음 — 후순위
  //
  // 'trust' 모드: 배지 우선순위 → trustScore 순 (신뢰 스토어 추천용, 가격 무시)
  //   뷰티 전문몰(올리브영·시코르) > 백화점 > 공식몰 > verified_catalog > 나머지
  const MIN_TRUSTED_SCORE = 20;

  // trust 모드에서 배지 종류별 가중치 (높을수록 우선)
  const TRUST_BADGE_WEIGHT: Partial<Record<TrustBadge, number>> = {
    beauty_store: 4,
    department: 3,
    official: 2,
    verified_catalog: 1,
  };

  const sorted = round.passed.sort((a, b) => {
    if (isTrustMode) {
      const aBw = Math.max(0, ...a.badges.map((x) => TRUST_BADGE_WEIGHT[x] ?? 0));
      const bBw = Math.max(0, ...b.badges.map((x) => TRUST_BADGE_WEIGHT[x] ?? 0));
      if (bBw !== aBw) return bBw - aBw;
      return b.trustScore - a.trustScore;
    }
    // price 모드: tier → 최저가
    const aTier = a.trustScore >= MIN_TRUSTED_SCORE ? 0 : 1;
    const bTier = b.trustScore >= MIN_TRUSTED_SCORE ? 0 : 1;
    if (aTier !== bTier) return aTier - bTier;
    return a.price - b.price;
  });

  // URL 검증 + 후보 보충 (link 작동 확인)
  //  - 신뢰 점수가 높은 순으로 검증
  //  - 죽은 mall(404 등)은 건너뛰고 다음 후보로 보충
  //  - display개 채워지면 즉시 종료 → 불필요한 HEAD 절약
  //  - 첫 스캔만 비용 발생, 두 번째부터는 24h prices 캐시 hit
  const resultInternal = await verifyAndFill(sorted, display);

  logSearchSummary(round, sorted, resultInternal, koreanRound);

  // 내부 필드 strip + koreanName 함께 반환
  const items = resultInternal.map(
    ({ _hasFragranceCat, _categoryPath, ...publicFields }) => publicFields,
  );
  return {
    items,
    koreanName: koreanName || null,
  };
}

/**
 * 검색 결과 로그.
 * - 핵심 한 줄은 항상 출력 (수신·통과·검증·반환 4단계 통계)
 * - SCAN_DEBUG 환경에서: brand store 추적, mall 분포, URL 검증에서 잘린 mall
 */
function logSearchSummary(
  round: SearchRoundResult,
  sorted: InternalNaverItem[], // 정렬 후 전체 (URL 검증 대상)
  result: InternalNaverItem[], // 검증 통과한 최종
  koreanRound: SearchRoundResult | null = null, // 2차 한글 검색 결과 (있을 시)
): void {
  console.log(
    `[naverShopping] query="${round.query}" | 수신=${round.receivedCount} → 옷·cat 통과=${round.stats.afterFragranceFilter} → title 매칭=${round.stats.afterTitleMatch} → URL검증=${result.length}/${sorted.length} → 반환=${result.length}`,
  );
  if (koreanRound) {
    console.log(
      `  ↳ 1차 0건 → 한글 변환 2차 검색 "${koreanRound.query}" 수신=${koreanRound.receivedCount}, title 매칭=${koreanRound.stats.afterTitleMatch}`,
    );
  }

  if (!SCAN_DEBUG) return;

  // brand.naver.com 노출 여부 (네이버 API 한계 모니터링용)
  const brandStoreItems = round.passed.filter((i) => isOfficialNaverBrandStore(i.url));
  if (brandStoreItems.length > 0) {
    const survived = brandStoreItems.filter((i) => result.some((r) => r.url === i.url)).length;
    console.log(`  brand.naver.com: 수신=${brandStoreItems.length}, 최종노출=${survived}`);
  } else {
    console.log(`  brand.naver.com: 수신 0건 → UI 우회 링크(네이버 쇼핑 검색)로 안내`);
  }

  // 차단 통계 (옷 title / 비-향수 카테고리 / title 검색어 불일치)
  const { rejectedClothing, rejectedNonFragranceCategory, rejectedTitleMismatch } = round.stats;
  if (rejectedClothing > 0 || rejectedNonFragranceCategory > 0 || rejectedTitleMismatch > 0) {
    console.log(
      `  차단: 옷 title=${rejectedClothing}, 비-향수 cat=${rejectedNonFragranceCategory}, title 불일치=${rejectedTitleMismatch}`,
    );
    if (round.blockedSamples.length > 0) {
      console.log(`  차단 예시:\n    - ${round.blockedSamples.join('\n    - ')}`);
    }
  }

  // mall 분포 (2차 통과 시점) — 어떤 mall들이 들어왔는지 한눈에
  const passedMallCount = countByMall(round.passed);
  const passedTop = topMalls(passedMallCount, 10);
  if (passedTop.length > 0) {
    console.log(`  통과 mall TOP 10: ${formatMallCounts(passedTop)}`);
  }

  // URL 검증에서 잘린 mall 분포 — 어떤 mall이 죽었는지 추적
  const finalUrls = new Set(result.map((r) => r.url));
  const droppedInVerify = sorted.filter((s) => !finalUrls.has(s.url));
  if (droppedInVerify.length > 0) {
    const droppedMallCount = countByMall(droppedInVerify);
    const droppedTop = topMalls(droppedMallCount, 10);
    console.log(`  URL 검증 잘린 mall TOP 10: ${formatMallCounts(droppedTop)}`);
  }

  if (result.length > 0) {
    console.log(
      `  반환 결과: ${result
        .map((r) => `[${r.trustScore}점] ${r.mall} | ${r.title.slice(0, 40)}`)
        .join('\n              ')}`,
    );
  }
}

/** mall명 → 출현 횟수 카운트. */
function countByMall(items: { mall: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.mall, (counts.get(item.mall) ?? 0) + 1);
  }
  return counts;
}

/** Map<mall, count>를 횟수 내림차순 정렬해 상위 N개 반환. */
function topMalls(counts: Map<string, number>, n: number): [string, number][] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** 로그용 포맷: "mall×3, mall2×2, ..." */
function formatMallCounts(top: [string, number][]): string {
  return top.map(([m, c]) => `${m}×${c}`).join(', ');
}

/**
 * 네이버 쇼핑 자체 검색 페이지 URL — 모든 브랜드의 공식 스토어 우회 경로.
 *
 * 정책 결정 (매핑 사전 폐기):
 *  - brand.naver.com 직행 URL은 브랜드별 슬러그 매핑이 필요한데, 슬러그는 우리가
 *    검증해야 하고 외부에서 만든 카테고리/필터 URL은 네이버가 봇으로 차단.
 *  - 모든 브랜드를 일관되게 네이버 쇼핑 검색 페이지로 보내고, 네이버 자체 UI에서
 *    공식 스토어를 우대 노출하도록 위임.
 *  - 사용자는 2클릭으로 공식 스토어 도달 (우리 → 네이버 검색 → 공식 스토어).
 *
 * 중복 단어 제거(dedupe) 적용 — "Polo Polo 67" → "Polo 67"
 */
export function buildFallbackSearchUrl(query: string): string {
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(enhanceQueryForFragrance(query))}`;
}
