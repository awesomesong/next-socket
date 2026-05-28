import prisma from "@/prisma/db";

export interface MatchedFragrance {
  slug: string;
  brand: string;
  name: string;
  images: string[];
  description: string;
  notes: string | null;
  confidence: number; // 0-100
}

/**
 * 한/영 brand alias 사전 — 점진적 확장.
 * AI가 "Christian Dior", "디올" 등으로 추출해도 같은 canonical id로 정규화.
 */
const BRAND_ALIASES: Record<string, string[]> = {
  dior: ["dior", "디올", "christian dior", "크리스챤디올", "크리스천디올"],
  chanel: ["chanel", "샤넬"],
  jomalone: ["jomalone", "jomalonelondon", "jo malone", "조말론", "조 말론"],
  byredo: ["byredo", "바이레도"],
  diptyque: ["diptyque", "딥디크"],
  tomford: ["tomford", "tom ford", "톰포드"],
  prada: ["prada", "프라다"],
  tamburins: ["tamburins", "탬버린즈", "tamburin"],
  hermes: ["hermes", "hermès", "에르메스"],
  sergelutens: ["sergelutens", "serge lutens", "세르주뤼땅"],
  fredericmalle: ["fredericmalle", "frederic malle", "프레데릭말"],
  acquadiparma: ["acquadiparma", "acqua di parma", "아쿠아디파르마"],
  ateliercologne: ["ateliercologne", "atelier cologne", "아틀리에코롱"],
  lelabo: ["lelabo", "le labo", "르라보"],
  bykilian: ["bykilian", "by kilian", "바이킬리언", "킬리언"],
  lanvin: ["lanvin", "랑방"],
  heeley: ["heeley", "힐리"],
  commedesgarcons: ["commedesgarcons", "comme des garçons", "comme des garcons", "꼼데가르송"],
  escentricmolecules: ["escentricmolecules", "escentric molecules"],
  artisanparfumeur: ["lartisanparfumeur", "l'artisan parfumeur", "랄띠장빠르푸뫼흐"],
  maisonfranciskurkdjian: ["maisonfranciskurkdjian", "maison francis kurkdjian", "메종프란시스커정"],
};

// 매칭 임계값 — brand만 일치하고 name이 거의 다른데 추천되는 문제를 막기 위해 상향.
//  - MIN_CONFIDENCE: 총점(brand 50 + name 50). 70 미만이면 "잘못된 추천" 위험.
//  - MIN_NAME_SCORE_RAW: name token 매칭 원점수(0-100). 50 미만이면 다른 라인업으로 간주.
//    예) Dior Sauvage 스캔 → DB의 Dior J'adore와 brand=50 매칭되더라도
//        name token 0% → 게이트에서 reject되어 null 반환.
const MIN_CONFIDENCE = 70;
const MIN_NAME_SCORE_RAW = 50;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[°&\-_'·,.\s]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

function canonicalBrand(input: string): string {
  const n = normalize(input);
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    const hit = aliases.some((a) => {
      const na = normalize(a);
      return na === n || n.includes(na) || na.includes(n);
    });
    if (hit) return canonical;
  }
  return n;
}

/**
 * 영문/한글 토큰화. 너무 짧은 토큰(≤1)은 노이즈로 제외.
 */
function tokenize(s: string): string[] {
  return normalize(s)
    .replace(/([a-z0-9]+)/g, " $1 ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/**
 * 양방향 token 매칭 점수 (0-100).
 * matches / max(aTokens, bTokens) — 짧은 쪽이 다 매칭돼도 긴 쪽 손실 반영.
 */
function nameMatchScore(a: string, b: string): number {
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  if (aTokens.length === 0 || bTokens.length === 0) return 0;

  let matches = 0;
  for (const at of aTokens) {
    if (bTokens.some((bt) => bt === at || bt.includes(at) || at.includes(bt))) {
      matches++;
    }
  }
  return (matches / Math.max(aTokens.length, bTokens.length)) * 100;
}

/**
 * brand+name으로 자체 갤러리 fuzzy 매칭. 점수 ≥ 50만 반환.
 * - brand canonical 일치 또는 부분 포함
 * - name token 매칭
 * - 41건 풀스캔 (1000건+ 시 SQL 인덱스 활용으로 변경 필요)
 */
export async function findFragranceMatch(
  aiBrand: string,
  aiName: string,
): Promise<MatchedFragrance | null> {
  if (!aiBrand || !aiName) return null;

  const aiCanonical = canonicalBrand(aiBrand);

  const fragrances = await prisma.fragrance.findMany({
    select: {
      slug: true,
      brand: true,
      name: true,
      images: true,
      description: true,
      notes: true,
    },
  });

  let best: MatchedFragrance | null = null;
  let bestScore = 0;
  let bestNameRaw = 0;

  for (const f of fragrances) {
    const dbCanonical = canonicalBrand(f.brand);

    // Brand 점수 (50점 만점)
    let brandScore: number;
    if (dbCanonical === aiCanonical) {
      brandScore = 50;
    } else if (
      normalize(f.brand).includes(normalize(aiBrand)) ||
      normalize(aiBrand).includes(normalize(f.brand))
    ) {
      brandScore = 30;
    } else {
      continue; // brand 매칭 0 → 건너뛰기
    }

    // Name 점수 — 원점수(0-100)와 가중(50점) 분리 보관
    const nameScoreRaw = nameMatchScore(aiName, f.name);
    const nameScore = nameScoreRaw * 0.5;

    const total = brandScore + nameScore;
    if (total > bestScore) {
      bestScore = total;
      bestNameRaw = nameScoreRaw;
      best = {
        slug: f.slug,
        brand: f.brand,
        name: f.name,
        images: f.images,
        description: f.description,
        notes: f.notes,
        confidence: Math.round(total),
      };
    }
  }

  // 게이트 1: name 자체가 약하면 reject — brand만 같은 다른 라인업 추천 차단
  if (bestNameRaw < MIN_NAME_SCORE_RAW) {
    if (best) {
      console.log(
        `[findMatch] reject "${aiBrand} ${aiName}" → "${best.brand} ${best.name}" (nameRaw=${bestNameRaw.toFixed(0)} < ${MIN_NAME_SCORE_RAW})`,
      );
    }
    return null;
  }
  // 게이트 2: 총점 게이트
  if (bestScore < MIN_CONFIDENCE) return null;
  return best;
}
