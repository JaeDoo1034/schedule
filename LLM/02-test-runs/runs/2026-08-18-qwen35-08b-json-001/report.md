# Run 001 — Qwen3.5-0.8B JSON 구조 테스트

## 1. 목적

Qwen3.5-0.8B Q4_0이 한국어 일정관리 명령에 대해 다음 조건을 만족하는지 확인한다.

1. 실행 중 오류 없이 종료하는가?
2. JSON 객체 하나를 반환하는가?
3. 합의한 최상위 구조와 type을 지키는가?
4. 입력의 실제 의미를 올바르게 해석하는가?
5. 입력에 없는 날짜·시간·제목을 만들지 않는가?

## 2. 테스트 환경

```text
Date: 2026-08-18
Runtime: llama.cpp b10489-169e4a7ff
Model: Qwen3.5-0.8B-Q4_0.gguf
Inference: CPU only
Threads: 4
Context: 2,048 tokens
Maximum output: 180 tokens
Temperature: 0
Reasoning: off
Execution: single turn, sequential
```

여러 model process를 동시에 실행하면 8GB RAM 가정에서 불필요하게 메모리를 많이 사용할 수 있으므로 5개 사례를 순차 실행했다.

## 3. 요구 JSON 구조

```json
{
  "schema_version": 1,
  "intent": "CREATE_TASK | CREATE_EVENT | QUERY_SCHEDULE | UNKNOWN",
  "confidence": 0.0,
  "arguments": {},
  "missing_fields": [],
  "requires_confirmation": true
}
```

검사한 기본 조건:

- 최상위 값은 JSON object
- `schema_version`은 number
- `intent`는 허용된 string
- `confidence`는 number
- `arguments`는 object
- `missing_fields`는 string array
- `requires_confirmation`은 boolean
- 설명이나 Markdown을 JSON 앞뒤에 추가하지 않음

## 4. 전체 결과

| 항목 | 결과 |
|---|---:|
| 전체 테스트 | 5 |
| Process 정상 종료 | 5/5, 100% |
| JSON parsing 성공 | 5/5, 100% |
| 최상위 구조 통과 | 5/5, 100% |
| 의미 정확성 통과 | 2/5, 40% |
| 평균 생성 속도 | 약 98 tokens/s |

핵심 결과는 다음과 같다.

> JSON 모양은 안정적으로 만들었지만, 일정 의미와 누락 필드 처리는 아직 신뢰할 수 없다.

## 5. 사례별 결과

### T01 — Event 생성

입력:

```text
내일 오후 3시에 병원 예약 등록해줘
```

출력:

```json
{"schema_version":1,"intent":"CREATE_EVENT","confidence":0.95,"arguments":{"title":"병원 예약","date_expression":"내일 오후 3시"},"missing_fields":[],"requires_confirmation":true}
```

판정:

- JSON 구조: 통과
- 의미: 실패
- `CREATE_EVENT`, title과 확인 여부는 올바름
- `start_time: 15:00`을 별도 추출하지 않음
- 날짜와 시각을 `date_expression`에 합침

### T02 — Task 생성과 중요도

입력:

```text
다음주 금요일까지 보고서 작성 업무를 중요로 등록해줘
```

출력:

```json
{"schema_version":1,"intent":"CREATE_EVENT","confidence":0.95,"arguments":{"title":"보고서 작성 업무","date_expression":"다음주 금요일"},"missing_fields":[],"requires_confirmation":true}
```

판정:

- JSON 구조: 통과
- 의미: 실패
- `CREATE_TASK`를 `CREATE_EVENT`로 오분류
- 중요도 `high` 누락

### T03 — 시각이 없는 Event

입력:

```text
다음주 화요일에 팀 회의 잡아줘
```

출력:

```json
{"schema_version":1,"intent":"CREATE_EVENT","confidence":0.95,"arguments":{"title":"팀 회의","date_expression":"다음주 화요일","start_time":"14:00"},"missing_fields":[],"requires_confirmation":true}
```

판정:

- JSON 구조: 통과
- 의미: 실패
- 입력에 없는 `14:00`을 생성
- `missing_fields`에 `start_time`을 넣지 않음

