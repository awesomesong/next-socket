# Scent Memories

> **향수를 수집하고 기록하는 공간** — 향수를 사랑하는 사람들을 위한 향수 정보 공유 아카이브입니다. 향수(프래그런스) 정보를 등록·공유하고, 실시간 채팅과 GPT-4 AI 어시스턴트를 활용할 수 있는 풀스택 커뮤니티 플랫폼입니다.

![Next.js](https://img.shields.io/badge/Next.js-15.4.8-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma_5.22-4169E1?logo=postgresql)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101?logo=socket.io)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.59-FF4154)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4_SSE-412991?logo=openai)
![Vercel](https://img.shields.io/badge/Vercel-배포-000000?logo=vercel)
![Fly.io](https://img.shields.io/badge/Fly.io-Docker-7B3FE4)

---

## 프로젝트 개요

**Scent Memories**는 Next.js 15 App Router 기반의 풀스택 웹 애플리케이션입니다. 실무에서 중요하게 다뤄지는 **서버/클라이언트 컴포넌트 경계 설계**, **실시간 통신 아키텍처**, **AI 스트리밍**, **낙관적 업데이트** 등의 패턴을 실제로 구현했습니다.

| 기능 | 설명 |
|------|------|
| **향수 카탈로그** | 브랜드·이름·노트·이미지 기반 CRUD, slug 기반 SEO URL, 커서 기반 Infinite Query, 성공 시 캐시 반영 |
| **리뷰 시스템** | 향수별 리뷰 작성·수정·삭제, 커서 기반 무한 스크롤, React Query 도메인별 캐시 선택적 무효화 |
| **실시간 채팅** | Socket.IO 룸 기반 1:1·그룹 채팅, 오프라인 메시지 큐잉(24h TTL, 재연결 시 일괄 전달), 읽음 상태 실시간 동기화 |
| **AI 어시스턴트** | GPT-4 SSE 스트리밍(토큰 단위 실시간 렌더링), 슬라이딩 윈도우 레이트 리미팅(분당 10회/유저), 최근 8개 메시지 컨텍스트 유지 |
| **공지사항** | CRUD + 댓글 + 조회수, WYSIWYG 에디터(React Quill), Cloudinary 이미지 업로드, DOMPurify XSS 방지 |
| **인증** | NextAuth v4 JWT 전략(24h), Google·Kakao OAuth + 이메일/비밀번호 Credentials, bcryptjs 해싱, 미들웨어 보호 라우팅 |
| **3D 히어로 섹션** | Three.js WebGL 커스텀 셰이더 기반 은하수 배경, 다크/라이트 테마 대응 |
| **테마·반응형** | 라벤더·아이보리 커스텀 테마, Tailwind 반응형 브레이크포인트, Framer Motion 페이지 전환 애니메이션 |

---

## 기술 집약 요약

| 영역 | 기술·패턴 |
|------|-----------|
| **풀스택** | Next.js 15 App Router, Route Groups, Server/Client Component 경계 설계 |
| **타입 안정성** | TypeScript strict mode, Prisma 생성 타입 전파 |
| **서버 상태** | TanStack Query 5 (커서 Infinite Query, Optimistic Update, 도메인별 캐시 분리) |
| **클라이언트 상태** | Zustand (UI 전역 상태) + React Context (auth·socket·theme) |
| **실시간** | Socket.IO 4 (분리 서버, O(1) 유저 조회, 오프라인 메시지 큐, WebSocket-only) |
| **AI 스트리밍** | OpenAI GPT-4 SSE, 슬라이딩 윈도우 레이트 리미팅, 컨텍스트 관리 |
| **인증** | NextAuth v4 JWT (OAuth + Credentials), Prisma 어댑터 |
| **DB 설계** | PostgreSQL + Prisma, 복합 인덱스 전략, 커서 페이지네이션 |
| **보안** | bcryptjs, DOMPurify, 웹훅 Secret, CORS 화이트리스트 |
| **미디어** | Cloudinary CDN, Next/Image 최적화 |
| **3D** | Three.js WebGL 커스텀 셰이더 (히어로 섹션) |
| **배포** | Vercel (Next.js) + Fly.io Docker (Socket.IO) 분리 배포 |

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                  │
│  React 19 · TanStack Query · Zustand · Socket.IO    │
└──────────────┬──────────────────────┬───────────────┘
               │ HTTP/SSE             │ WebSocket
┌──────────────▼──────────────┐  ┌───▼────────────────────┐
│   next-server (Vercel)      │  │  socket-server (Fly.io)│
│   Next.js 15 App Router     │  │  Express + Socket.IO   │
│   API Routes · NextAuth     │  │  메시지 큐 · 온라인 상태    │
│   Prisma ORM · OpenAI API   │  │  룸 관리 · 웹훅 수신       │
└──────────────┬──────────────┘  └────────────────────────┘
               │
┌──────────────▼──────────────┐  ┌───────────────────────┐
│   PostgreSQL (Prisma)       │  │  Cloudinary CDN       │
│   복합 인덱스 · 트랜잭션         │  │  이미지 업로드·리사이즈     │
└─────────────────────────────┘  └───────────────────────┘
```

**핵심 설계 결정:**
- Next.js API Routes와 Socket.IO 서버를 **별도 프로세스로 분리** → 각각 독립 배포·스케일링
- **WebSocket-only 전송** (polling fallback 제거) → 레이턴시 최소화, 불필요한 HTTP 오버헤드 제거
- 서비스 간 통신에 **웹훅 + Secret 검증** 적용 (신규 유저 생성 시 Socket 서버로 브로드캐스트)

---

## 기술 선택 이유

기술을 나열하는 것보다 **왜 이 조합인지**가 더 중요합니다.

| 기술 | 선택 이유 | 대안 대비 |
|------|----------|----------|
| **Next.js 15 App Router** | 서버/클라이언트 컴포넌트 경계 설계로 초기 렌더링 최적화, 파일 기반 라우팅으로 구조 명확화 | Pages Router 대비 레이아웃 중첩·서버 컴포넌트 지원 우세 |
| **TanStack Query v5** | 서버 상태와 클라이언트 상태를 명확히 분리, Infinite Query·Optimistic Update 내장으로 UX 향상 | SWR 대비 Mutation 핸들링·캐시 제어 세분화 가능 |
| **Zustand** | Context API 리렌더 문제 없이 경량 전역 상태 관리, 보일러플레이트 최소 | Redux 대비 설정 간소, Recoil 대비 번들 크기 작음 |
| **Socket.IO + 별도 서버** | Vercel Serverless는 WebSocket 지속 연결 불가 → Express 서버를 Fly.io에 분리 배포, 독립 스케일링 가능 | 외부 매니지드 서비스 대비 오프라인 큐·이벤트 커스텀 자유도 높음 |
| **Prisma + PostgreSQL** | 타입 안전 쿼리로 런타임 에러 사전 차단, 자동 생성 타입을 프론트까지 전파 | TypeORM 대비 마이그레이션 워크플로우 명확, 쿼리 가독성 높음 |
| **NextAuth v4** | OAuth + Credentials 복합 전략, Prisma 어댑터로 DB 세션 통합 관리 | Clerk 대비 커스터마이징 자유도, Auth.js 대비 Next.js 호환 안정성 |
| **SSE (Server-Sent Events)** | GPT-4 스트리밍 응답을 토큰 단위로 실시간 전달 → 첫 응답 체감 속도 개선 | WebSocket 대비 단방향 스트림에 적합, 구현 단순 |

---

## 해결한 기술적 과제

단순 기능 구현을 넘어 실무에서 마주치는 문제들을 직접 해결했습니다.

| 과제 | 문제 | 해결 |
|------|------|------|
| **Vercel + WebSocket** | Serverless 환경에서 WebSocket 지속 연결 불가 | Socket.IO 서버를 Fly.io Docker로 분리, webhook으로 서비스 간 동기화 |
| **오프라인 메시지 유실** | 수신자가 오프라인일 때 Socket 이벤트 소실 | 서버 메모리 큐(Map) + 24h TTL, 재연결 시 일괄 전달 |
| **AI 스트림 중단** | 모바일 Safari에서 SSE 스트림 버퍼링으로 실시간성 저하 | `X-Accel-Buffering: no` 헤더, `flush()` 강제 적용 |
| **캐시 일관성** | 향수 생성 직후 목록에 즉시 반영 안 되는 UX | Optimistic Update로 API 응답 전 캐시 선반영, 실패 시 rollback |
| **채팅 중복 렌더** | 낙관적 업데이트 후 서버 응답 메시지와 중복 표시 | chatCache에서 tempId ↔ serverId diff 비교·정규화 |
| **무한 스크롤 일관성** | offset 방식에서 새 항목 추가 시 페이지 경계 중복·누락 | 커서(createdAt + id) 기반 페이지네이션으로 교체 |
| **타입 안전성** | API 응답 타입 불일치로 런타임 에러 발생 | Prisma 생성 타입을 API 레이어부터 컴포넌트까지 전파 |

---

## 주요 구현 포인트

### 1. Server/Client Components 경계 설계

```
layout.tsx (Server Component)
├── NextAuthProvider     ← 'use client' (세션 컨텍스트)
├── RQProvider           ← 'use client' (React Query)
├── SocketProvider       ← 'use client' (WebSocket 연결)
├── ThemeProvider        ← 'use client' (다크모드)
└── page.tsx             ← Server Component (초기 데이터 fetch)
    └── ClientComponent  ← 'use client' (인터랙션 필요 시점)
```

서버 컴포넌트에서 초기 데이터를 fetch해 번들 크기를 줄이고, 인터랙션이 필요한 최소 범위만 `'use client'`로 분리합니다.

### 2. TanStack Query 캐시 전략

**커서 기반 Infinite Query** — offset 방식 대비 삭제·삽입 시 중복·누락 없음

```typescript
// 향수 목록: 신규 항목을 캐시 첫 페이지에 낙관적으로 prepend (fragranceCache.ts)
export const prependFragranceCard = (queryClient, newFragrance) => {
  queryClient.setQueryData(fragranceListKey, (old) => {
    if (!old?.pages?.length)
      return { pages: [[newFragrance]], pageParams: [''] };
    const [first, ...rest] = old.pages;
    return {
      ...old,
      pages: [[newFragrance, ...(first ?? [])], ...rest],
    };
  });
};

// 채팅: 메시지 diff 비교·정규화·낙관 업데이트 통합 (chatCache.ts)
```

**도메인별 캐시 분리**: `fragranceCache`, `reviewsCache`, `chatCache`, `noticeCache` — 관심사 분리 + 선택적 무효화

### 3. Socket.IO 실시간 아키텍처

**O(1) 유저 조회** — `Map<userId, Set<socketId>>` 구조로 빠른 온라인 상태 확인

```javascript
// 메시지 큐잉: 오프라인 유저 메시지 24시간 보관, 최대 50개 (messageQueue)
// 재연결 시 getQueuedMessages로 자동 전달 → 메시지 유실 방지
const messageQueue = new Map(); // userId → [{ message, timestamp, conversationId }]

// WebSocket-only 전송 (polling 제거)
const io = new Server(httpServer, {
  transports: ['websocket'],
  pingInterval: 25000,
  pingTimeout: 30000,
});
```

**실시간 이벤트 목록**: `online:user`, `leave:user`, `get:onlineUsers`, `send:message`, `receive:message`, `receive:conversation`, `read:state`, `conversation:new`, `join:room`/`leave:room`, `fragrance:review:new|updated|deleted`, `notice:new|updated|deleted`

### 4. GPT-4 SSE 스트리밍

```typescript
// /api/ai/stream/route.ts
// - 슬라이딩 윈도우 레이트 리미팅: 분당 10회/유저
// - 대화 컨텍스트: 최근 8개 메시지 포함 (buildConversationContext)
// - 30초 타임아웃 보호 (AbortController)
// - 모바일 Safari 스트림 버퍼 핸들링 (X-Accel-Buffering: no)
// - 스트리밍 완료 후 DB 저장 (메시지 유실 방지)

// OpenAI SDK 대신 fetch 직접 호출
const requestBody = {
  model: "gpt-4",
  messages: contextMessages, // system + 이전 대화 + 현재 메시지 포함
  stream: true,
  temperature: 0.7,
  max_tokens: 1000,
};
const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify(requestBody),
  signal: controller.signal, // 30초 타임아웃
});
```

### 5. 인증 구조 (NextAuth v4)

```
인증 방식: JWT 전략 (24시간 세션)
Providers:
  ├── Google OAuth  (소셜 로그인)
  ├── Kakao OAuth   (소셜 로그인)
  └── Credentials   (이메일/비밀번호, bcryptjs 해싱)

Adapter: Prisma → User, Account, Session, VerificationToken 자동 관리
Middleware: JWT 검증 → 미인증 시 /auth/signin + callbackUrl 리다이렉트
```

### 6. DB 인덱스 전략 (Prisma)

```prisma
model Message {
  @@index([conversationId, createdAt(sort: Desc)])       // 채팅 목록 조회
  @@index([conversationId, senderId, createdAt])         // 발신자별 필터링
  @@index([conversationId, isAIResponse, createdAt])     // AI 메시지 조회
}

model ConversationRead {
  @@unique([conversationId, userId])  // 읽음 상태 유니크 보장
}

model Fragrance {
  slug String @unique  // slug 기반 SEO URL
}
```

---

## 기술 흐름 — 요청이 처리되는 방식

```
[향수 목록 조회]
브라우저 → TanStack Query (캐시 확인)
  ├── 캐시 HIT  → 즉시 렌더링 (네트워크 요청 없음)
  └── 캐시 MISS → Next.js API Route → Prisma → PostgreSQL
                  → 결과 캐시 저장 → 렌더링

[향수 등록 (낙관적 업데이트)]
사용자 제출 → fragranceCache.prependFragranceCard() 즉시 UI 반영
           → POST /api/fragrance → Prisma INSERT
           → 성공: 캐시 유지 / 실패: rollback

[실시간 채팅 메시지]
클라이언트 send:message → socket-server
  → 온라인 수신자: socket.to(room).emit('receive:message') 즉시 전달
  → 오프라인 수신자: 큐 적재 → 재연결 시 일괄 전달
  → next-server: POST /api/messages → Prisma 저장 (트랜잭션)

[GPT-4 AI 응답]
POST /api/ai/stream
  → 슬라이딩 윈도우 레이트 리미팅 체크 (분당 10회/유저)
  → aiPolicy 콘텐츠 정책 검사
  → OpenAI GPT-4 stream: true
  → SSE(text/event-stream)로 토큰 단위 전송 → 클라이언트 실시간 렌더링
  → 스트리밍 완료 시 Prisma로 전체 메시지 DB 저장

[인증 흐름]
미인증 요청 → middleware.ts JWT 검증 실패
  → /auth/signin?callbackUrl=원래경로 리다이렉트
  → OAuth(Google·Kakao) or Credentials 로그인
  → NextAuth JWT 생성 (24h) → 원래 경로로 복귀
```

---

## 기술 스택

### 프론트엔드

| 분류 | 기술 | 버전 | 실무 적용 포인트 |
|------|------|------|----------------|
| **프레임워크** | Next.js | 15.4.8 | App Router, Route Groups `(main)/(chat)`, 동적 메타데이터 |
| | React | 19.1.2 | Server/Client Components 경계 설계, `use client` 최소화 전략 |
| | TypeScript | 5.x | strict mode, Prisma 생성 타입 활용, 제네릭 기반 캐시 유틸 |
| **서버 상태** | TanStack Query | 5.59.19 | 커서 기반 Infinite Query, Optimistic Update, 도메인별 캐시 |
| **클라이언트 상태** | Zustand | 4.5.6 | UI 전역 상태·사용자 정보, Context와 역할 분리 |
| **스타일/UI** | Tailwind CSS | 3.4.17 | 커스텀 테마(lavender·ivory), 반응형 브레이크포인트 |
| | HeroUI | 2.7.5 | 공통 컴포넌트(버튼·모달·폼) |
| | Framer Motion | 12.5.0 | 페이지 전환·요소 인터랙션 애니메이션 |
| **폼** | react-hook-form | 7.51.4 | 비제어 컴포넌트, 리렌더 최소화, 유효성 검사 |
| **실시간** | Socket.IO Client | 4.8.1 | 싱글턴 패턴, 지수 백오프 재연결, 이벤트 타입 안전성 |
| **인증** | NextAuth | 4.24.7 | JWT(OAuth + Credentials) |
| **보안** | bcryptjs | 3.x | 비밀번호 해싱 |
| | DOMPurify | 3.2.4 | 사용자 입력 HTML 새니타이징, XSS 방지 |
| **미디어** | next-cloudinary | 6.6.2 | 이미지 업로드·CDN·WebP 자동 변환 |
| **에디터** | react-quill-new | 3.4.6 | WYSIWYG 에디터(공지·게시글) |
| **3D** | Three.js | 0.183.0 | 히어로 섹션 은하수 배경(WebGL·커스텀 셰이더, 다크/라이트 테마 대응) |
| **기타** | dayjs | 1.x | 날짜 포맷 |
| | react-intersection-observer | 9.x | 뷰포트 감지, Infinite Query 트리거 |
| | react-hot-toast | 2.x | 토스트 알림 |

### 백엔드

| 분류 | 기술 | 실무 적용 포인트 |
|------|------|----------------|
| **런타임** | Node.js 18+ | Next.js API Routes |
| **DB** | PostgreSQL | Prisma 복합 인덱스, cascade delete, 유니크 제약 |
| **ORM** | Prisma 5.22.0 | 타입 안전 쿼리, 마이그레이션 관리, 생성 타입 재사용 |
| **실시간** | Socket.IO 4.8.1 | Express 서버 분리, 룸 기반 브로드캐스트, 오프라인 큐 |
| **AI** | OpenAI GPT-4 | SSE 스트리밍, 대화 컨텍스트(최근 8개 메시지) 유지 |

### 인프라·배포

| 서비스 | 용도 | 비고 |
|--------|------|------|
| **Vercel** | next-server 배포 | GitHub 자동 배포, 환경 변수 관리 |
| **Fly.io** | socket-server 배포 | Docker 컨테이너, fly.toml 설정 |
| **Cloudinary** | 이미지 호스팅·변환 | CDN, 리사이즈, WebP 최적화 |

---

## 데이터베이스 모델

| 모델 | 설명 |
|------|------|
| `User` | 이메일·닉네임·프로필 이미지·역할·소셜 연동 |
| `Account / Session` | NextAuth OAuth 계정·JWT 세션 |
| `Fragrance` | 브랜드·이름·slug(unique)·이미지배열·노트 |
| `FragranceReview` | 향수별 리뷰, fragranceSlug 인덱스 |
| `Conversation` | 1:1·그룹 채팅 룸, `isAIChat` 플래그, `lastMessageAt` |
| `Message` | 텍스트·이미지, `isAIResponse`, 복합 인덱스 |
| `ConversationRead` | 읽음 상태 (conversationId, userId) unique |
| `Notice / Comment` | 공지·댓글·조회수 |

---

## 프로젝트 구조

```
Scent-Memories/
├── next-server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/app/
│       ├── (main)/                  # 메인 레이아웃 Route Group
│       │   ├── (home)/              # 홈 (Three.js 히어로 + 향수 목록)
│       │   ├── fragrance/           # [id], create, edit
│       │   ├── notice/              # 목록·상세·작성·수정
│       │   └── profile/
│       ├── (chat)/                  # 채팅 전용 레이아웃
│       │   └── conversations/
│       ├── api/
│       │   ├── ai/stream/           # GPT-4 SSE 스트리밍
│       │   ├── fragrance/           # 향수·리뷰·브랜드·이미지 분석
│       │   ├── auth/[...nextauth]/  # NextAuth 핸들러
│       │   ├── messages/            # 채팅 메시지 (트랜잭션)
│       │   └── conversations/       # 채팅 룸 관리
│       ├── components/
│       │   ├── main/                # ProductFragrance, ScentMemoriesHero
│       │   ├── fragrance/           # FragranceDetail, FormFragrance 등
│       │   └── chat/
│       ├── lib/
│       │   ├── auth.ts              # NextAuth 설정
│       │   ├── session.ts           # getCurrentUser 등 세션 유틸
│       │   ├── socket.ts            # Socket.IO 싱글턴
│       │   └── react-query/         # fragranceCache, chatCache, reviewsCache, noticeCache
│       ├── hooks/                   # useAIStream, useChatScroller, useMediaQuery 등
│       ├── types/                   # fragrance, conversation, socket, reviews 타입
│       └── utils/                   # aiPolicy, formatDate, scrollMath 등
│
└── socket-server/
    ├── server.js                    # Express + Socket.IO (오프라인 큐, 온라인 관리)
    ├── Dockerfile
    └── fly.toml
```

---

## 보안·성능

| 영역 | 적용 내용 |
|------|----------|
| **인증** | JWT 세션(24h), NextAuth 미들웨어, 소켓 핸드셰이크 인증 |
| **입력 검증** | 서버 라우트 단 검증, DOMPurify XSS 새니타이징 |
| **레이트 리미팅** | AI 스트리밍: 유저당 슬라이딩 윈도우 (분당 10req/user) |
| **서비스 간 통신** | 웹훅 Secret 검증 (socket-server ↔ next-server) |
| **이미지** | Next/Image + Cloudinary CDN, WebP 자동 변환 |
| **번들** | `next/dynamic` 동적 import, 라우트 단위 코드 스플리팅 |
| **쿼리 최적화** | 복합 인덱스, 커서 기반 페이지네이션, 필요 필드만 select |

---

## 로컬 실행

```bash
# next-server
cd next-server
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# socket-server (선택)
cd socket-server
cp .env.example .env   # NEXT_SERVER_URL, CORS 설정
npm install
npm start
```

**필요 환경 변수**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `KAKAO_CLIENT_ID/SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_SOCKET_URL`, `WEBHOOK_SECRET`
socket-server: `CLIENT_ORIGIN`(CORS 허용 도메인, 쉼표 구분), `WEBHOOK_SECRET`
