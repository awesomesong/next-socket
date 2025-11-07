## 📋 프로젝트 개요

하이트진로 커뮤니티 플랫폼은 실시간 채팅, AI 어시스턴트, 블로그 게시판, 상품 리뷰 등의 기능을 제공하는 종합적인 소셜 커뮤니티 서비스입니다. Next.js 15 App Router를 기반으로 한 풀스택 애플리케이션으로, 실시간 통신, AI 스트리밍, 반응형 디자인 등 최신 웹 기술을 적용하여 구현했습니다.

---

## 🏗️ 시스템 아키텍처

### 서버 구조
- **Next.js 서버 (next-server)**: 프론트엔드 및 REST/GraphQL API 서버
- **Socket.io 서버 (socket-server)**: 실시간 통신 전용 서버 (별도 배포)
- **데이터베이스**: MongoDB (Prisma ORM 사용)
- **이미지 저장소**: Cloudinary

### 배포 환경
- **프론트엔드/API 서버**: Vercel (자동 배포)
- **실시간 서버**: Fly.io (Docker 컨테이너)

---

## 🛠️ 기술 스택 상세

### 프론트엔드

#### 핵심 프레임워크
- **Next.js 15.4.1** (App Router)
  - 서버 컴포넌트 및 클라이언트 컴포넌트 분리
  - 파일 기반 라우팅 시스템
  - API Routes를 통한 서버리스 함수 구현
  - ISR (Incremental Static Regeneration) 활용
    - 블로그 상세 페이지 메타데이터 생성 시 `fetch`의 `next: { revalidate: 3600 }` 옵션 사용 (1시간 캐시 재검증)
- **React 19.1.0**
  - 함수형 컴포넌트 및 Hooks 패턴
  - Server Components와 Client Components 혼합 사용
    - **Server Components**: 서버에서만 실행되어 HTML로 렌더링되어 전송됨
      - 클라이언트 JavaScript 번들에 포함되지 않아 번들 크기 감소 및 초기 로딩 시간 단축
      - 서버에서 데이터베이스 쿼리, API 호출 등 직접 수행 가능
        - **서버 사이드 함수 직접 호출**: `getCurrentUser()` 등 서버 전용 함수를 컴포넌트에서 직접 호출
        - **API 호출**: `fetch()`를 사용하여 서버 내부 API 또는 외부 API 호출
        - **데이터베이스 직접 접근**: API Route에서 `prisma`를 사용하여 데이터베이스 쿼리 수행
      - 브라우저는 이미 렌더링된 HTML을 받아 표시만 하면 되므로 JavaScript 실행 불필요
      - 예시: 
        - `(main)/blogs/page.tsx`: Server Component에서 `getCurrentUser()` 직접 호출하여 사용자 정보 가져오기
        - `(main)/blogs/[id]/layout.tsx`: Server Component에서 `fetch()`로 블로그 데이터 가져와서 메타데이터 생성
        - `api/blogs/route.ts`: API Route에서 `prisma.blog.findMany()`로 데이터베이스 직접 쿼리
    - **Client Components**: `'use client'` 지시어로 브라우저에서 실행, 인터랙티브 기능 구현
      - React Hooks (useState, useEffect 등), 이벤트 핸들러, 브라우저 API 사용 가능
      - 클라이언트 JavaScript 번들에 포함되어 브라우저에서 실행됨
      - 예시: `AIChatForm.tsx` (채팅 폼 - 상태 관리, 이벤트 핸들러), `(main)/blogs/[id]/page.tsx` (블로그 상세 - React Query 사용)
- **TypeScript 5.x**
  - 타입 안정성 보장
  - 인터페이스 및 제네릭 활용

#### 상태 관리
- **Zustand 4.5.6**
  - 전역 상태 관리 (사용자 정보, UI 상태 등)
  - 경량화된 상태 관리 솔루션
- **React Query (TanStack Query) 5.59.19**
  - 서버 상태 관리 및 캐싱
  - Infinite Query를 활용한 무한 스크롤 구현
  - Optimistic Update를 통한 즉각적인 UI 반응
  - 자동 재시도 및 에러 핸들링