### T04 — 날짜와 시각이 모호한 Event

입력:

```text
다음주에 회의 하나 잡아줘
```

출력:

```json
{"schema_version":1,"intent":"CREATE_EVENT","confidence":0.95,"arguments":{"title":"팀 회의","date_expression":"다음주 화요일","start_time":"14:00"},"missing_fields":[],"requires_confirmation":true}
```

판정:

- JSON 구조: 통과
- 의미: 실패
- 입력에 없는 `팀`, `화요일`, `14:00` 생성
- 모호성 및 누락 필드를 보고하지 않음
- System prompt 예시를 그대로 복사한 것으로 추정

### T05 — 일정 조회

입력:

```text
내일 예정된 일정 보여줘
```

출력:

```json
{"schema_version":1,"intent":"QUERY_SCHEDULE","confidence":0.95,"arguments":{"date_expression":"내일"},"missing_fields":[],"requires_confirmation":false}
```

판정:

- JSON 구조: 통과
- 의미: 통과
- 조회 Intent, 상대 날짜 보존과 확인 불필요 정책이 모두 맞음

## 6. 주요 발견

### JSON 형식은 비교적 안정적이다

5개 사례 모두 JSON parsing과 최상위 key/type 검사를 통과했다. `temperature=0`, 명시적인 출력 key와 JSON-only 지시가 형식 안정성에 도움이 된 것으로 보인다.

### JSON 형식 통과는 명령 실행 허가가 아니다

모든 결과가 올바른 JSON이었지만 3개는 의미가 틀렸다. JSON Schema는 `start_time`이 string이라는 것은 확인할 수 있어도 그 시각이 사용자 입력에 실제로 존재했는지는 확인하지 못한다.

### Few-shot 예시 오염이 크다

System prompt 예시에 사용한 다음 값이 입력에 없는데도 반복됐다.

```text
title: 팀 회의
date_expression: 다음주 화요일
start_time: 14:00
```

작은 모델은 예시를 추론 규칙보다 답안 template로 복사할 수 있다. 하나의 구체적인 예시만 넣는 방식은 위험하다.

### Confidence를 신뢰할 수 없다

정답과 오답 모두 `confidence: 0.95`를 반환했다. 현재 confidence는 실제 정확도를 반영하지 않는다. 앱의 실행 여부를 모델이 제시한 confidence 하나로 결정하면 안 된다.

## 7. 현재 판단

Qwen3.5-0.8B Q4_0은 다음 용도로 사용할 가능성이 있다.

- 제한된 Intent 후보 생성
- 사용자 문장에서 제목과 상대 날짜 후보 추출
- Preview 초안 생성

현재 결과만으로 다음 작업을 맡기면 안 된다.

- 사용자 확인 없는 자동 등록
- 누락 필드의 최종 판단
- 모호한 날짜와 시각의 결정
- confidence 기반 자동 실행
- 일정 데이터 직접 수정

## 8. 다음 개선 실험

1. 구체적인 단일 예시를 제거하고 규칙 중심 prompt를 시험한다.
2. 서로 다른 값의 positive/negative 예시를 균형 있게 제공한다.
3. `start_time`은 사용자 입력의 span이 있을 때만 생성하도록 근거 필드를 추가한다.
4. 입력 원문에서 arguments 값의 근거를 Core가 검증한다.
5. JSON Schema 또는 grammar로 문법을 강제한다.
6. Task와 Event를 한 번에 분류하지 않고 2단계 parser를 비교한다.
7. Q8 또는 더 큰 1.7B 모델과 동일 사례를 비교한다.
8. 최소 50개 평가 문장으로 accuracy를 다시 측정한다.

## 9. 재현 자료

- 입력과 기대값: [test-cases.json](test-cases.json)
- 실제 출력과 판정: [results.json](results.json)
- Run 메타데이터: [README.md](README.md)
- 이전 단일 실험: [../2026-08-18-qwen35-08b-smoke-001/report.md](../2026-08-18-qwen35-08b-smoke-001/report.md)
- 터미널 사용법: [../../../01-llama-cpp-guide/terminal-usage.md](../../../01-llama-cpp-guide/terminal-usage.md)

