# Semantic YAML Ground Rules

## 1. 문서 목적

이 문서는 My Planner의 Semantic Concept YAML을 만들고 확장할 때 사용하는 기준선이다. 날짜뿐 아니라 시각, 반복 일정, 우선순위, 알림, 장소 등 새로운 의미 영역에도 같은 원칙을 적용한다.

Semantic YAML의 역할은 다음 세 가지다.

1. 사용자의 여러 자연어 표현을 하나의 안정적인 canonical 의미로 연결한다.
2. LLM, Application Core, Tool, Schema가 공유하는 의미 계약을 제공한다.
3. 계산과 저장 같은 결정적 동작의 책임자를 명확히 한다.

YAML은 프롬프트 모음도, 실행 코드도, 테스트 결과도 아니다. YAML에 선언된 규칙은 Application validator와 Tool이 집행하며 테스트로 검증한다.

## 2. 최상위 기본 구조

Semantic YAML은 원칙적으로 다음 순서를 사용한다.

```yaml
semantic_layer: {}
context: {}
concepts: {}
policies: {}
```

| Key | 필수 | 의미 |
|---|---|---|
| `semantic_layer` | 필수 | 문서 식별자, 계약 버전, 언어·지역 범위 |
| `context` | 조건부 | Application 또는 Workspace가 실행 시 주입할 값 |
| `concepts` | 필수 | 자연어 alias와 canonical 의미의 사전 |
| `policies` | 필수 | 추측·계산·보존·거부 등에 관한 집행 규칙 |

Tool 자체의 입출력 계약은 `tools/*.yaml`, SLM 출력 구조는 `schemas/*.json`에 둔다. Semantic YAML에 Tool 구현 세부사항을 중복 작성하지 않는다.

## 3. `semantic_layer` key

```yaml
semantic_layer:
  id: my_planner_temporal
  version: 1
  locale: ko-KR
```

### `id`

- 필수 string이다.
- 파일이 담당하는 의미 영역을 유일하게 식별한다.
- 소문자 `snake_case`를 사용한다.
- 파일명을 바꾸더라도 소비자가 의존하는 `id`를 임의로 바꾸지 않는다.
- 권장 형식은 `my_planner_<domain>`이다.

좋은 예: `my_planner_temporal`, `my_planner_recurrence`

나쁜 예: `config`, `semantic_v2`, `test_date`

### `version`

- 필수 양의 정수다.
- 배포 버전이나 날짜가 아니라 Semantic Contract의 버전이다.
- alias 추가처럼 기존 의미를 깨지 않는 변경은 같은 버전을 유지할 수 있다.
- canonical 이름 변경, key 제거, 타입 변경, resolver 변경처럼 consumer 동작에 영향을 주면 올린다.
- version을 올릴 때 Schema, Tool, validator와 회귀 테스트의 호환성을 함께 점검한다.

### `locale`

- 필수 BCP 47 언어 태그다. 예: `ko-KR`, `en-US`.
- alias 해석 범위를 결정한다.
- 다른 locale의 alias를 한 파일에 임의로 섞지 않는다.
- 다국어 지원 시 locale별 파일 또는 명시적인 locale scope를 사용한다.

## 4. `context` key

`context`는 의미 해석 또는 Tool 실행에 필요하지만 YAML 작성 시점에 고정할 수 없는 값을 선언한다.

```yaml
context:
  reference_datetime:
    source: application
    type: datetime
    required: true
    llm_must_not_generate: true
```

각 context 항목의 이름은 `snake_case`를 사용한다.

### `source`

- 필수 string이다.
- 값을 제공할 책임자를 선언한다.
- 현재 권장 값은 `application`, `workspace`, `user_profile`, `tool_result`다.
- 동일한 값에 둘 이상의 출처를 암묵적으로 허용하지 않는다. 우선순위가 필요하면 policy로 명시한다.

### `type`

- 필수 string이다.
- Application validator가 검사할 논리 타입이다.
- 예: `datetime`, `date`, `iana_timezone`, `string`, `integer`, `boolean`.
- `datetime`과 `date`, timezone 포함 시각과 local time을 혼용하지 않는다.

### `required`

- 필수 boolean이다.
- 해당 Semantic 해석 또는 Tool 실행 전에 값이 반드시 있어야 하는지를 뜻한다.
- `true`인데 값이 없으면 LLM이 채우지 않고 Application이 오류 또는 사용자 확인 흐름으로 보낸다.

### `llm_must_not_generate`

- LLM이 추측하면 안 되는 실행 context에는 필수로 `true`를 사용한다.
- 현재 시각, timezone, 사용자 ID, 저장소 ID 같은 값은 항상 `true`여야 한다.
- 이 선언은 문서만으로 끝나지 않고 validator가 LLM 출력에서 해당 값의 생성을 거부해야 한다.

## 5. `concepts` key

구조는 `의미 그룹 → concept ID → concept 속성`이다.

```yaml
concepts:
  relative_date:
    tomorrow:
      canonical: tomorrow
      aliases:
        - 내일
        - 익일
      offset_days: 1
      resolver: resolve_relative_date
```