#### 데이터 페칭 및 API 통신
- **Apollo Client 3.10.0** / **Apollo Server 4.10.4**
  - GraphQL 쿼리 및 뮤테이션 처리
  - 캐시 관리 및 자동 업데이트
  - 서버 사이드 GraphQL API 구현
- **Fetch API**
  - REST API 통신
  - Server-Sent Events (SSE) 스트리밍
    - AI 응답을 실시간으로 스트리밍하기 위한 기술
    - 서버에서 클라이언트로 단방향 데이터 전송 (서버 → 클라이언트)
    - `ReadableStream`과 `TextDecoder`를 활용한 청크 단위 데이터 수신
    - `data: ` 형식으로 전송되는 이벤트 스트림 파싱
    - 실시간 AI 응답 생성 시 사용자가 즉시 텍스트를 볼 수 있도록 구현

#### 실시간 통신
- **Socket.io Client 4.8.1**
  - 실시간 메시지 전송 및 수신
  - 사용자 온라인 상태 관리
  - 채팅방 입장/퇴장 처리
  - 이벤트 기반 통신

#### 인증 및 보안
- **NextAuth 4.24.7**
  - 소셜 로그인 (Google, Kakao 등)
  - JWT 기반 세션 관리
  - Prisma 어댑터를 통한 세션 저장
- **bcryptjs 3.0.2**
  - 비밀번호 해싱
- **dompurify 3.2.4** / **sanitize-html 2.15.0**
  - XSS 공격 방지
  - 사용자 입력 데이터 정제

#### UI/UX
- **Tailwind CSS 3.4.17**
  - 유틸리티 우선 CSS 프레임워크
  - 반응형 디자인 구현
  - 커스텀 테마 시스템
- **HeroUI 2.7.5**
  - React 컴포넌트 라이브러리
  - 접근성 고려한 UI 컴포넌트
- **Framer Motion 12.5.0**
  - 부드러운 애니메이션 효과
  - 페이지 전환 애니메이션
- **react-hot-toast 2.4.1**
  - 사용자 알림 토스트 메시지

#### 폼 관리
- **react-hook-form 7.51.4**
  - 폼 상태 관리 및 유효성 검사
  - 성능 최적화 (리렌더링 최소화)
  - 내장 유효성 검사 규칙 활용

#### 에디터 및 미디어
- **react-quill-new 3.4.6**
  - WYSIWYG 에디터
  - 컬러 피커 기능
- **Cloudinary 2.5.1** / **next-cloudinary 6.6.2**
  - 이미지 업로드 및 최적화
  - 자동 리사이징 및 포맷 변환
  - CDN을 통한 빠른 이미지 전송

#### 기타 유틸리티
- **dayjs 1.11.13**: 날짜/시간 처리
- **react-icons 5.0.1**: 아이콘 라이브러리
- **react-intersection-observer 9.13.1**: 무한 스크롤 구현
- **react-textarea-autosize 8.5.3**: 자동 높이 조절 텍스트 영역

### 백엔드

#### 데이터베이스
- **MongoDB**
  - NoSQL 문서 데이터베이스
  - 유연한 스키마 구조
  - 인덱싱을 통한 쿼리 성능 최적화
- **Prisma 5.13.0**
  - 타입 안전한 ORM
  - 자동 마이그레이션
  - 관계형 데이터 모델링
  - 쿼리 빌더

#### GraphQL
- **GraphQL 16.8.1**
  - 타입 시스템 기반 API
  - Query, Mutation, Subscription 지원

#### 실시간 서버
- **Socket.io Server 4.7.2**
  - WebSocket 기반 실시간 통신
  - 룸 기반 메시지 브로드캐스팅
  - 연결 상태 관리
  - 메시지 큐잉 시스템 (오프라인 사용자 대응)

#### 서버 프레임워크
- **Express 4.21.2**
  - Socket.io 서버의 HTTP 서버
  - REST API 엔드포인트
  - 미들웨어 처리

---

## 🎯 주요 기능 및 구현 상세

### 1. 실시간 채팅 시스템

