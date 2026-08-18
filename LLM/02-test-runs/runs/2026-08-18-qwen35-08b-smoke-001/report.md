# Run 001 — Qwen3.5-0.8B Q4_0 Smoke Test

## 1. 목적

CPU와 제한된 메모리 환경에서 소형 Local LLM이 한국어 일정 명령을 구조화된 JSON으로 변환할 수 있는지 확인한다.

이번 실험은 다음 질문에 답하기 위한 첫 smoke test다.

- 모델이 로컬 CPU에서 정상 실행되는가?
- 8GB RAM을 가정한 환경에서 모델 process 메모리가 충분히 작은가?
- 한국어 일정 문장에서 Intent, 제목, 상대 날짜와 시간을 추출할 수 있는가?
- 프롬프트 규칙의 구체성이 결과에 얼마나 영향을 주는가?

## 2. 환경

```text
OS: macOS 26.5
Architecture: arm64
Runtime: llama.cpp 0.1.2-dev
llama.cpp build: 10489
llama.cpp commit: 169e4a7ff
Compiler: AppleClang 17
Inference: CPU only
Threads: 4
Context: 2,048 tokens
Reasoning: off
Temperature: 0
```

모델:

```text
Repository: ggml-org/Qwen3.5-0.8B-GGUF
File: Qwen3.5-0.8B-Q4_0.gguf
Quantization: Q4_0
Disk usage: 약 544MiB
SHA-256: 57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf
```

## 3. 공통 입력

```text
내일 오후 3시에 병원 예약 등록해줘
```

기대 의미:

```json
{
  "schema_version": 1,
  "intent": "CREATE_EVENT",
  "confidence": 0.95,
  "arguments": {
    "title": "병원 예약",
    "date_expression": "내일",
    "start_time": "15:00"
  },
  "missing_fields": [],
  "requires_confirmation": true
}
```

`confidence`의 정확한 숫자는 모델 판단이므로 고정 정답으로 보지 않는다. 나머지 의미와 정책 필드는 기대 결과로 사용한다.

## 4. Test A — 단순 지시

System prompt 요약:

```text
일정관리 명령 parser다.
JSON만 출력한다.
허용 Intent는 CREATE_TASK, CREATE_EVENT, UNKNOWN이다.
상대 날짜는 date_expression에 넣는다.
```

실제 결과:

```json
{
  "schema_version": "1.0",
  "intent": "CREATE_TASK",
  "confidence": 0.95,
  "arguments": {
    "date_expression": "2024-01-15",
    "time_expression": "15:00",
    "location": "병원",
    "action": "예약 등록"
  },
  "missing_fields": [],
  "requires_confirmation": false
}
```

판정: 실패

실패 이유:

- 특정 시각의 예약을 `CREATE_TASK`로 잘못 분류했다.
- “내일”을 입력에 존재하지 않는 `2024-01-15`로 바꿨다.
- `schema_version`을 숫자가 아닌 문자열로 반환했다.
- 요구하지 않은 `location`, `action` 필드를 생성했다.
- 생성 명령인데 `requires_confirmation`을 `false`로 반환했다.

성능:

```text
Prompt processing: 628.5 tokens/s
Generation: 100.0 tokens/s
Wall time: 8.72s
Maximum resident set size: 1,365,000,192 bytes, 약 1.27GiB
Swaps: 0
```

첫 실행의 wall time에는 초기 파일 로딩과 page cache 상태가 영향을 주었을 수 있다.

## 5. Test B — 규칙과 예시 강화

추가한 규칙:

- 특정 날짜와 시각의 약속·회의·예약은 `CREATE_EVENT`
- 수행하거나 완료할 업무는 `CREATE_TASK`
- 상대 날짜는 실제 날짜로 변환하지 않고 원문 그대로 보존
- 모든 생성은 사용자 확인 필요
- 허용 output key 명시
- 올바른 Event 변환 예시 제공

실제 결과:

```json
{
  "schema_version": 1,
  "intent": "CREATE_EVENT",
  "confidence": 0.95,
  "arguments": {
    "title": "병원 예약",
    "date_expression": "내일",
    "start_time": "15:00"
  },
  "missing_fields": [],
  "requires_confirmation": true
}
```

판정: 성공

성공한 항목:

- Event Intent 분류
- 제목 추출
- 상대 날짜 원문 보존
- 한국어 오후 시각을 24시간 형식으로 변환
- 숫자 schema version
- 사용자 확인 정책
- JSON 이외 설명을 생성하지 않음

성능:

```text
Prompt processing: 665.8 tokens/s
Generation: 98.2 tokens/s
Wall time: 1.55s
Maximum resident set size: 1,373,159,424 bytes, 약 1.28GiB
Swaps: 0
```

두 번째 실행은 OS page cache가 적용된 warm 상태일 가능성이 높다. 첫 번째와 두 번째 wall time 차이를 프롬프트 품질의 효과로 해석하면 안 된다.

## 6. 결론

### 실행 가능성

Qwen3.5-0.8B Q4_0은 CPU 4 thread에서 약 98~100 tokens/s의 생성 속도를 보였다. 모델 process 최대 RSS는 약 1.28GiB였고 swap은 발생하지 않았다. 이번 단일 process 실험만 보면 8GB RAM 환경에서 실행 가능성이 충분하다.

다만 최종 제품 판단에는 React/Tauri UI, Rust Core, SQLite, OS background process와 모델을 함께 실행한 전체 메모리 측정이 필요하다.

### 의미 정확도

0.8B 모델은 단순한 역할 설명만으로 안정적인 일정 parser가 되지 않았다. 분류 규칙과 올바른 예시를 제공했을 때 동일 입력을 정확히 처리했다.

따라서 다음 항목이 필수다.

- Intent별 명시적 판정 규칙
- few-shot 예시
- JSON Schema 또는 grammar constrained generation
- DateResolver에 의한 상대 날짜 결정
- allowlist와 Domain validation
- 변경 Preview와 사용자 확인

### 아직 증명되지 않은 것

이번 성공 사례 하나만으로 다음을 판단할 수 없다.

- 다양한 한국어 표현에 대한 정확도
- 수정·삭제·검색 Intent 정확도
- 여러 일정 중 대상 선택 능력
- 모호한 명령에서 추측하지 않는 능력
- 장시간 process 재사용 안정성
- 실제 8GB 시스템 전체에서의 peak memory
- Windows와 x86 CPU 성능

## 7. 다음 실험 제안

1. 최소 50개의 한국어 평가 문장을 만든다.
2. CREATE_TASK와 CREATE_EVENT를 먼저 분리 평가한다.
3. 모호한 날짜, 누락된 시간, 중복된 대상 사례를 포함한다.
4. JSON Schema를 적용해 형식 오류를 차단한다.
5. Q4_0과 Q8_0의 정확도·메모리를 비교한다.
6. 필요하면 Qwen3-1.7B 등 상위 모델과 의미 정확도를 비교한다.
7. 합격 기준을 정한 뒤 UI Preview와 연결한다.
