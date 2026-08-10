# LLM, 보안, 성능과 운영 품질

## Local LLM

LLM은 `llama.cpp + GGUF Q4 + 0.5B~1.5B` sidecar이며 stdin/stdout 기반 단일 요청 큐를 우선한다. localhost HTTP server는 추가 공격면과 포트 관리가 생기므로 사용하지 않는다.

권장 수명 전략은 hybrid on-demand다.

1. 첫 AI 명령 때 process와 model을 load한다.
2. 반복 명령은 동일 process에서 처리한다.
3. 5~10분 유휴, memory pressure, Workspace 종료 시 process를 종료한다.

매 요청 실행은 RAM은 절약하지만 model load가 느리고, 앱 시작부터 상주하면 AI를 쓰지 않아도 메모리를 점유한다. Hybrid가 8GB 환경에 적합하다.

지원 Intent:

```text
CREATE_TASK · UPDATE_TASK · DELETE_TASK · COMPLETE_TASK
CREATE_EVENT · UPDATE_EVENT · DELETE_EVENT
CREATE_PROJECT · UPDATE_PROJECT
QUERY_TASK · QUERY_SCHEDULE · QUERY_PROJECT · UNKNOWN
```

```json
{
  "schema_version": 1,
  "intent": "CREATE_EVENT",
  "confidence": 0.86,
  "arguments": {
    "title": "병원 예약",
    "date_expression": "다음주 화요일",
    "time": "15:00"
  },
  "missing_fields": [],
  "requires_confirmation": true
}
```

Grammar 또는 JSON Schema constrained generation 후 Core가 schema와 allowlist를 다시 검증한다. 상대 날짜는 DateResolver가 Workspace timezone과 기준일로 계산한다. LLM에는 logical ID만 전달하며 Workspace path, 파일/DB/OS 권한을 주지 않는다. 결과는 항상 Preview와 사용자 확인을 거친다.

## 성능과 메모리

- Startup은 manifest와 SQLite health만 확인하고 전체 scan을 피한다.
- mtime/size/hash가 바뀐 파일만 증분 색인한다.
- Calendar는 표시 범위, Gantt는 선택 Project, Priority는 active Task만 query한다.
- 검색은 SQLite와 cursor pagination을 사용한다.
- Watcher는 event batch/debounce, Gantt는 row virtualization을 사용한다.
- LLM은 단일 inference queue, timeout/cancel, context 상한을 둔다.

주요 병목은 model load/inference, 대량 Markdown 초기 parsing, cloud-sync event 폭주, Gantt 대량 렌더링이다.

| 항목 | 초기 목표 |
|---|---|
| UI Shell | 앱 실행 후 1초 내 표시 |
| 정상 Workspace | 2초 내 최근 index 표시 |
| 일반 검색 | 200ms 내 첫 결과 |
| 월 Calendar query | 100ms 내 Core 응답 |
| 단일 외부 변경 | 1초 내 UI 반영 |
| warm LLM | 기본 timeout 30초 이내 |

## 오류와 복구

| 상황 | 처리 |
|---|---|
| Workspace 없음 | 선택 화면과 최근 경로 복구 안내 |
| Markdown parse 실패 | 기존 index 유지, 파일 진단 표시 |
| File write 실패 | 원본 유지, recovery temp 보존 |
| SQLite lock | 짧은 backoff와 cached read |
| SQLite corruption | DB 격리 후 Markdown에서 rebuild |
| LLM 실패 | AI만 비활성화, 수동 기능 유지 |
| Timeout/Invalid JSON | 실행 금지, process 1회 재시작 |
| Date parse 실패 | Preview에 미확정 필드 표시 |
| 외부 충돌 | 덮어쓰기 금지, 양쪽 버전 보존 |

로그는 OS App Data의 `logs/`에 rolling 방식으로 두고 type, error code, duration만 기본 기록한다. Task 내용, 자연어 명령, 파일 본문은 기본 로그에 남기지 않는다.

## Security

- Tauri allowlist와 canonical path 검증으로 Workspace/model path만 허용한다.
- `..`, symlink/junction을 통한 Workspace 탈출을 차단한다.
- Frontend와 LLM에는 절대 경로를 노출하지 않는다.
- Sidecar binary/model checksum과 실행 경로를 확인한다.
- Markdown과 LLM output은 모두 신뢰하지 않는 입력으로 취급한다.

## Testing

- Unit: DateResolver, Domain validation, priority mapping, JSON validation
- Parser golden: 정상, 수동 편집, unknown field, 이전 schema, 깨진 YAML
- Repository: atomic write, rename failure, version conflict, recovery
- Index: incremental update, delete, rebuild, corruption, query boundary
- Watcher: event burst, self-write suppression, rename, cloud-sync pattern
- Service/IPC: CRUD와 DTO/error serialization
- LLM adapter: timeout, malformed JSON, UNKNOWN, process crash
- E2E: Workspace 선택 → 저장 → 재실행 → 외부 편집 반영
