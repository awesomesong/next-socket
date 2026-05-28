# Scent Memories — next-server

Next.js 15 (App Router) · React 19 · TS · Prisma · NextAuth · Cloudinary · Socket.io. Dev: `npm run dev` (포트 3001).

레포: `next-server/`(이 패키지) + `socket-server/`(Fly.io). 경로 alias `@/*` → 패키지 루트.

---

## 어디에 뭐가 있나

- `prisma/db.ts` — PrismaClient 싱글톤. **항상 `import prisma from "@/prisma/db"`** (`new PrismaClient()` 금지).
- `src/middleware.ts` — 로그인 필수 페이지 `matcher`. 보호할 페이지 추가 시 여기만.
- `src/app/lib/session.ts` — `getCurrentUser()`. 보호 API에서 사용.
- `src/app/(main)/` · `(chat)/` — 라우트 그룹.
- `src/app/api/<feature>/route.ts` — route handler. Prisma·OpenAI 쓰면 `export const runtime = "nodejs"`.
- `src/app/lib/<feature>/` — 서버 비즈니스 로직.

---

## 규칙 (어기면 깨짐)

- **DB 스키마 변경**: `prisma/schema.prisma` 수정 → `prisma migrate dev` → `prisma generate`. 마이그레이션 없이 새 컬럼 의존 코드 추가 금지.
- **API 에러 응답**: `{ message: string }` + status. 클라는 `toast.error(message)`로 표시.
- **환경변수 누락**: 서버에서만 읽고, 누락 시 500 + 서버 로그. 클라이언트 노출 금지.
- **UI 토큰**: 색·버튼·로딩·아이콘·폼 전부 [docs/design-system.md](docs/design-system.md)의 토큰만 사용. 하드코딩 hex / HeroUI 기본 색(`color="primary"`, `bg-default-100`) / UI 텍스트 안 이모지 / 즉석 spinner 금지. **UI 작업 전 design-system.md 먼저 읽기.**

---

## 피처별 문서

- 향수 스캔(`/scan`): [src/app/api/scan/README.md](src/app/api/scan/README.md) — 만지기 전 필독.
- 의사결정 기록: [docs/decisions/](docs/decisions/) — ADR-0001(가격 소스), ADR-0002(Vision 2-pass).
