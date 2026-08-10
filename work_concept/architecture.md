# 시스템 아키텍처

## 1. 전체 구조

```text
React / TypeScript Desktop UI
  Home · Priority · Gantt · Calendar · AI Preview
                    │
             typed Tauri IPC
                    │
Rust Local Application Core
  Workspace · Project · Task · Event · Schedule
  DateResolver · Search · Validation · Transaction Coordinator
        │                    │                    │
 FileRepository        IndexRepository        LLMAdapter
        │                    │                    │
 Markdown Workspace      SQLite Cache      llama.cpp sidecar
```

HTTP 서버는 두지 않는다. React는 렌더링과 상호작용만 담당하고, 파일 경로·Markdown 파싱·날짜 계산·동기화·LLM 실행은 Rust Core가 담당한다.

## 2. 모듈 책임

| 모듈 | 책임 | 하지 않는 일 |
|---|---|---|
| WorkspaceService | 폴더 선택, 초기화, 설정, 경계 검증 | 임의의 외부 경로 탐색 |
| ProjectService | Project 규칙과 조회/변경 | UI 상태 관리 |
| TaskService | Task 생성·수정·완료·계층·우선순위 | 직접 파일 쓰기 |
| EventService | Event 생성·수정·Task 연결 | Task와 Event 혼합 |
| ScheduleService | 날짜 범위별 Task/Event 조합 | 자연어 날짜 해석 |
| DateResolver | timezone 기준 상대 날짜의 결정적 해석 | LLM 추측 수용 |
| FileRepository | 파싱, 직렬화, atomic write, hash/version | Domain 정책 결정 |
| IndexRepository | SQLite projection, query, rebuild | 원본 데이터 소유 |
| SearchService | 검색 조건과 결과 조합, 향후 FTS5 | Markdown 전체 매번 스캔 |
| FileWatcher | 변경 감지, debounce, 재색인 요청 | 직접 Domain 변경 |
| LLMAdapter | sidecar 수명, prompt, grammar, timeout | 파일·DB 변경 |
| Transaction Coordinator | 파일 commit 후 index 반영과 복구 | 분산 트랜잭션 흉내 |

Milestone은 Domain 타입과 파일 필드는 예약하되 MVP UI/서비스에서는 선택 기능으로 둔다. 초기에 강제하면 단순 프로젝트에도 불필요한 계층을 요구한다.

## 3. Tauri IPC Boundary

화면 단위가 아니라 Use Case 단위의 굵은 명령을 제공한다.

```text
workspace_open(path)
workspace_status()
dashboard_get(date)
task_create(input, expected_workspace_version)
task_update(id, patch, expected_entity_version)
task_delete(id, expected_entity_version)
task_complete(id, completed)
priority_query(filter)
priority_move(id, importance, urgency, expected_entity_version)
calendar_query(from, to)
gantt_query(project_id, from, to, zoom)
search(query, filters, cursor)
ai_parse(command, context)
change_apply(validated_change_set)
index_rebuild()
```

응답은 `data`, `revision`, `warnings`를 포함하는 직렬화 가능한 DTO다. Rust 내부 모델이나 파일 경로를 그대로 노출하지 않는다. 오류는 `code`, 안전한 `message`, `recoverable`, `suggested_action`으로 정규화한다.

Core가 UI에 보내는 Event:

```text
workspace://changed
index://progress
index://ready
conflict://detected
llm://state
```

## 4. 권장 코드 구조

```text
DEV/
├ src/
│  ├ app/                 # bootstrap, route, providers
│  ├ pages/               # Home, Priority, Gantt, Calendar
│  ├ features/            # task, project, schedule, ai-command
│  ├ components/          # 공통 presentation
│  ├ domain/              # TS 표시 모델/값 타입
│  └ infrastructure/      # Tauri client, mock adapter
├ src-tauri/src/
│  ├ commands/            # IPC adapter
│  ├ application/         # use cases/services
│  ├ domain/              # entity, value object, policy
│  ├ infrastructure/
│  │  ├ filesystem/
│  │  ├ markdown/
│  │  ├ sqlite/
│  │  ├ watcher/
│  │  └ llm/
│  └ error.rs
└ tests/fixtures/          # workspace/markdown/intent fixtures
```

Domain이 React, Tauri command macro, SQLite row에 의존하지 않도록 한다. 다만 개인용 앱이므로 모든 Service마다 의미 없는 interface를 만들지 않고 FileRepository, IndexRepository, LLMAdapter처럼 실제 교체 경계에만 trait을 둔다.