### 의미 그룹 key

- `relative_date`, `recurrence_frequency`처럼 하나의 비교 가능한 의미 집합을 나타낸다.
- 소문자 `snake_case`를 사용한다.
- 한 그룹 안의 concept는 동일한 종류와 동일한 속성 구조를 가져야 한다.
- 날짜와 우선순위처럼 타입이 다른 의미를 같은 그룹에 섞지 않는다.

### Concept ID

- 그룹 안에서 유일한 소문자 `snake_case` 식별자다.
- 가능하면 `canonical`과 동일하게 유지한다.
- 자연어 표시명이 아니라 코드와 Schema가 참조하는 안정적인 ID다.
- 기존 ID를 바꾸는 것은 breaking change로 취급한다.

### `canonical`

- 모든 concept에 필수인 string이다.
- alias가 정규화된 뒤 Application 내부에서 사용하는 값이다.
- locale과 무관하고 의미가 분명한 영문 `snake_case`를 사용한다.
- 표시 문구나 번역 문자열을 canonical 값으로 사용하지 않는다.
- 동일 그룹 안에서 중복될 수 없다.

### `aliases`

- 모든 concept에 필수인 비어 있지 않은 string 배열이다.
- 실제 사용자 입력에서 발견할 표현만 넣는다.
- 같은 locale과 의미 그룹에서 alias가 둘 이상의 canonical에 중복되면 안 된다.
- 오탈자, 띄어쓰기 변형, 조사 포함 표현을 무제한 추가하지 않는다. 정규화 규칙이나 tokenizer 책임과 구분한다.
- 더 긴 표현과 짧은 표현이 겹칠 경우 Application은 longest match를 우선한다.
- 각 alias는 정상 사례와 충돌·경계 사례 테스트를 가져야 한다.

### Domain-specific 속성

`offset_days`처럼 특정 의미 그룹에서만 사용하는 key다.

- 이름은 소문자 `snake_case`를 사용한다.
- 같은 그룹의 모든 concept에서 타입과 의미가 같아야 한다.
- 단위가 있는 값은 key에 단위를 드러낸다. 예: `offset_days`, `duration_minutes`.
- 모호한 `value`, `amount`, `data` 대신 구체적인 이름을 사용한다.
- 계산 결과를 저장하지 않고 계산에 필요한 불변 규칙만 저장한다.

### `resolver`

- 결정적 계산이 필요한 concept에 필수인 string이다.
- `tools/*.yaml`에 등록된 Tool 이름과 정확히 일치해야 한다.
- LLM 함수명이 아니라 Application Core가 실행할 Tool 계약을 가리킨다.
- 네트워크나 현재 시각에 암묵적으로 의존하는 resolver를 사용하지 않는다. 필요한 값은 `context`로 명시한다.

## 6. `policies` key

`policies`는 허용된 값의 사전이 아니라 처리 과정의 불변조건을 선언한다.

```yaml
policies:
  relative_date:
    preserve_original_text: true
    canonical_value_required: true
    reject_unknown_alias: true
```

### Policy 작성 규칙

- boolean 정책은 `must`, `required`, `forbidden`, `reject`처럼 집행 방향이 분명한 이름을 사용한다.
- 모호한 `enabled`, `strict`, `safe`만으로 의미를 표현하지 않는다.
- policy마다 실제 집행 주체가 있어야 한다. LLM prompt만으로 집행했다고 간주하지 않는다.
- 거부 정책에는 테스트 가능한 오류 또는 fallback 흐름이 있어야 한다.
- 같은 규칙을 여러 영역에 적용한다면 `evidence`처럼 독립된 policy group으로 분리한다.

현재 날짜 정책의 의미:

| Policy | 의미 |
|---|---|
| `llm_must_not_resolve_to_calendar_date` | LLM이 `today`를 실제 날짜로 계산하지 못하게 한다. |
| `preserve_original_text` | 발견한 원문을 결과에 보존한다. |
| `canonical_value_required` | alias가 발견되면 canonical 값이 반드시 존재해야 한다. |
| `tool_request_required` | 계산이 필요한 concept에는 등록된 resolver 실행이 필요하다. Application이 직접 호출할 수 있다. |
| `reject_unknown_alias` | 등록되지 않은 표현을 임의의 canonical로 추측하지 않는다. |
| `expression_must_exist_in_user_input` | 결과의 근거 표현이 실제 입력에 있어야 한다. |
| `invented_date_expression_forbidden` | 모델 또는 Application이 입력에 없는 날짜 표현을 만들지 않는다. |

## 7. 이름과 타입 공통 규칙

- key, ID, canonical, Tool 이름은 영문 소문자 `snake_case`를 사용한다.
- 사용자에게 보이는 자연어만 `aliases`에 둔다.
- boolean 값은 문자열 `"true"`가 아니라 YAML boolean `true`를 사용한다.
- 숫자는 문자열로 감싸지 않는다.
- 날짜·시각 literal을 사용해야 하면 ISO 8601 형식을 사용하고 YAML 자동 형 변환을 피하도록 validator에서 string 여부를 확인한다.
- `null`을 정상 의미로 사용하지 않는다. 값이 선택 사항이면 key의 생략 조건을 Schema에 정의한다.
- 같은 개념을 두 key로 중복 표현하지 않는다.

