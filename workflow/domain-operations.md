# Domain Operation Workflow

## 1. Task 생성

```text
UI Form
→ task_create(input)
→ TaskService validation
→ ULID/version=1 부여
→ Markdown serialize
→ temp write → fsync → atomic rename
→ tasks projection INSERT
→ workspace://changed
→ UI query refresh
```

File commit 후 SQLite가 실패하면 성공한 Markdown은 유지하고 `index_dirty` 상태와 재색인 job을 만든다.

```mermaid
sequenceDiagram
    actor User as 사용자
    participant UI
    participant Core
    participant Task as TaskService
    participant File as Markdown Repository
    participant DB as SQLite Index
    User->>UI: 작업 생성
    UI->>Core: task_create(input)
    Core->>Task: 검증 / ULID / version 1
    Task->>File: Atomic Write
    File-->>Core: Markdown Commit 완료
    Core->>DB: Projection INSERT
    alt Index 성공
        DB-->>UI: Workspace Changed
    else Index 실패
        Core->>Core: Index Dirty / 재색인 예약
        Core-->>UI: 저장 성공 / Index 경고
    end
```

## 2. Task 수정

```text
UI가 task id + expected version 전송
→ 현재 file hash/version 확인
→ 불일치하면 Conflict 반환
→ patch를 Domain에 적용하고 validation
→ version 증가
→ atomic replace
→ index row 교체
→ 관련 Home/Priority/Gantt/Calendar query 무효화
```

날짜 변경은 `start_date ≤ end_date`, parent 변경은 순환 계층 금지, progress 완료는 status 정책과 일치해야 한다.

```mermaid
flowchart TD
    A[Task 수정 요청] --> B[현재 Version / Hash 확인]
    B --> C{Expected Version 일치?}
    C -- 아니오 --> D[Conflict 반환]
    D --> E[비교 / 다시 불러오기 / Patch 재적용]
    C -- 예 --> F[Patch 적용]
    F --> G{Domain Validation 통과?}
    G -- 아니오 --> H[필드 오류 반환]
    G -- 예 --> I[Version 증가]
    I --> J[Markdown Atomic Replace]
    J --> K[SQLite Row 교체]
    K --> L[관련 View Query 무효화]
```

## 3. Task 삭제

MVP 기본은 즉시 영구 삭제보다 Archive 이동이다.

```text
사용자 삭제 요청
→ 연결 Event/SubTask 영향 Preview
→ 사용자 확인
→ tasks/archived로 atomic move + archived status
→ active index에서 제외 또는 row 상태 갱신
→ UI refresh
```

영구 삭제는 Archive에서 별도 확인을 거치며 recovery 보관 정책을 적용한다. 연결 Event는 자동 삭제하지 않고 `related_task_id`를 해제하거나 사용자 선택을 받는다.

```mermaid
flowchart TD
    A[Task 삭제 요청] --> B[연결 Event / SubTask 조회]
    B --> C[영향 범위 Preview]
    C --> D{사용자 확인?}
    D -- 취소 --> E[변경 없음]
    D -- 확인 --> F{연결 Entity 처리 선택}
    F --> G[참조 해제]
    F --> H[하위 항목도 Archive]
    F --> I[삭제 중단]
    G --> J[Task를 Archived로 Atomic Move]
    H --> J
    J --> K[Index 상태 갱신]
    K --> L[UI Refresh]
```

## 4. 완료 상태 변경

```text
Checkbox
→ task_complete(id, completed, expected_version)
→ status/progress 정책 적용
→ atomic file update
→ index update
→ Home metric과 모든 View refresh
```

완료 시 기존 progress를 복원할 필요가 있다면 `previous_progress`는 UI 임시 상태가 아니라 Domain 정책으로 결정한다. MVP는 완료=100, 완료 취소=0 또는 사용자가 지정한 값으로 명시한다.