#### 1.1 1:1 및 그룹 채팅
- **구현 방식**:
  - Socket.io를 활용한 실시간 양방향 통신
  - 룸(Room) 기반 메시지 브로드캐스팅
  - 사용자별 개인 룸(`user:${userId}`)을 통한 타겟 메시징
- **기능**:
  - 실시간 메시지 전송 및 수신
  - 메시지 읽음 상태 관리
  - 대화방 목록 실시간 업데이트
  - 사용자 온라인/오프라인 상태 표시

#### 1.2 읽음 상태 관리
- **구현**:
  - `ConversationRead` 모델을 통한 읽음 상태 추적
  - `lastSeenAt` 및 `lastSeenMsgId` 필드로 정확한 읽음 위치 관리
  - Socket.io 이벤트(`read:state`)를 통한 실시간 읽음 상태 업데이트
- **최적화**:
  - 읽은 메시지 기준으로 읽지 않은 메시지 수 계산
  - 인덱싱을 통한 빠른 조회 성능

#### 1.3 메시지 큐잉 시스템
- **구현**:
  - 오프라인 사용자를 위한 메시지 큐 저장소 (Map 기반)
  - 사용자별 최대 50개 메시지 큐잉
  - 온라인 전환 시 큐된 메시지 자동 전달
- **특징**:
  - 메모리 기반 큐 (빠른 접근)
  - 자동 정리 메커니즘 (오래된 메시지 제거)

### 2. AI 스트리밍 채팅

#### 2.1 실시간 스트리밍 응답
- **구현 방식**:
  - Server-Sent Events (SSE)를 통한 스트리밍
  - 클라이언트에서 `ReadableStream`을 활용한 청크 단위 수신
  - `onDelta` 콜백을 통한 실시간 UI 업데이트
- **기술 스택**:
  - Next.js API Routes의 스트리밍 응답
  - `TextDecoder`를 활용한 청크 디코딩
  - 메타데이터 전송을 통한 메시지 저장 상태 동기화

#### 2.2 에러 핸들링 및 재시도
- **구현**:
  - `AbortController`를 활용한 요청 취소
  - 60초 타임아웃 설정
  - 실패한 메시지를 localStorage에 저장
  - 재시도 시 기존 실패 메시지 제거 후 새 요청 생성
- **사용자 경험**:
  - 실시간 에러 메시지 표시
  - 재시도 버튼을 통한 수동 재시도
  - 네트워크 오류 시 자동 재시도 (React Query)

#### 2.3 메시지 정렬 및 동기화
- **구현**:
  - 사용자 메시지와 AI 응답의 `createdAt` 시간 차이 1ms로 고정
  - 서버에서 저장된 메시지의 `createdAt`으로 클라이언트 캐시 업데이트
  - `replaceOptimisticMessage`를 통한 정렬 보장
- **최적화**:
  - Optimistic Update로 즉각적인 UI 반응
  - 서버 응답 후 실제 데이터로 교체

#### 2.4 AI 프롬프트 정책 및 검증
- **구현**:
  - 주제 제한 (하이트진로 관련만 허용)
  - 부적절한 콘텐츠 필터링
  - 레이트 리미팅 (1분당 10회 요청 제한)
  - 슬라이딩 윈도우 알고리즘을 활용한 효율적인 레이트 리미팅

### 3. 블로그 게시판

#### 3.1 무한 스크롤
- **구현**:
  - React Query의 `InfiniteQuery` 활용
  - 커서 기반 페이지네이션
  - `react-intersection-observer`를 활용한 스크롤 감지
- **성능**:
  - 가상 스크롤링 (대량 데이터 처리)
  - 이미지 lazy loading

#### 3.2 댓글 시스템
- **구현**:
  - 실시간 댓글 생성/수정/삭제 (Socket.io)
  - 댓글 수 실시간 업데이트
  - 사용자별 댓글 관리

#### 3.3 WYSIWYG 에디터
- **구현**:
  - React Quill 기반 에디터
  - 이미지 업로드
  - 컬러 피커 기능
  - HTML 정제를 통한 XSS 방지

### 4. 인증 시스템

