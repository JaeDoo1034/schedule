# 05. Semantic Layer와 Tool Contract

이 영역은 작은 Local LLM이 `오늘`, `내일` 같은 상대 날짜를 임의의 실제 날짜로 계산하지 않도록 의미 체계와 Tool 계약을 정의한다.

첫 구현 및 비교 결과는 [2026-08-22 Semantic Temporal 001](../02-test-runs/runs/2026-08-22-qwen35-08b-semantic-temporal-001/README.md)에 기록했다.

## 목표

```text
사용자 자연어
→ SLM Semantic Parse
→ Canonical Concept
→ Deterministic Tool
→ Domain Validation
→ Preview
→ 사용자 확인
```

SLM의 책임:

- 사용자 표현을 일정관리 Intent로 분류
- `오늘`, `금일` 등을 `today`로 정규화
- `내일`, `익일` 등을 `tomorrow`로 정규화
- 원문 표현을 `original_text`로 보존
- 필요한 Tool과 arguments 요청
- 누락되거나 모호한 값을 보고

SLM이 하지 않는 일:

- 현재 날짜 추측
- 상대 날짜를 실제 날짜로 직접 계산
- Workspace timezone 생성
- Tool 실행 결과 조작
- 일정 데이터 직접 저장

## 폴더 구조

```text
05-semantic-layer/
├ SEMANTIC_LAYER_OVERVIEW.md
├ semantic/
│  ├ README.md
│  ├ SEMANTIC_YAML_GROUND_RULES.md
│  └ temporal-concepts.yaml
├ tools/
│  └ date-tools.yaml
├ schemas/
│  └ semantic-parse.schema.json
├ prompts/
│  └ temporal-parser-system.txt
└ tests/
   └ temporal-test-cases.json
```

## 핵심 설계 결정

### 실제 날짜를 SLM에 요구하지 않는다

```text
오늘 → today
내일 → tomorrow
모레 → day_after_tomorrow
```

이 단계의 성공 기준은 `today`를 `2026-08-22`로 만드는 것이 아니다. SLM이 `today`라는 canonical concept와 `resolve_relative_date` Tool 요청을 안정적으로 만드는 것이다.

### 기준 시각은 Application이 주입한다

```text
reference_datetime = 2026-08-22T12:00:00+09:00
timezone = Asia/Seoul
```

Tool은 이 값을 사용해 결정적으로 계산한다. SLM은 기준 시각과 timezone을 생성하지 않는다.

### YAML은 Source Contract다

YAML 원문 전체를 매 요청마다 SLM에 넣지 않는다. Application은 현재 Intent에 필요한 concept와 Tool 규칙만 짧은 system prompt 또는 grammar로 구성한다.

Semantic YAML을 새로 만들거나 수정할 때는 [Semantic YAML Ground Rules](semantic/SEMANTIC_YAML_GROUND_RULES.md)를 기준으로 삼는다. 모든 YAML은 `semantic_layer`, `context`, `concepts`, `policies`의 책임을 분리하며 다음 원칙을 지킨다.

- 자연어 표현은 `aliases`, 내부 의미는 영문 `snake_case`의 `canonical`로 관리한다.
- 현재 시각과 timezone 같은 실행 값은 `context`로 선언하고 Application이 주입한다.
- 계산은 등록된 `resolver` 또는 Tool이 담당하며 LLM에 맡기지 않는다.
- alias 중복, 알려지지 않은 표현, 근거 없는 추측은 Application validator가 거부한다.
- 의미·타입·resolver 변경은 계약 변경으로 보고 version, Schema, 테스트를 함께 관리한다.

YAML에 key를 추가하는 것만으로 기능이 완성되지는 않는다. Tool 명세, JSON Schema, Application consumer와 회귀 테스트가 그 key를 실제로 처리해야 한다.

### Tool 결과도 Domain 입력이다

Tool이 계산한 날짜는 곧바로 파일에 저장되지 않는다. Intent와 다른 field를 합쳐 Domain validation과 Preview를 거친다.

## 현재 실험 범위

첫 Run에서는 다음 표현만 평가한다.

```text
오늘 · 금일 → today
내일 · 익일 → tomorrow
모레 → day_after_tomorrow
```

이후 범위:

- 어제
- 이번 주와 다음 주
- 이번 주말
- 다음주 요일
- 오늘 밤과 내일 새벽
- 자정 경계와 DST가 있는 timezone

## 관련 문서

- [Semantic 폴더 안내](semantic/README.md)
- [Semantic YAML 전체 작성 규칙](semantic/SEMANTIC_YAML_GROUND_RULES.md)
- [상대 날짜 Concept](semantic/temporal-concepts.yaml)
- [날짜 Tool 명세](tools/date-tools.yaml)
- [SLM 출력 Schema](schemas/semantic-parse.schema.json)
- [System Prompt](prompts/temporal-parser-system.txt)
- [Test Cases](tests/temporal-test-cases.json)
- [테스트 실행 내역](../02-test-runs/README.md)
