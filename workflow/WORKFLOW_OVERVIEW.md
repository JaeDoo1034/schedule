# My Planner Workflow

이 폴더는 설계 개념이 아니라 사용자가 실제로 마주하는 업무 과정과 내부 처리 순서를 설명한다.

## 문서 안내

1. [user-journeys.md](user-journeys.md): 최초 실행부터 앱 종료까지의 사용자 과정
2. [domain-operations.md](domain-operations.md): Task CRUD, Priority, Calendar, Gantt의 시스템 시퀀스
3. [ai-command.md](ai-command.md): 자연어 명령의 parse, preview, confirm, apply 과정
4. [sync-and-recovery.md](sync-and-recovery.md): 외부 파일 변경, 충돌, 색인 재생성, 장애 복구

## 공통 처리 원칙

```text
User Action
→ UI Validation
→ Tauri IPC
→ Core Validation
→ Domain Operation
→ Atomic Markdown Commit
→ SQLite Projection
→ UI Refresh/Event
```

```mermaid
flowchart LR
    A[사용자 행동] --> B[UI 입력 검증]
    B --> C[Tauri IPC]
    C --> D[Core 검증]
    D --> E[Domain Operation]
    E --> F[Atomic Markdown Commit]
    F --> G[SQLite Projection]
    G --> H[UI Refresh / Event]
    G -. 실패 .-> I[Index Dirty 표시]
    I --> J[증분 재색인]
    J --> H
```

Markdown commit이 성공한 시점이 원본 변경의 기준이다. SQLite 반영 실패는 원본 실패가 아니며 재색인으로 복구한다.
