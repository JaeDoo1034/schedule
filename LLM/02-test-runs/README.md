# 02. 테스트 실행 내역

이 폴더는 Local LLM의 반복 테스트를 서로 섞이지 않도록 Run 단위로 보관한다.

각 테스트 실행은 `runs/` 아래에 고유한 폴더를 갖는다. 입력, 실제 출력과 분석 보고서는 반드시 같은 Run 폴더에 저장한다.

## 폴더 구조

```text
LLM/02-test-runs/
├ README.md
└ runs/
   └ YYYY-MM-DD-model-purpose-NNN/
      ├ README.md
      ├ test-cases.json
      ├ results.json
      └ report.md
```

현재 Run:

- [2026-08-22-qwen35-08b-semantic-temporal-001](runs/2026-08-22-qwen35-08b-semantic-temporal-001/README.md): 상대 날짜 SLM 단독(0/6)과 YAML 결정적 처리(6/6) 비교
- [2026-08-18-qwen35-08b-smoke-001](runs/2026-08-18-qwen35-08b-smoke-001/README.md): Qwen3.5-0.8B 최초 CPU smoke test
- [2026-08-18-qwen35-08b-json-001](runs/2026-08-18-qwen35-08b-json-001/README.md): Qwen3.5-0.8B 첫 JSON 구조 테스트

## Run 이름 규칙

```text
YYYY-MM-DD-model-purpose-NNN
```

각 부분의 의미:

- `YYYY-MM-DD`: 테스트를 실행한 날짜
- `model`: 공백 없이 축약한 모델 이름
- `purpose`: 테스트 목적
- `NNN`: 같은 날짜·모델·목적 내의 3자리 순번

예시:

```text
2026-08-18-qwen35-08b-json-001
2026-08-18-qwen35-08b-json-002
2026-08-19-qwen3-17b-intent-001
2026-08-19-qwen35-08b-ambiguity-001
```

같은 조건으로 다시 실행해도 기존 폴더를 덮어쓰지 않고 다음 순번을 사용한다.

## Run에 반드시 포함할 파일

### `README.md`

Run ID, 실행일, 모델, runtime, 주요 옵션과 결과 요약을 기록한다. 폴더를 열었을 때 어떤 테스트인지 즉시 알 수 있어야 한다.

### `test-cases.json`

입력, 기대 Intent, 기대 arguments, 누락되어야 할 필드와 금지된 추측을 기록한다. 실행 전에 확정하는 것이 원칙이다.

### `results.json`

실제 모델 출력, 속도, validation 결과와 실패 이유를 기계가 다시 읽을 수 있는 JSON으로 기록한다.

### `report.md`

전체 통과율, 사례별 분석, 주요 발견과 다음 실험 제안을 사람이 읽기 쉽게 기록한다.

## 판정 구분

- `process`: 모델 process가 오류 없이 종료했는가?
- `json_parse`: 출력이 JSON 객체로 parsing 가능한가?
- `top_level_schema`: 필수 최상위 key와 기본 type이 맞는가?
- `semantic`: Intent와 arguments가 입력 의미에 맞고 없는 정보를 만들지 않았는가?

JSON 문법이 맞는 것과 일정 의미가 정확한 것은 별도로 평가한다.

## 새 Run 추가 절차

1. 기존 Run ID와 겹치지 않는 새 폴더 이름을 결정한다.
2. 실행 전에 `test-cases.json`의 기대값을 작성한다.
3. 모델, prompt, runtime 옵션을 `README.md`에 기록한다.
4. 테스트를 순차 실행한다.
5. 원본 출력을 `results.json`에 저장한다.
6. JSON 구조와 의미 정확성을 별도로 판정한다.
7. `report.md`에 실패 패턴과 다음 실험을 기록한다.
8. 이 문서의 현재 Run 목록에 새 링크를 추가한다.

테스트 케이스를 어떤 기준으로 설계하고 기대값을 정하는지는 [테스트 케이스 설계 가이드](../03-test-case-design/README.md)를 따른다.

## 보존 원칙

- 기존 Run 결과를 새 결과로 덮어쓰지 않는다.
- 실패한 결과도 삭제하지 않는다.
- Prompt나 옵션을 변경하면 새 Run으로 기록한다.
- 모델 파일은 Run 폴더에 복사하지 않고 모델명과 checksum만 기록한다.
- 자동 생성 파일과 사람이 수정한 판정이 섞이지 않도록 필드를 구분한다.