#### 4.1 소셜 로그인
- **지원 플랫폼**:
  - Google OAuth
  - Kakao OAuth
- **구현**:
  - NextAuth를 활용한 OAuth 플로우
  - 세션 관리 (JWT)
  - Prisma 어댑터를 통한 세션 저장

#### 4.2 이메일/비밀번호 회원가입
- **구현**:
  - bcryptjs를 활용한 비밀번호 해싱
  - 이메일 중복 검사
  - 회원가입 폼 유효성 검사 (Zod)

### 5. 반응형 디자인

#### 5.1 모바일 최적화
- **구현**:
  - Tailwind CSS의 반응형 유틸리티 클래스
  - 모바일 Safari 키보드 대응 (`visualViewport` API)
  - 터치 이벤트 최적화
- **특징**:
  - 모바일 네비게이션 메뉴
  - 모바일 전용 채팅 UI
  - 이미지 최적화 (Cloudinary 자동 리사이징)

#### 5.2 다크 모드
- **구현**:
  - `next-themes`를 활용한 테마 전환
  - 시스템 테마 감지
  - 로컬 스토리지에 테마 설정 저장

### 6. 성능 최적화

#### 6.1 코드 스플리팅
- **의미**: 초기 번들 크기를 줄이기 위해 코드를 작은 청크로 나누어 필요한 시점에만 로드하는 기법
- **구현**:
  - **Next.js의 자동 코드 스플리팅**: 라우트별로 자동으로 코드를 분리하여 초기 로딩 시 필요한 페이지만 로드
  - **동적 import를 활용한 지연 로딩**: `next/dynamic`을 사용하여 무거운 컴포넌트를 필요할 때만 로드
    - 예시: `QuillEditor.tsx`에서 `react-quill-new` 라이브러리를 동적으로 로드하여 에디터 컴포넌트가 실제로 사용될 때만 번들에 포함
    - `ssr: false` 옵션으로 서버 사이드 렌더링 비활성화 (클라이언트 전용 컴포넌트)
    - 로딩 중 스켈레톤 UI 표시로 사용자 경험 개선
  - **컴포넌트 레벨 코드 스플리팅**: 특정 컴포넌트만 별도 청크로 분리하여 해당 컴포넌트가 필요한 페이지에서만 로드

#### 6.2 이미지 최적화
- **구현**:
  - Next.js Image 컴포넌트 활용
  - Cloudinary를 통한 자동 리사이징 및 포맷 변환
  - WebP 포맷 지원
  - Lazy loading

#### 6.3 캐싱 전략
- **구현**:
  - React Query의 자동 캐싱
  - 서버 컴포넌트 캐싱
  - CDN을 통한 정적 자원 캐싱

---

## 🗄️ 데이터베이스 스키마

### 주요 모델
- **User**: 사용자 정보
- **Conversation**: 대화방 정보
- **Message**: 메시지 정보
- **ConversationRead**: 읽음 상태 정보
- **Blog**: 블로그 게시글
- **Comment**: 블로그 댓글
- **Post**: 게시글
- **PostComment**: 게시글 댓글
- **DrinkReview**: 상품 리뷰

### 인덱싱 전략
- `Message`: `conversationId`, `createdAt` 복합 인덱스
- `ConversationRead`: `conversationId`, `userId` 복합 인덱스
- `User`: `email` 유니크 인덱스

---

## 🔒 보안 구현

### 1. 인증 및 권한
- JWT 기반 세션 관리
- API 라우트 인증 미들웨어
- 소켓 연결 인증 (handshake.auth)

### 2. 데이터 검증
- 서버 사이드 입력 검증
- XSS 방지 (dompurify)

### 3. 레이트 리미팅
- AI 스트리밍 요청 제한 (1분당 10회)
- 슬라이딩 윈도우 알고리즘

### 4. CORS 설정
- 허용된 도메인만 접근 가능
- Credentials 포함 설정

---

## 📦 프로젝트 구조

