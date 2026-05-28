# Scent Memories — Design System

> UI 작업 시 **반드시 이 문서의 토큰만** 사용. 새 색·버튼 스타일 즉흥 추가 금지.
> 브랜드: **라벤더(보라) + 아이보리 + 웜브라운/더스티로즈 그라데이션**.

## 1. 색 (CSS 변수만 사용. 라이트/다크 자동)

| 역할 | 변수 / Tailwind |
|---|---|
| 페이지 배경 | `var(--bg-page)` · `bg-default` |
| 카드 배경 | `var(--color-card-bg)` |
| 카드 보더 | `var(--color-card-border)` · `border-default` (1px+그림자) |
| 본문 텍스트 | `var(--color-text-primary)` · `text-text-primary` |
| 보조 텍스트 | `var(--color-text-secondary)` · `.text-secondary` |
| 브랜드 라벤더 | `var(--color-lavender)` · `text-lavender` / `bg-lavender` |
| 라벤더 연한 | `var(--color-lavender-pale)` (배경) · `--lavender-border` · `--lavender-muted` |
| 아이보리 | `var(--color-ivory)` · `bg-ivory` |
| 안 읽은 배지 | `.unread-badge` 클래스 (빨강) |

원본 정의: [globals.css `:root` / `.dark`](../src/app/globals.css).

**금지**: `bg-default-100`, `text-foreground/XX`, `color="primary"`, `bg-[#hex]`, `dark:bg-[#hex]`.

## 2. 그라데이션 (브랜드 자산)

| 클래스 | 용도 |
|---|---|
| `text-gradient-scent` | 페이지 제목·강조 텍스트 |
| `page-title-gradient` | 페이지 H2 폰트 사이즈/letter-spacing (항상 위와 함께) |
| `bg-gradient-scent` | 배지·라인 배경 |
| `bg-gradient-scent-avatar` | 아바타 (다크에도 어두운 톤) |
| `.action-btn` 배경 | `--gradient-add-btn` 자동 적용 |
| `line-gradient-deco` | 데코 가로선 |

## 3. 컴포넌트 (모두 import해서 쓸 것)

| 용도 | import / 클래스 |
|---|---|
| **버튼 CTA** | `Button` from `@/src/app/components/Button` — `variant="scent"` |
| **버튼 보조** | 같은 컴포넌트 — `variant="ghostLavender"` |
| **폼 하단 (제출+취소)** | `FormSubmitActions` from 같은 파일 |
| **페이지 내 액션 버튼** | `<button className="action-btn">` / `.action-btn--sm` |
| **입력** | `TextField` from `@/src/app/components/TextField` |
| **풀스크린 로딩** | `<PointsLoading loadingMessage="..." />` |
| **모달** | `Modal` 컴포넌트. 제목: `.modal-title` / 설명: `.modal-description` |
| **아바타** | `ScentUserAvatar` |
| **이미지** | `FallbackNextImage` 또는 `next/image` (blob URL은 `<img>`) |
| **이미지 슬라이더** | `ImageSlider` (variant `compact` 등) |
| **토스트** | `react-hot-toast` — `toast.error('...해주세요')` / `toast.success('...했어요')` |
| **테마 토글** | `ThemeSwitch` (next-themes) |

**금지**: HeroUI `<Button color="primary">` 직접 사용, 즉석 `animate-spin` spinner, 직접 만든 `<input>` 스타일.

## 4. 아이콘

`react-icons/hi2` (Heroicons v2) **1순위**. `react-icons/hi`, `fa`, `im`은 v2에 없을 때.
크기: `className="size-4"` (Tailwind size-* 권장).

```tsx
import { HiOutlineCamera } from 'react-icons/hi2';
<HiOutlineCamera className="size-5" aria-hidden />
```

**UI 텍스트 안 이모지 금지** (📷 📸 🔍 🛒 🟢 등). 예외: 토스트 `icon` prop, 빈 상태 placeholder.

## 5. 레이아웃

| 패턴 | 코드 |
|---|---|
| 페이지 컨테이너 | `<div className="max-w-[1440px] mx-auto w-full px-4 md:p-8">` 또는 `content-wrap` |
| 페이지 헤더 (제목+액션) | `.product-fragrance-header-layout` + `flex justify-between items-center` |
| 카드 그리드 | `.layout-card` (1→2→3→4열) / `.notice-grid` (공지 전용) |
| 풀 히어로 높이 | `calc(100dvh - var(--header-height))` (`--header-height: 56px`) |
| 좌우 패딩 | `px-4 md:px-8` |
| 섹션 간격 | `gap-8` ~ `gap-12` |

## 6. 카드 (직접 만들 때 따를 토큰)

- radius `16~18px` (`rounded-2xl` 또는 `rounded-[18px]`)
- `background: var(--color-card-bg)`
- `border: 1px solid var(--color-card-border)`
- rest 그림자 `0 2px 12px var(--color-shadow-soft)`, hover `0 16px 40px var(--color-shadow-hover)`
- 또는 기존 클래스 그대로: `.notice-card` / `.product-fragrance-card`

## 7. 페이지 템플릿 (복붙)

**Server page**:
```tsx
export const metadata: Metadata = { title: 'Foo' };
export default function FooPage() {
  return (
    <div className="content-wrap flex-col gap-4 max-w-[1440px] mx-auto w-full">
      <div className="product-fragrance-header-layout">
        <div className="flex flex-row justify-between items-center">
          <h2 className="text-gradient-scent page-title-gradient">Foo</h2>
        </div>
      </div>
      {/* 본문 */}
    </div>
  );
}
```

**Client form**:
```tsx
'use client';
import Button, { FormSubmitActions } from "@/src/app/components/Button";
import TextField from "@/src/app/components/TextField";
import PointsLoading from "@/src/app/components/PointsLoading";
// react-hook-form 사용
{isLoading && <PointsLoading loadingMessage="저장 중..." />}
<form className="flex flex-col gap-6">
  <TextField name="name" label="이름" />
  <FormSubmitActions submitLabel="저장" onCancel={() => router.back()} />
</form>
```

## 8. 안티패턴 체크 (PR 전 확인)

- [ ] `color="primary"` 등 HeroUI 색을 Button에 줬다
- [ ] `bg-default-100`, `text-foreground/XX`, `border-default-200` 썼다
- [ ] `bg-[#...]`, `text-[#...]` 하드코딩 hex 썼다
- [ ] 버튼 라벨에 이모지 넣었다
- [ ] 즉석 `animate-spin` spinner 만들었다
- [ ] 페이지 제목에 `text-gradient-scent` 없다
- [ ] `.dark` 토글 시 색 깨진다
- [ ] `react-hook-form` + `TextField` + `FormSubmitActions` 패턴 안 따랐다

하나라도 해당하면 수정.