```mermaid
stateDiagram-v2
    [*] --> Todo
    Todo --> Completed: Checkbox 선택 / progress 100
    InProgress --> Completed: Checkbox 선택 / progress 100
    Completed --> Todo: 완료 취소 / MVP progress 0
    Todo --> InProgress: 진행률 변경
    InProgress --> Todo: 진행률 0
```

## 5. Priority 이동

```text
Q2 Card drag
→ Q1 drop preview
→ priority_move(id, HIGH, HIGH, version)
→ TaskService update
→ file/index commit
→ 사분면과 Home 우선 확인 갱신
```

Drop 위치는 숫자 좌표가 아니라 importance/urgency enum으로 변환해 Core에 보낸다.

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Matrix as Priority UI
    participant Core
    participant Task as TaskService
    participant Store as Markdown / Index
    participant Views as Other Views
    User->>Matrix: Q2 Card를 Q1에 Drop
    Matrix->>Matrix: Q1을 HIGH / HIGH로 변환
    Matrix->>Core: priority_move(id, HIGH, HIGH, version)
    Core->>Task: 속성 변경과 검증
    Task->>Store: File / Index Commit
    Store-->>Matrix: 변경 Event
    Store-->>Views: 동일 Task ID 무효화
```

## 6. Calendar 조회

```text
Month/Week/Day + date range 선택
→ calendar_query(from, to)
→ tasks: start_date <= to AND end_date >= from
→ events: date BETWEEN from AND to
→ ScheduleService가 별도 DTO로 조합
→ Task range와 Event time block 렌더링
```

Task와 Event를 하나의 Entity로 합치지 않고 표시용 union DTO만 사용한다.

```mermaid
sequenceDiagram
    actor User as 사용자
    participant UI as Calendar UI
    participant Core as ScheduleService
    participant DB as SQLite Index
    User->>UI: View와 날짜 범위 선택
    UI->>Core: calendar_query(from, to)
    Core->>DB: 기간이 겹치는 Task 조회
    DB-->>Core: Task Range 목록
    Core->>DB: 범위 내 Event 조회
    DB-->>Core: Event Time 목록
    Core-->>UI: Task / Event Union DTO
    UI-->>User: Range Bar / Time Block
```

## 7. Gantt 조회와 변경

```text
Project/기간/Zoom 선택
→ gantt_query(project_id, from, to, zoom)
→ Project + 해당 기간 Task 계층 조회
→ expand 상태에 맞춰 row virtualization
→ bar와 today line 렌더링
```

향후 bar drag/resize는 먼저 날짜 변경 Preview를 만들고 `task_update`를 호출한다. Milestone과 dependency는 MVP 뒤에 추가한다.

```mermaid
flowchart LR
    A[Project / 기간 / Zoom 선택] --> B[Gantt Query]
    B --> C[Project와 Task 계층 조회]
    C --> D[Expand / Collapse 적용]
    D --> E[Visible Row 계산]
    E --> F[Row Virtualization]
    F --> G[Project / Task Bar 렌더링]
    G --> H[Today Line 표시]
    H -. 향후 .-> I[Bar Drag / Resize Preview]
    I --> J[Task Update]
```

## 8. 검색

```text
사용자 입력
→ 짧은 debounce
→ search(query, filters, cursor)
→ SQLite/FTS index 조회
→ Project/Task/Event 타입별 결과
→ 결과 선택 시 동일 Detail Drawer
```

파일 내용 전체를 매 검색마다 scan하지 않는다.

```mermaid
sequenceDiagram
    actor User as 사용자
    participant UI as Search UI
    participant Service as SearchService
    participant DB as SQLite / FTS
    participant Drawer as Detail Drawer
    User->>UI: 검색어 입력
    UI->>UI: Debounce
    UI->>Service: search(query, filters, cursor)
    Service->>DB: Index Query
    DB-->>Service: 타입별 Page
    Service-->>UI: Project / Task / Event
    User->>UI: 결과 선택
    UI->>Drawer: 동일 Entity ID 열기
```
