# Skeleton UI

## 클래스 목록

| 클래스 | 용도 |
|---|---|
| `skeleton-pulse` | pulse 애니메이션 (부모에 한 번만 적용) |
| `skeleton-bg` | 일반 스켈레톤 바 — 카드/페이지 범용 |
| `skeleton-bg-muted` | 보조 스켈레톤 바 (더 연함) |
| `skeleton-price-bar` | **가격 비교 섹션 전용** primary 바 |
| `skeleton-price-bar-muted` | **가격 비교 섹션 전용** secondary 바 |

## 언제 어떤 클래스를 쓰나

```
일반 스켈레톤 (향수 카드, 공지, 프로필 등)
  → skeleton-bg / skeleton-bg-muted

가격 비교 (PriceCards 로딩)
  → skeleton-price-bar / skeleton-price-bar-muted
```

`skeleton-price-bar`가 별도로 존재하는 이유:  
`bg-ivory` (`#fffcfa`) 위에서 기본 `skeleton-bg`(`--color-lavender-border: #e2d9f3`)는  
대비 1.3:1로 거의 안 보임. 별도 보정값 필요.

## 색상값

두 모드 모두 `var(--color-lavender)` 를 직접 참조. opacity만 다름.

```css
/* 라이트: --color-lavender = #b094e0 */
.skeleton-price-bar       { color-mix(in srgb, var(--color-lavender) 85%, transparent) }
.skeleton-price-bar-muted { color-mix(in srgb, var(--color-lavender) 60%, transparent) }

/* 다크: --color-lavender = #c8b4ff */
.dark .skeleton-price-bar       { color-mix(in srgb, var(--color-lavender) 52%, transparent) }
.dark .skeleton-price-bar-muted { color-mix(in srgb, var(--color-lavender) 38%, transparent) }
```

opacity를 다르게 가져가는 이유: 라이트 배경(#f7f5f2)은 밝아서 투명도를 낮추면 안 보임,  
다크 배경(#2d2640)은 어두워서 낮은 opacity로도 충분히 대비됨.

## 대비율 (WCAG 참고)

| 모드 | 배경 | primary | muted |
|---|---|---|---|
| 라이트 | `#f7f5f2` | 약 2.0:1 | 약 1.6:1 |
| 다크 | `#2d2640` | 3.3:1 ✓ | 2.3:1 |

> 스켈레톤 바는 장식용(non-text) 요소. 라이트 모드는 `animate-pulse` 모션으로 시인성 보완.

## 사용 예시

```tsx
<section className="flex flex-col gap-4 animate-pulse">
  {/* 섹션 타이틀 */}
  <div className="h-3.5 w-28 rounded-full skeleton-price-bar" />

  {/* 카드 내부 */}
  <div className="p-3 rounded-2xl border border-lavender-border bg-ivory dark:bg-[var(--color-ivory-soft)]">
    <div className="h-3.5 w-4/5 rounded-full skeleton-price-bar" />
    <div className="h-3 w-2/5 rounded-full skeleton-price-bar-muted" />
  </div>
</section>
```

## 금지

- `animate-spin` 직접 사용 — `skeleton-pulse` 클래스로 통일
- `bg-stone-*` — 브랜드 톤(라벤더)과 불일치, 다크 배경에서 대비 부족
- `bg-gray-*` / 임의 hex 인라인 — 디자인 시스템 위반
