# Scent Scanner — 카메라 향수 인식 & 최저가 검색

> 📦 **ARCHIVED — 구현 전 설계안 (as of 2026-05-21)**
> 실제 구현 상태는 [src/app/api/scan/README.md](../../src/app/api/scan/README.md)를 보세요.
> 주요 결정 변경은 [docs/decisions/](../decisions/)에 기록됨.
> 이 문서는 의사결정의 출발점을 보존하기 위한 archive — **수정하지 않음**.

---

> 카메라로 향수병을 비추면 AI가 어떤 향수인지 식별하고, 같은 제품의 최저가 구매 사이트로 바로 이동할 수 있는 기능. PC(웹캠) · 태블릿(후면 카메라) · 모바일(후면 카메라) 전 디바이스 지원.

---

## 1. 핵심 가치 제안

| 기존 갤러리 | Scent Scanner |
|---|---|
| 향수 이름·브랜드를 알아야 검색 | **모르는 향수도** 사진 한 장으로 식별 |
| 등록·열람 중심 | **구매 의사결정**까지 한 번에 |
| 사용자 ↔ 사용자 (커뮤니티) | 사용자 ↔ 시장 (쇼핑) |

**한 줄 요약**: "이거 무슨 향수지?" → "여기서 가장 싸게 살 수 있어요."

---

## 2. 사용자 흐름

```
/scan 진입
  ↓
디바이스 자동 감지 → 카메라 권한 요청
  ├── PC      → 웹캠 (전면)
  ├── 태블릿  → 후면 카메라 우선
  └── 모바일  → 후면 카메라 우선
  ↓
실시간 프리뷰 + 셔터 버튼 (또는 파일 업로드 fallback)
  ↓
사진 캡처 → 사용자 확인 (다시 찍기 / 분석하기)
  ↓
이미지 → Cloudinary 업로드 → GPT-4o Vision 분석
  ↓
결과 페이지:
  ┌─────────────────────────────────────────┐
  │ DIPTYQUE Philosykos                      │
  │ 무화과·코코넛·시더우드                    │
  │ [DB 매칭: 우리 갤러리에 있음 → 상세]      │
  │ [최저가 ₩148,000 (네이버 쇼핑) →]         │
  │ [쿠팡 ₩152,000 →]   [11번가 ₩150,000 →]  │
  └─────────────────────────────────────────┘
```

---

## 3. 핵심 설계 결정 5축

| 축 | 결정 | 근거 |
|---|---|---|
| **카메라 API** | `navigator.mediaDevices.getUserMedia` + `<input type="file" capture="environment">` fallback | 표준 Web API, 모든 모던 브라우저 지원. iOS Safari는 `getUserMedia` 일부 제한 → file input fallback |
| **이미지 분석** | **기존 `analyzeFragranceImage.ts` 확장** (별도 구현 X) | 이미 GPT-4o Vision 인프라 작동 중. JSON mode로 brand·name 추출 |
| **DB 매칭** | brand+name → 자체 갤러리(`Fragrance` 테이블) slug 조회 | Fragrance DB에 있으면 상세 페이지 링크 우선 표시. 없으면 외부 검색만 |
| **가격 비교 소스** | **네이버 쇼핑 검색 API** (메인) + 외부 검색 URL fallback | 한국 향수 시장 90% 커버. 무료 25,000건/일. 직접 가격 노출하지 않고 검색 URL만 제공해 저작권 안전 |
| **결과 캐싱** | 같은 brand+name 결과 24h 캐싱 (`ScanResult` 테이블) | Vision API 호출 비용 절감. 인기 향수는 한 번만 분석 |

---

## 4. 기술 스택 (재사용 + 신규)

### 4-1. 재사용 (현재 코드 그대로)

| 분류 | 기술 | 현재 사용처 |
|---|---|---|
| 프레임워크 | Next.js 15 App Router · React 19 · TypeScript | 전체 |
| UI | Tailwind CSS · HeroUI · Framer Motion | 모든 페이지 |
| 데이터 페칭 | TanStack Query | 갤러리·채팅 |
| AI 분석 | OpenAI GPT-4o Vision | `analyzeFragranceImage.ts` |
| 이미지 호스팅 | Cloudinary | `api/cloudinary/route.ts` |
| ORM | Prisma + PostgreSQL | 전체 |
| 인증 | NextAuth (선택적, 비로그인도 사용 가능) | 전체 |
| 토스트 | react-hot-toast | 전체 |

### 4-2. 신규 추가

