# Decisions

이 폴더는 **"왜 이렇게 만들었는가"** 를 보존하는 기록 모음입니다.
업계 용어로는 **ADR (Architecture Decision Record)** 이라고 불러요.

## 이 폴더가 필요한 이유

- 코드만 봐선 **왜 이 방식을 골랐는지** 알 수 없는 결정이 있어요 (대안이 뭐였는지, 어떤 트레이드오프를 받아들였는지).
- 시간이 지나면 작성자도 잊습니다. README나 설계 문서는 stale 돼도, ADR은 **그 시점의 결정 스냅샷**으로 의미가 유지돼요.
- 나중에 "이거 왜 이렇게 됐지?" 질문이 나올 때, git log를 뒤지는 대신 여기 한 파일만 보면 됩니다.

## 파일 규칙

```
NNNN-짧은-주제-요약.md
```

- `NNNN` — 4자리 일련번호 (`0001`, `0002`, ...). 새 결정마다 +1.
- 파일명은 영문 kebab-case, 한 줄로 결정의 핵심이 드러나게.

## 한 ADR 안의 구조

```markdown
# ADR-NNNN: 한 줄 결정 요약

- Status: Accepted / Superseded by ADR-NNNN / Deprecated
- 작성일, 관련 코드·문서 링크

## Context
무엇이 문제였는지, 왜 결정이 필요했는지.

## Decision
실제로 무엇을 골랐는지. 짧고 단정적으로.

## Consequences
Good / Trade-off / 되돌리는 조건.
```

## 언제 ADR을 새로 쓰나

- **외부 API/라이브러리/저장소를 선택**할 때 (대안이 둘 이상이고, 트레이드오프가 있을 때)
- **비용·성능·보안에 영향 주는 기술 선택** (예: Vision 호출 전략, 캐싱 정책)
- **기존 결정을 뒤집을** 때 — 새 ADR을 만들고 옛 ADR의 Status를 `Superseded by ADR-NNNN` 으로 표시

평범한 버그 수정·리팩터·UI 조정은 ADR이 필요 없어요. **결정이 미래의 누군가를 헷갈리게 할 가능성이 있을 때만** 씁니다.

## 현재 목록

- [0001 — 가격 비교 소스를 네이버 쇼핑 단일로 한정](./0001-naver-only-price-source.md)
- [0002 — Vision OCR을 2-pass(low → high)로 분리](./0002-vision-two-pass-ocr.md)
