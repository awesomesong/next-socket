import prisma from '@/prisma/db';

export interface SimilarFragrance {
  slug: string;
  brand: string;
  name: string;
  images: string[];
  description: string;
  notes: string | null;
  similarity: number; // 0~1
  method: 'score' | 'notes';
}

/**
 * notes 문자열에서 핵심 키워드 추출.
 *
 * 지원 형식:
 *   - 구조화: "Top Notes: bergamot, lime\nMiddle: rose\nBase: sandalwood"
 *   - 한글: "탑 노트: 베르가못\n미들: 로즈\n베이스: 샌달우드"
 *   - 단순 나열: "bergamot, rose, sandalwood, musk"
 *
 * 레이블(Top/Middle/Base 등)은 제거하고 실제 향 이름만 반환.
 * 3자 미만 토큰은 노이즈로 제거 (한글 2자는 유지).
 */
function extractNoteKeywords(notes: string): string[] {
  const cleaned = notes
    .toLowerCase()
    // 구조 레이블 제거
    .replace(
      /\b(top|middle|base|heart|opening|dry\s*down)\s*(notes?)?\s*:?\s*/gi,
      '',
    )
    .replace(
      /(탑|미들|베이스|하트|오프닝|드라이다운)\s*(노트)?\s*:?\s*/g,
      '',
    );

  return cleaned
    .split(/[,\n\r;·•]+/)
    .map((k) => k.replace(/[-_/]/g, ' ').trim())
    .filter((k) => {
      if (!k) return false;
      // 한글 포함이면 2자 이상, 영문만이면 3자 이상
      const hasKorean = /[가-힣]/.test(k);
      return hasKorean ? k.length >= 2 : k.length >= 3;
    });
}

/**
 * Jaccard 유사도: |A ∩ B| / |A ∪ B|
 * 부분 매칭 허용 (substring 포함이면 매칭으로 간주).
 * 예) "bergamot" ∩ "bergamot" → 매칭 ✓
 *     "rosy" ∩ "rose" → 부분 포함 → 매칭 ✓
 */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);

  let intersection = 0;
  for (const ka of setA) {
    for (const kb of setB) {
      if (ka.includes(kb) || kb.includes(ka)) {
        intersection++;
        break;
      }
    }
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * 5차원 유클리디안 유사도 (0~1).
 * [0,1]^5 공간에서 최대 거리는 √5 ≈ 2.236.
 * similarity = 1 - distance / maxDistance
 */
function scoreSimilarity(
  a: [number, number, number, number, number],
  b: [number, number, number, number, number],
): number {
  const maxDist = Math.sqrt(5);
  const dist = Math.sqrt(a.reduce((sum, ai, i) => sum + (ai - b[i]) ** 2, 0));
  return Math.max(0, 1 - dist / maxDist);
}

/**
 * 갤러리에서 비슷한 느낌의 향수 top N 추출.
 *
 * 우선순위:
 *   1) scoreA~E 5차원 거리 (matchedSlug 있고 source + 후보 모두 5점수 보유 시)
 *   2) notes Jaccard (notes 있을 때 항상 시도)
 *   두 방법 모두 가능하면 평균. 한 방법만 가능하면 그것만 사용.
 *
 * matchedSlug가 없는 경우(갤러리 미등록 향수):
 *   - sourceNotes만으로 Jaccard fallback 시도.
 */
export async function findSimilarFragrances(
  matchedSlug: string | null,
  sourceNotes: string | null,
  limit = 10,
): Promise<SimilarFragrance[]> {
  const all = await prisma.fragrance.findMany({
    select: {
      slug: true,
      brand: true,
      name: true,
      images: true,
      description: true,
      notes: true,
      scoreA: true,
      scoreB: true,
      scoreC: true,
      scoreD: true,
      scoreE: true,
    },
  });

  const source = matchedSlug ? all.find((f) => f.slug === matchedSlug) ?? null : null;
  const candidates = all.filter((f) => f.slug !== matchedSlug);

  if (candidates.length === 0) return [];

  // source의 5차원 점수 (모두 있어야 사용)
  const sourceScores: [number, number, number, number, number] | null =
    source?.scoreA != null &&
    source.scoreB != null &&
    source.scoreC != null &&
    source.scoreD != null &&
    source.scoreE != null
      ? [source.scoreA, source.scoreB, source.scoreC, source.scoreD, source.scoreE]
      : null;

  // source의 notes 키워드 (matchedSlug의 notes 우선, 없으면 scanResult notes)
  const notesStr = source?.notes ?? sourceNotes;
  const sourceKeywords = notesStr ? extractNoteKeywords(notesStr) : [];

  const scored = candidates
    .map((f) => {
      const scores: [number, number, number, number, number] | null =
        f.scoreA != null &&
        f.scoreB != null &&
        f.scoreC != null &&
        f.scoreD != null &&
        f.scoreE != null
          ? [f.scoreA, f.scoreB, f.scoreC, f.scoreD, f.scoreE]
          : null;

      const candidateKeywords = f.notes ? extractNoteKeywords(f.notes) : [];

      // 두 방법 각각 계산
      const scoreSim =
        sourceScores && scores ? scoreSimilarity(sourceScores, scores) : null;
      const notesSim =
        sourceKeywords.length > 0 && candidateKeywords.length > 0
          ? jaccardSimilarity(sourceKeywords, candidateKeywords)
          : null;

      let similarity = 0;
      let method: 'score' | 'notes' = 'notes';

      if (scoreSim !== null && notesSim !== null) {
        // 둘 다 있으면 가중 평균 (score 60 : notes 40)
        similarity = scoreSim * 0.6 + notesSim * 0.4;
        method = 'score';
      } else if (scoreSim !== null) {
        similarity = scoreSim;
        method = 'score';
      } else if (notesSim !== null) {
        similarity = notesSim;
        method = 'notes';
      }

      return {
        slug: f.slug,
        brand: f.brand,
        name: f.name,
        images: f.images,
        description: f.description,
        notes: f.notes,
        similarity,
        method,
      };
    })
    .filter((f) => f.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored;
}