| 분류 | 기술 | 용도 |
|---|---|---|
| 카메라 API | `navigator.mediaDevices.getUserMedia` (브라우저 native) | 실시간 프리뷰 + 캡처 |
| 가격 비교 | **네이버 쇼핑 검색 API** (`openapi.naver.com/v1/search/shop.json`) | 한국 향수 최저가 |
| (선택) 쿠팡 파트너스 | Coupang Partners API | 쿠팡 가격 + 제휴 수익화 |
| (선택) 가격 트래킹 | Prisma cron job | 인기 향수 일일 가격 변동 |

---

## 5. 데이터 모델 (Prisma 확장)

```prisma
model ScanResult {
  id              String    @id @default(cuid())
  brand           String                                // AI가 추출한 브랜드
  name            String                                // AI가 추출한 향수명
  notes           String?                               // AI가 추출한 노트
  imageUrl        String                                // Cloudinary URL
  matchedSlug     String?                               // 자체 갤러리 매칭 시
  prices          Json?                                 // [{ source, price, url, foundAt }]
  userEmail       String?
  createdAt       DateTime  @default(now())
  user            User?     @relation(fields: [userEmail], references: [email])

  @@index([brand, name])
  @@index([userEmail])
  @@index([createdAt(sort: Desc)])
}
```

- `prices`: JSON 배열 — 네이버·쿠팡·11번가 등 멀티 소스
- `matchedSlug`: 자체 갤러리 매칭 시 채워짐 → 상세 페이지 링크
- `userEmail`: 비로그인도 가능 (nullable). 로그인 시 "내 스캔 기록" 가능

---

## 6. API 엔드포인트

### POST `/api/scan/analyze`
**요청** (multipart/form-data):
```
file: <image blob>
```

**응답:**
```json
{
  "scanId": "cuid_...",
  "brand": "DIPTYQUE",
  "name": "Philosykos",
  "notes": "TOP: 코코넛, HEART: 무화과, BASE: 시더우드",
  "matchedSlug": "diptyque_philosykos",
  "imageUrl": "https://res.cloudinary.com/.../scan_xyz.png"
}
```

**흐름:**
1. 이미지 multipart 수신
2. Cloudinary 업로드
3. 기존 `analyzeFragranceImage` 호출 (GPT-4o Vision)
4. brand+name으로 `Fragrance` 테이블 fuzzy 매칭 (대소문자·공백 무시)
5. `ScanResult` 저장 → `scanId` 반환
6. 가격 조회는 별도 엔드포인트 (Vision + Shopping API 동시 호출 시 응답 지연 우려)

레이트 리미팅: 분당 10회/IP (Vision API 비용 방어)

### GET `/api/scan/prices/[scanId]`
**응답:**
```json
{
  "prices": [
    { "source": "네이버 쇼핑", "price": 148000, "url": "https://...", "shop": "롯데" },
    { "source": "쿠팡", "price": 152000, "url": "https://..." },
    { "source": "11번가", "price": 150000, "url": "https://..." }
  ],
  "cachedAt": "2026-05-21T12:34:56Z"
}
```

**흐름:**
1. `scanId`로 `ScanResult` 조회
2. 24h 내 `prices` 캐시 있으면 즉시 반환
3. 없으면 네이버 쇼핑 API 호출 (`"DIPTYQUE Philosykos" 검색`)
4. 결과 파싱 후 `ScanResult.prices`에 저장

### GET `/api/scan/history` (로그인 사용자만)
내 스캔 이력 조회 — 최근 20건.

---

## 7. UI 페이지 흐름

```
app/(main)/scan/
  page.tsx                    (server: 메타 + ScanClient 마운트)

app/components/scan/
  ScanClient.tsx              (client: 디바이스 감지 + 화면 분기)
  CameraCapture.tsx           (client: getUserMedia 프리뷰 + 셔터)
  FileUploadFallback.tsx      (client: getUserMedia 미지원 시)
  ScanPreview.tsx             (client: 찍은 사진 확인 + 다시 찍기)
  ScanResult.tsx              (client: 분석 결과 + 가격 카드)
  PriceCard.tsx               (client: 쇼핑몰별 가격 카드)
```

**모바일 우선 디자인 원칙**:
- 카메라 프리뷰는 화면 전체 (16:9 또는 4:3)
- 셔터 버튼은 화면 하단 중앙 고정, 큼직하게 (최소 64×64)
- 후면 카메라 우선 (`{ video: { facingMode: { exact: "environment" } } }`)
- 권한 거부 시 file input fallback 즉시 노출