## 8. 책임 경계

| 구성요소 | 책임 |
|---|---|
| Semantic YAML | alias, canonical 의미, 필요한 context, resolver 연결, policy 선언 |
| Application parser | alias 탐지, longest match, 중복·미지원 표현 거부 |
| Resolver/Tool | 기준값을 받아 날짜 등 결과를 결정적으로 계산 |
| JSON Schema | SLM 또는 파이프라인 출력의 구조와 타입 제한 |
| SLM | 의도, 제목 등 비결정적 자연어 해석 보조 |
| Domain validator | 충돌 검사, 필수값 검사, 저장 전 최종 검증 |

우선순위는 다음과 같다.

```text
사용자 명시 입력
→ Application이 주입한 신뢰 context
→ Semantic YAML과 결정적 Tool 결과
→ SLM의 추론 결과
```

SLM 결과가 Semantic YAML 또는 Tool 결과와 충돌하면 SLM 결과를 채택하지 않는다.

## 9. 확장 절차

새 의미를 추가할 때 아래 순서를 따른다.

1. 사용 사례와 지원하지 않을 범위를 먼저 작성한다.
2. 기존 의미 그룹에 속하는지, 새 그룹이 필요한지 결정한다.
3. 안정적인 Concept ID와 canonical 값을 정한다.
4. 실제 사용자 표현만 alias로 추가하고 중복 여부를 검사한다.
5. 계산에 필요한 외부 값은 `context`에 선언한다.
6. 결정적 계산이 필요하면 Tool 명세를 먼저 만들고 `resolver`로 연결한다.
7. 추측, 원문 보존, 오류 처리 policy를 명시한다.
8. Schema와 Application validator를 갱신한다.
9. 최소 정상·alias·경계·충돌·미지원 테스트를 추가한다.
10. breaking change라면 version을 올리고 관련 README를 갱신한다.

## 10. 최소 테스트 기준

각 concept에는 다음 테스트가 필요하다.

- canonical별 대표 alias 1건 이상
- 모든 추가 alias 1건 이상
- alias가 문장 안에 포함된 정상 입력
- 비슷하지만 등록되지 않은 표현의 거부 사례
- 짧은 alias와 긴 alias가 겹치는 longest-match 사례
- 필요한 context 누락 사례
- resolver의 월말·연말 등 domain 경계 사례
- SLM 출력과 결정적 결과가 충돌할 때 Semantic Layer가 우선하는 사례

테스트 기대값은 모델 실행 전에 고정하고, 실제 실행은 고유 Run 폴더에 보존한다.

## 11. 금지 패턴

다음과 같은 YAML은 만들지 않는다.

```yaml
# 실행할 때마다 달라지는 값을 Source Contract에 고정
today:
  resolved_date: 2026-08-22

# 사용자 표현을 내부 canonical로 사용
tomorrow:
  canonical: 내일

# 의미와 단위가 불분명한 key
reminder:
  value: 10

# Tool 명세 없이 구현 이름만 암묵적으로 호출
tomorrow:
  handler: calculate_it
```

또한 다음을 금지한다.

- prompt에만 존재하고 YAML에는 없는 숨은 의미 규칙
- 같은 alias를 여러 canonical에 중복 등록
- LLM이 현재 날짜나 timezone을 추측하게 하는 설계
- 테스트 없이 canonical 이름이나 resolver를 변경
- YAML, Tool YAML, JSON Schema에 같은 계약을 서로 다르게 중복 정의

## 12. 현재 날짜 YAML 예시 해석

```yaml
concepts:
  relative_date:
    tomorrow:
      canonical: tomorrow
      aliases:
        - 내일
        - 익일
      offset_days: 1
      resolver: resolve_relative_date
```

이 선언은 다음을 의미한다.

- `내일`과 `익일`은 같은 의미다.
- Application 내부 값은 `tomorrow`다.
- 실제 날짜는 Application이 제공한 기준일에 1일을 더해 계산한다.
- 계산은 `resolve_relative_date` Tool이 담당한다.
- SLM은 실제 날짜를 만들지 않는다.

## 13. 변경 전 체크리스트

- [ ] `semantic_layer.id`가 유일하고 의미 영역을 설명하는가?
- [ ] key, ID, canonical이 `snake_case`인가?
- [ ] alias 중복과 의미 충돌이 없는가?
- [ ] 실행 시점 값이 `context`로 분리됐는가?
- [ ] domain-specific 숫자에 단위가 드러나는가?
- [ ] resolver가 Tool registry에 존재하는가?
- [ ] policy를 Application 또는 validator가 실제로 집행하는가?
- [ ] Schema와 consumer가 새 key를 처리하는가?
- [ ] 정상·경계·거부 회귀 테스트가 있는가?
- [ ] breaking change라면 version을 올렸는가?
- [ ] 관련 README와 테스트 Run 문서를 갱신했는가?
