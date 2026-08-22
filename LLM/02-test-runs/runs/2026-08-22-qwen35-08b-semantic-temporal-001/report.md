# 상대 날짜 Semantic Layer 실험 보고서

## 목적과 조건

Qwen3.5 0.8B가 상대 날짜를 직접 해석할 때와 YAML Semantic Layer 및 결정적 Tool이 해석할 때를 비교했다. 기준 시각은 `2026-08-22T12:00:00+09:00`, timezone은 `Asia/Seoul`이다.

## 결과

| 처리 방식 | 통과 | 결과 |
|---|---:|---|
| SLM 단독 구조화 출력 | 0/6 | 별칭 혼동, Tool 호출 누락, JSON 계약 위반 |
| YAML Semantic Layer + 결정적 Tool | 6/6 | 모든 별칭과 날짜가 기대값과 일치 |

SLM은 `금일 → tomorrow`, `내일 → today`, `모레 → tomorrow` 같은 의미 혼동을 보였다. 프롬프트에 Tool 호출 의무를 명시해도 `tool_requests`를 빈 배열로 반환했다.

Application Core가 `temporal-concepts.yaml`을 읽어 원문 별칭을 canonical concept로 바꾸고 `offset_days`를 적용하자 6건 모두 통과했다.

## 권장 처리 흐름

```text
사용자 문장
  → Semantic Layer가 날짜 별칭 탐지
  → YAML의 canonical/offset_days 조회
  → resolve_relative_date 실행
  → 확정된 YYYY-MM-DD를 일정 계층에 전달
  → SLM은 의도·제목 등 비결정적 정보만 보조
```

SLM이 Tool 호출 JSON을 올바르게 만들기를 기다리지 않는다. 애플리케이션이 상대 날짜를 발견하면 Tool을 직접 호출하고, SLM 출력과 충돌할 경우 Semantic Layer 값을 우선한다.

## llama.cpp 호환성 기록

현재 `llama.cpp b10489-169e4a7ff`에서 `--json-schema-file`로 생성한 grammar가 `Failed to initialize samplers: std::exception`을 냈다. 최초 정규식의 `\\d` 문제는 `[0-9]`로 수정했지만 전체 sampler 예외는 계속됐다. 따라서 SLM 비교는 prompt-only JSON으로 수행했다.

grammar가 정상 작동하더라도 JSON 문법만 강제할 뿐, `모레`의 올바른 의미 선택까지 보장하지는 않는다.

## 다음 실험

1. 날짜 전처리 결과를 SLM 입력에 주고 일정 제목·시각 추출만 평가한다.
2. `이번 주 금요일`, `다음 주`, `3일 뒤` Concept를 YAML에 추가한다.
3. 자정, 월말, 연말, 윤년, DST timezone 회귀 테스트를 추가한다.
4. 최소 JSON Schema로 llama.cpp sampler 호환성을 별도 재현한다.