**다크/라이트 모드 대응**: 카메라 프리뷰 영역은 항상 검정 배경 (UX 표준)

---

## 8. 단계별 로드맵 (1.5주 분량)

| Phase | 작업 | 일수 |
|---|---|---|
| **P1: 카메라 캡처** | getUserMedia + 프리뷰 + 셔터 + file fallback | 2일 |
| **P2: 분석 통합** | 기존 analyzeFragranceImage 확장 + DB 매칭 + ScanResult 저장 | 2일 |
| **P3: 가격 비교** | 네이버 쇼핑 API 연동 + 캐싱 + 결과 카드 UI | 2일 |
| **P4: 모바일 polish** | 후면 카메라·터치 UX·권한 거부 흐름 | 1일 |
| **P5: 검증·문서** | 실기기 테스트·README·면접 발표자료 | 1일 |

원래 4주 로드맵의 **Week 2 후반 + Week 3 전반**에 끼워 넣기 가능. 단 OG 카드·관측성 작업과 시간 경쟁.

---

## 9. 우려·트레이드오프

| 우려 | 대응 |
|---|---|
| **iOS Safari getUserMedia 제한** | file input + `capture="environment"` fallback. iOS 15+은 getUserMedia 정상 작동 |
| **카메라 권한 거부** | 즉시 file 업로드 모드로 전환. 안내 토스트 |
| **Vision API 비용** | 24h 캐싱 + 분당 10회/IP 레이트 리밋. 인기 향수는 한 번만 호출 |
| **AI 오인식** | 사용자에게 "이 향수가 맞나요?" 확인 단계. brand·name 직접 수정 가능 |
| **가격 데이터 신뢰성** | 가격 표시 옆 "쇼핑몰에서 최종 가격 확인" 안내 + 검색 URL로 이동 (직접 가격 노출 최소화) |
| **저작권 우려 (가격·이미지 표시)** | 가격은 표시하되 클릭 시 외부 사이트로 이동 (제휴 또는 단순 링크). 외부 이미지는 표시 X — 우리 cloudinary만 |
| **네이버 API 한도(25K/일)** | 캐싱으로 충분 대응. 초과 시 검색 URL fallback |
| **모바일 카메라 화질** | 해상도 강제 (1280×720+) + 흐림 감지 → "다시 찍어주세요" 토스트 |

---

## 10. 환경 변수 (신규)

```env
# 네이버 쇼핑 API (https://developers.naver.com/apps)
NAVER_SHOPPING_CLIENT_ID=...
NAVER_SHOPPING_CLIENT_SECRET=...

# (선택) 쿠팡 파트너스
COUPANG_PARTNERS_ACCESS_KEY=...
COUPANG_PARTNERS_SECRET_KEY=...
```

---

## 11. 면접 어필 포인트

1. **멀티 디바이스 카메라 API** — PC 웹캠·모바일 후면 카메라·tablet 분기 처리. 표준 Web API 깊이 있게 사용
2. **AI Vision 실용 응용** — README의 "AI 이미지 분석"을 한 단계 확장. 단순 분석 → 매칭 → 가격까지 end-to-end
3. **외부 API 통합 패턴** — 네이버 쇼핑 검색 + 캐싱 + 폴백. API 한도·실패 대응 설계
4. **사용자 가치 명확** — "왜 이 기능?" 답변이 깨끗 (구매 의사결정 도움). 차별화 기능으로 면접 한 줄에 설명 가능
5. **점진적 개선 스토리** — Phase 1~5 단계 명확. "MVP 먼저 카메라+분석, 가격은 그 다음에" 의사결정 가능

---

## 12. 검토 사항

이 1단계 설계에서 함께 결정할 것:

1. **가격 비교 소스 우선순위** — 네이버 메인이면 충분한지, 쿠팡·11번가 추가 필요한지
2. **결과 페이지 정보 밀도** — AI 분석 결과(노트·계열)를 얼마나 자세히 보여줄지
3. **로그인 강제 여부** — 비로그인도 스캔 가능 vs 가입 강제 (스캔 이력 활용)
4. **분석 결과 공유** — 퀴즈 결과처럼 shareCode + 공유 OG 카드 추가할지
5. **자체 갤러리 매칭 정확도** — fuzzy matching 기준 (Levenshtein? 임베딩 유사도?)

OK 주시면 → 2단계(상세 컴포넌트 구조 + API 시그니처 + DB 마이그레이션 SQL) 설계 진행.
