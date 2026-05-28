# `/scan` — 카메라 향수 식별 & 가격 검색

> 사진 → AI OCR로 brand·name 추출 → 자체 갤러리 매칭 + 네이버 쇼핑 검색 → 결과 카드.
> **프로젝트 전반 규칙**: [next-server/CLAUDE.md](../../../../CLAUDE.md) (UI 토큰·버튼·아이콘 규칙 등 먼저 읽기)
> **이 문서**: 코드와 함께 갱신되는 살아있는 구현 문서. 의사결정 배경은 [docs/decisions/](../../../../docs/decisions/).

---

## 파일 맵

| 영역 | 경로 |
|---|---|
| 진입 페이지 | [src/app/(main)/scan/page.tsx](../../(main)/scan/page.tsx) |
| 클라이언트 stage 머신 | [src/app/components/scan/ScanClient.tsx](../../components/scan/ScanClient.tsx) (idle → previewing → analyzing → result) |
| 카메라 / 파일 fallback | `components/scan/CameraCapture.tsx`, `FileUploadFallback.tsx` |
| 결과 UI | `components/scan/ScanResult.tsx`, `PriceCards.tsx` |
| API: 분석 | [api/scan/analyze/route.ts](analyze/route.ts) — `POST /api/scan/analyze` |
| API: 가격 | [api/scan/prices/[scanId]/route.ts](prices/[scanId]/route.ts) — `GET /api/scan/prices/:scanId` |
| 비즈니스 로직 | [src/app/lib/scan/](../../lib/scan/) — `visionAnalyze`, `enrichInfo`, `findMatch`, `naverShopping`, `transliterate`, `rateLimit` |
| 데이터 모델 | `ScanResult` ([prisma/schema.prisma](../../../../prisma/schema.prisma)) |

---

## 흐름 1 — `POST /api/scan/analyze`

1. 레이트 리밋 (분당 5회/IP, in-memory) — `rateLimit.ts`
2. multipart 수신 → Cloudinary 업로드 (unsigned preset)
3. **Vision OCR** (`visionAnalyze.ts`): `brand/name/concentration/size` 분리 추출
   - 1차 `detail="low"` → 결손 시 2차 `detail="high"` 재시도 (비용 최적화, [ADR-0002](../../../../docs/decisions/0002-vision-two-pass-ocr.md))
   - `gpt-4o` 거부 시 `gpt-4o-mini` fallback
   - 부향률을 name으로 잡으면 안전망 차단
4. **자체 갤러리 매칭** (`findMatch.ts`): brand alias(한/영) + token 양방향 매칭
   - 게이트: `nameRaw ≥ 50`, `total ≥ 70`
5. **24h 캐시 조회**: 같은 `brand+name`의 이전 `ScanResult` 있으면 `description/notes/prices` 재사용
6. description/notes 우선순위: **curated DB > 캐시 > `enrichInfo`** (gpt-4o-mini, 텍스트 LLM)
7. `ScanResult` 저장 → `scanId` 반환 (가격은 별도 엔드포인트로 분리해 응답 지연 회피)

## 흐름 2 — `GET /api/scan/prices/:scanId`

가장 복잡한 모듈. 가격 절대값 대신 **다층 신호**로 정품/노이즈 분리:

1. 24h `ScanResult.prices` 캐시 hit → 즉시 반환
2. 한글 음역 (`transliterate.ts`, gpt-4o-mini) — 한글 mall title 매칭용
3. 영문 쿼리 → 0건이면 한글 쿼리 → 병합
4. **필터 게이트** (`naverShopping.ts` `runSingleSearch`):
   - 샘플·디캔트·짝퉁 키워드 차단
   - 1~15ml 소분 차단 (per-ml < ₩500도 차단 — 절대 가격 게이트 X)
   - 옷·잡화 title 차단
   - 향수 카테고리 매칭
   - title이 검색어 핵심 토큰 포함
5. **신뢰 점수 0~100**: 화이트리스트 mall +30 / 향수 카테고리 +20 / productType=2 +20 / per-ml 단가 +10~20
6. URL 검증 (HEAD, 3s timeout, batch 5) → 죽은 mall 제거 후 후보 보충
7. 정렬: 신뢰점수 ↓ → 가격 ↑
8. fallback: `search.shopping.naver.com` 검색 URL

→ 단일 소스(네이버)로 좁힌 이유: [ADR-0001](../../../../docs/decisions/0001-naver-only-price-source.md)

---

## 데이터 모델

```prisma
model ScanResult {
  id          String   @id @default(cuid())
  brand       String              // Vision OCR 결과
  name        String              // Vision OCR 결과
  notes       String?             // enrichInfo 또는 curated DB
  description String?             // enrichInfo 또는 curated DB
  imageUrl    String              // Cloudinary URL
  matchedSlug String?             // 자체 갤러리 매칭 시
  prices      Json?               // { items, fetchedAt, koreanName } — 24h 캐시
  userEmail   String?             // 비로그인 가능 (nullable)
  tokensUsed  Int?
  createdAt   DateTime @default(now())

  @@index([brand, name])          // 캐시 조회용
  @@index([userEmail])
  @@index([createdAt(sort: Desc)])
}
```

`prices` JSON 타입은 `api/scan/prices/[scanId]/route.ts`의 `CachedPrices` 인터페이스와 양방향 계약.

---

## 환경 변수

```env
OPENAI_API_KEY                        # Vision + enrichInfo + transliterate
CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET   # unsigned preset
NAVER_SHOPPING_CLIENT_ID
NAVER_SHOPPING_CLIENT_SECRET
SCAN_DEBUG=1                          # (선택) naverShopping 필터링 상세 로그
```

---

## ⚠️ 이 코드 만질 때 주의

- **`naverShopping.ts` 임계값은 실험으로 튜닝된 값** — `MIN_PRICE_PER_ML=500`, 신뢰점수 가중치(+30/+20/+20/+10~20), 게이트 조건 임의 변경 금지. 변경 시 `SCAN_DEBUG=1`로 회귀 검증 필수.
- **`prisma/schema.prisma` 변경분이 아직 마이그레이션 미적용** (uncommitted). 새 컬럼 의존 코드 추가 시 `prisma migrate dev` 먼저.
- **`ScanResult.prices` Json 구조는 prices route의 `CachedPrices`와 계약**. 구조 변경 시 캐시 invalidate 또는 양방향 호환 처리.
- **Vision 2-pass는 비용 최적화 핵심** — `needsHighResRetry()` 조건(name 길이 ≤5 등) 완화 시 평균 비용 급증. 변경 전 [ADR-0002](../../../../docs/decisions/0002-vision-two-pass-ocr.md) 참고.
- **UI 토큰**: 하드코딩 hex / HeroUI 기본 색 / 이모지 금지 — 자세한 건 [CLAUDE.md](../../../../CLAUDE.md) + [docs/design-system.md](../../../../docs/design-system.md).

---

## 미구현 (설계엔 있으나 빠진 것)

- `GET /api/scan/history` (로그인 사용자 스캔 이력)
- 쿠팡·11번가 가격 소스 ([ADR-0001](../../../../docs/decisions/0001-naver-only-price-source.md)에서 의도적 제외)
- 스캔 결과 공유 OG 카드
