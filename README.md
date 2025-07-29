## 📖 About

하이트 맥주를 좋아하는 사람들이 실시간으로 소통하고, 다양한 주제를 공유할 수 있는 커뮤니티 서비스를 만들고자 했습니다.  
기술적인 학습 목적과 사용자 중심의 구조 설계를 함께 고려하여 다음과 같은 기능들을 구현했습니다.


## 🚀 사용 기술 스택 (Tech Stack)

---

### 🖥️ next-server (프론트 + API 서버)

- **Next.js 15 (App Router 기반)**
- **React 19**
- **TypeScript**
- **NextAuth** – 소셜 로그인 및 계정 등록
- **Apollo Client / Apollo Server** – GraphQL API 구축 및 운영
- **React Query** – 데이터 fetching & 캐싱
- **Zustand** – 전역 상태 관리
- **Prisma** – MongoDB ORM
- **MongoDB** – 데이터베이스
- **Socket.io Client** – 실시간 채팅 클라이언트
- **Cloudinary** – 이미지 업로드 및 최적화
- **Tailwind CSS / HeroUI / Framer Motion** – UI 설계 및 부드러운 애니메이션 처리
- **반응형 설계 완비**
  - Tailwind 기반 모바일 대응
  - 모바일 Safari 키보드 대응 (visualViewport 활용)
  - 다양한 뷰포트에 적응하는 레이아웃 구현
- **react-hook-form** – 폼 관리
- **react-hot-toast** – 사용자 알림 처리
- **react-quill-new** – WYSIWYG 에디터
- **dayjs** – 날짜 처리
- **dompurify** – XSS 방지
- **Highlight.js** – 코드 하이라이팅
- **Vercel** – 배포 및 호스팅

---

### 🌐 socket-server (실시간 전용 서버)

- **Socket.io Server** – 실시간 메시지 처리 (채팅, 알림, 접속 상태 표시, 등)
- **Express** – 서버 구성
- **Fly.io** – 실시간 서버 배포 및 호스팅

---

### 주요 기능

- 실시간 1:1 및 그룹 채팅
- 채팅 읽음 처리 및 참여자 상태 표시
- 블로그 게시판 기능 (무한스크롤, 댓글)
- 회원가입 / 로그인 / 인증 흐름
- 반응형 레이아웃 및 모바일 키보드 대응

---

## ⚙️ Getting Started

### 1.  폴더 구조


#### 최상위 폴더 구조
- next-server/ – Next.js 기반 프론트엔드와 API 서버 
- socket-server/ – 실시간 채팅을 처리하는 Socket.io 서버

#### 🖥️ next-server
```
next-server
├── config.ts                # 환경변수 활용에 필요한 설정
├── next.config.js           # Next.js 전역 설정
├── postcss.config.js        # PostCSS 설정
├── prisma/                  # Prisma ORM 스키마와 초기화 스크립트
│   ├── db.ts
│   └── schema.prisma
├── graphql/                 # GraphQL 스키마 및 리졸버 구현
│   ├── mutations.ts
│   ├── queries.ts
│   ├── resolvers.ts
│   └── schema.ts
├── pages/api/               # API 경로 (예: GraphQL endpoint)
│   └── graphql.ts
├── public/                  # 정적 자원(이미지, 업로드 파일 등)
├── src/                     # 실제 앱 로직이 위치하는 디렉터리
│   └── app/                 # Next.js App Router 엔트리
│       ├── (chat)/          # 채팅 관련 페이지들
│       ├── (main)/          # 블로그/게시판 등 메인 기능 페이지
│       ├── api/             # 클라이언트용 API 유틸
│       ├── auth/            # 인증 관련 UI 컴포넌트
│       ├── components/      # 재사용 가능한 React 컴포넌트
│       ├── context/         # 전역 컨텍스트(Provider) 모음
│       ├── hooks/           # 커스텀 훅
│       ├── lib/             # 서버와 클라이언트에서 사용하는 공통 로직
│       ├── data/            # 예시 데이터 등
│       ├── globals.css      # 전역 스타일
│       ├── layout.tsx       # 루트 레이아웃
│       └── not-found.tsx    # Next.js 404 페이지
├── server.js                # 필요 시 커스텀 서버 로직
├── tsconfig.json            # TypeScript 설정
└── .env                     # 환경 변수 예시 
```

#### 🌐 socket-server
```
socket-server
├── server.js        # Socket.io 이벤트 핸들러와 Express 서버
├── Dockerfile       # 컨테이너 배포 시 사용되는 도커 설정
├── fly.toml         # Fly.io 배포 설정 파일
├── package.json     # 서버 의존성 및 스크립트 정의
├── package-lock.json
└── .env             # 소켓 서버용 환경 변수
```


### 2. 배포 정보


#### Vercel (프론트엔드)
- **GitHub 연동으로 자동 배포
- **환경 변수는 Vercel 대시보드에서 설정
- **next.config.js에서 이미지 및 API 도메인 설정

#### Fly.io (소켓 서버)
- **fly.toml로 배포 설정
- **flyctl deploy 명령어로 배포