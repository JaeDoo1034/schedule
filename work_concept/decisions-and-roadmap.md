# 설계 결정과 MVP 로드맵

## 주요 Trade-off

| 결정 | 비교 | 선택 |
|---|---|---|
| Daily vs Entity Markdown | Daily는 읽기 쉽지만 장기 Task와 충돌에 약함 | Entity 원본 + Daily Journal |
| Markdown vs SQLite 원본 | SQLite 원본은 query가 쉽지만 user-owned 철학 훼손 | Markdown 원본, SQLite projection |
| Persistent vs On-demand LLM | 상주는 빠르지만 RAM 점유, 매번 실행은 느림 | 첫 요청 기동 + 유휴 종료 |
| Rust vs JS Core | JS는 초기 속도, Rust는 파일/SQLite/sidecar에 유리 | UI TS, Core Rust |
| File Watch vs Refresh | Watch는 event 중복, 수동은 외부 변경이 늦음 | Watch 기본 + 수동 복구 수단 |
| One vs Multiple Workspace | Multiple은 감시와 상태 복잡도 증가 | MVP는 한 번에 하나 |
| UUID vs ULID | ULID는 정렬성과 수동 진단성이 좋음 | ULID |
| Milestone | 초기 강제 시 단순 프로젝트도 복잡 | Schema 예약, MVP 기능 생략 |

## MVP 범위

- UI: Shell, Home, Priority, Gantt, Calendar, AI Preview
- Domain: Workspace, Project, Task, Event
- Storage: Markdown + SQLite Index
- Runtime: Tauri
- AI: 제한 Intent의 Local Small LLM parser

Cloud Sync, 계정, 인증 서버, HTTP backend, Docker, Microservice, Remote DB, RAG, 외부 Calendar 연동은 초기 범위가 아니다.

## 구현 순서

1. UI Shell/Home — mock repository 기반 interaction
2. Priority — active Task query와 quadrant update
3. Gantt — hierarchy/read-only bars와 zoom query
4. Calendar — Task range/Event time block 분리
5. Rust Domain/Core — Entity, validation, DateResolver
6. FileRepository — Workspace, parser, atomic CRUD
7. SQLite Index — projection, query, full rebuild
8. FileWatcher — debounce, 외부 편집, conflict
9. Tauri IPC — mock adapter 교체
10. LLM Adapter — sidecar, grammar, timeout
11. AI Preview/Apply — 사용자 확인 경계
12. Integration hardening — crash, corruption, 장기 데이터 시험

각 View는 별도 데이터 복사본을 만들지 않고 동일 Entity ID와 query service를 사용한다.

## 미래 확장

MVP 이후 Recurring Task/Event, Tag/Reminder, Attachment, ICS, Notification, Multiple Workspace, 선택적 Sync 순으로 검토한다. Mobile Companion과 RAG는 동기화·권한 모델 확정 전에는 추가하지 않는다.