```
next-server/
├── src/app/
│   ├── (chat)/              # 채팅 관련 페이지
│   ├── (main)/              # 메인 페이지 (블로그, 게시판 등)
│   ├── api/                 # API Routes
│   │   ├── ai/              # AI 스트리밍 API
│   │   ├── conversations/   # 대화방 API
│   │   ├── messages/        # 메시지 API
│   │   └── ...
│   ├── components/          # React 컴포넌트
│   │   ├── chat/            # 채팅 관련 컴포넌트
│   │   └── ...
│   ├── hooks/               # 커스텀 훅
│   │   ├── useAIStream.ts   # AI 스트리밍 훅
│   │   ├── useConversation.ts
│   │   └── ...
│   ├── lib/                 # 유틸리티 함수
│   │   ├── aiStream.ts      # AI 스트리밍 로직
│   │   ├── sendMessage.ts   # 메시지 전송 로직
│   │   └── ...
│   └── types/               # TypeScript 타입 정의
├── graphql/                 # GraphQL 스키마 및 리졸버
├── prisma/                  # Prisma 스키마 및 마이그레이션
└── public/                  # 정적 자원

socket-server/
├── server.js                # Socket.io 서버
├── Dockerfile               # Docker 설정
└── fly.toml                 # Fly.io 배포 설정
```

---

## 🚀 배포 및 운영

### 배포 환경
- **프론트엔드/API**: Vercel
  - GitHub 연동 자동 배포
  - 환경 변수 관리
  - 에지 네트워크 활용
- **실시간 서버**: Fly.io
  - Docker 컨테이너 기반 배포
  - 자동 스케일링
  - 글로벌 배포

### 모니터링 및 로깅
- 서버 로그 추적
- 에러 핸들링 및 리포팅
- 성능 모니터링

---

## 🎨 UI/UX 특징

### 디자인 시스템
- Tailwind CSS 기반 유틸리티 우선 디자인
- HeroUI 컴포넌트 라이브러리 활용
- 일관된 색상 팔레트 및 타이포그래피

### 사용자 경험
- 부드러운 애니메이션 (Framer Motion)
- 로딩 스켈레톤 UI
- 에러 상태 명확한 표시
- 접근성 고려 (키보드 네비게이션, ARIA 라벨)

---

## 📊 성능 지표

### 최적화 요소
- 코드 스플리팅을 통한 초기 로딩 시간 단축
- 이미지 최적화를 통한 대역폭 절감
- React Query 캐싱을 통한 불필요한 요청 감소
- 서버 컴포넌트를 통한 번들 크기 감소

---

## 📝 개발 환경 설정

### 필수 요구사항
- Node.js 18.x 이상
- MongoDB 데이터베이스
- Cloudinary 계정
- 소셜 로그인 OAuth 클라이언트 ID

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# Prisma 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

---

## 📚 학습 및 경험

### 기술적 도전과 해결
1. **실시간 메시지 동기화**: 다중 탭 환경에서의 메시지 동기화 문제 해결
2. **AI 스트리밍 최적화**: 모바일 Safari에서의 스트리밍 호환성 문제 해결
3. **성능 최적화**: 무한 스크롤 및 캐싱 전략을 통한 성능 개선
4. **타입 안정성**: TypeScript를 활용한 타입 안전성 확보

### 적용된 설계 패턴
- **Custom Hooks 패턴**: 재사용 가능한 로직 분리
- **Optimistic Update 패턴**: 즉각적인 UI 반응
- **Provider 패턴**: 전역 상태 관리
- **Factory 패턴**: 유틸리티 함수 생성

---

## 🏆 프로젝트 하이라이트

1. **실시간 채팅 시스템**: Socket.io를 활용한 안정적인 실시간 통신
2. **AI 스트리밍**: Server-Sent Events를 활용한 실시간 AI 응답 스트리밍
3. **반응형 디자인**: 모바일 및 데스크톱 환경 모두 최적화
4. **성능 최적화**: 코드 스플리팅, 캐싱, 이미지 최적화를 통한 빠른 로딩 속도
5. **타입 안전성**: TypeScript를 활용한 안정적인 코드베이스

---

*이 문서는 프로젝트의 기술적 구현 상세를 담고 있으며, 실제 개발 과정에서의 학습과 경험을 반영하고 있습니다.*