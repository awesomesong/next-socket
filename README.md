## 🚀 사용 기술 스택 (Tech Stack)

### 🔧 프레임워크 & 라이브러리

- **Next.js 14 (App Router 기반)**
- **React 18**
- **TypeScript**
- **NextAuth** - 소셜 및 이메일 인증
- **Apollo Client / Server**
- **React Query** - 데이터 fetching & 캐싱
- **Zustand** - 전역 상태 관리
- **Socket.io** - 실시간 채팅
- **Express** (서브 서버)

### 💾 데이터베이스 & ORM

- **MongoDB**
- **Prisma**

### 🔌 API & 통신

- **GraphQL API 서버 직접 구축 및 운영 (Apollo Server + Express)**
- **REST API 일부 병행 사용 (예: 댓글 기능)**

### ☁️ 배포 & 서버

- **Vercel** (또는 향후 웹호스팅을 위한 준비)
- **Node.js** (18.x)
- **Cloudinary** - 이미지 업로드 및 최적화

### 🌐 SEO & 접근성

- **Next.js 메타데이터 설정** (metadata API 활용)
- **Open Graph 태그 구성 (og:image, og:title 등)**
- **웹 접근성(ARIA) 일부 고려**

### 📱 반응형

- **모바일 대응 완비 (Tailwind 기반 반응형 설계)**

### 🎨 UI & 스타일

- **Tailwind CSS**
- **HeroUI**
- **Framer Motion** - 애니메이션
- **Highlight.js** - 코드 하이라이팅

### 📦 기타 라이브러리

- **react-hook-form** - 폼 관리
- **react-hot-toast** - 알림
- **dompurify** - XSS 방어
- **react-quill** - WYSIWYG 에디터
- **dayjs** - 날짜 처리

---

## 🧩 주요 구현 기능 (Features)

### 📝 블로그
- 글 작성, 수정, 삭제 (React-Quill 에디터 사용)
- 이미지 업로드 (Cloudinary 연동)
- 실시간 미리보기 및 이미지 개별 삭제
- XSS 방지 처리 (sanitize-html, DOMPurify)

### 💬 댓글
- 무한 스크롤 댓글 로딩 (React Query InfiniteQuery)
- 댓글 작성, 삭제
- 댓글 수 동기화 및 실시간 렌더링
- 작성자 정보 표시 (프로필 이미지, 이름)

### 💬 실시간 채팅
- Socket.io 기반 채팅방
- 안 읽은 메시지 카운트
- 실시간 메시지 전송/수신 처리

### 🔐 인증 및 권한
- NextAuth 기반 로그인 (이메일, 소셜 등)
- 관리자 / 작성자 구분 처리
- 권한 기반 블로그 수정/삭제 허용

### 📈 조회수 처리
- 블로그 조회수 Prisma 기반 증가 처리
- useMutation으로 viewCount 증가 요청

### 🧠 상태 관리
- Zustand로 전역 상태 관리
- 로그인 유저 정보, 알림 상태 등 저장

### 🎨 사용자 경험 개선
- Tailwind + HeroUI + Framer Motion 조합
- 반응형 UI 및 부드러운 애니메이션
- 로딩 스켈레톤 UI (댓글, 블로그)