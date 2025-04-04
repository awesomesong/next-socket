## 🚀 사용 기술 스택 (Tech Stack)

---

### 🖥️ next-server (프론트 + API 서버)

- **Next.js 14 (App Router 기반)**
- **React 18**
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
- **react-quill** – WYSIWYG 에디터
- **dayjs** – 날짜 처리
- **dompurify** – XSS 방지
- **Highlight.js** – 코드 하이라이팅
- **Vercel** – 배포 및 호스팅

---

### 🌐 socket-server (실시간 전용 서버)

- **Socket.io Server** – 실시간 메시지 처리 (채팅, 알림, 접속 상태 표시 등)
- **Express** – 서버 구성
- **Fly.io** – 실시간 서버 배포 및 호스팅