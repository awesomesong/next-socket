# ADR-0002: Vision OCR을 2-pass(low → high) 로 분리

- **Status**: Accepted (2026-05-26)
- **Context module**: [src/app/lib/scan/visionAnalyze.ts](../../src/app/lib/scan/visionAnalyze.ts)
- **관련**: [구현 문서](../../src/app/api/scan/README.md)

## Context

GPT-4o Vision API의 이미지 토큰은 `detail` 옵션에 따라 다름:
- `detail="low"`: 85 토큰 / 이미지 (저비용·저정확도)
- `detail="high"`: ~765 토큰 / 이미지 (고비용·고정확도, ~9x)

설계 단계에선 단일 호출(high)을 가정했으나, 실측 결과:
- **또렷한 라벨 사진은 low로도 brand/name 정확 추출** — 사용자 업로드의 80% 이상
- 어려운 케이스(작은 글씨, 흐린 사진, 측면)는 low에서 결손 발생
- 모든 요청을 high로 돌리면 평균 비용 9배 — 베타 단계 비용 부담 큼

또한 설계 원안은 Vision이 **노트·설명까지 함께 추출**하는 구조였으나:
- Vision 모델이 이미지에 없는 정보(노트 구성)를 hallucinate하는 문제 발견
- OCR(이미지 → 텍스트)과 enrichment(텍스트 → 상품 지식)는 본질적으로 다른 작업

## Decision

**OCR과 enrichment를 분리. OCR은 2-pass.**

1. **Vision OCR (`visionAnalyze.ts`)**: 이미지에 보이는 텍스트만 추출 — `brand/name/concentration/size`
   - 1차 `detail="low"` 호출
   - `needsHighResRetry()` 평가: name 결손 / 너무 짧음(≤5자) / concentration-only / 등
   - 2차 `detail="high"` 재시도 — 어려운 케이스만
   - 모델 거부 시 `gpt-4o` → `gpt-4o-mini` fallback
2. **Enrichment (`enrichInfo.ts`)**: 추출된 `brand+name` 텍스트를 gpt-4o-mini로 보내 노트·설명 생성 (이미지 없음, 환각 위험 낮음)
3. **우선순위**: curated DB(`Fragrance` 테이블) > 24h 캐시 > enrichInfo

## Consequences

**Good**
- 평균 이미지 토큰이 단일-high 대비 약 ~25% 수준 (대부분 low로 끝남)
- OCR과 enrichment 분리로 hallucination 표면 축소
- enrichment 결과는 24h 캐시로 추가 절감

**Trade-off**
- 어려운 사진은 2회 호출 → latency 약간 증가 (low 1~2s + high 2~3s)
- OCR/enrichment 분리로 코드 경로 2개 → 디버깅 위치 분산
- enrichInfo 비용(gpt-4o-mini)이 새로 발생 — 다만 텍스트 LLM이라 Vision 대비 ~1/30

**되돌리는 조건 / 주의**
- `needsHighResRetry()` 조건 완화 시 평균 비용 급증 — 변경 전 실측 필수
- enrichInfo에서 환각이 다시 문제되면 curated DB 매칭 우선순위를 더 강하게
- Vision 모델이 OCR + enrichment 동시 정확도를 충분히 끌어올리는 세대로 진화하면 단일 호출 재검토
