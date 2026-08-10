# Domain과 저장소 설계

## 1. Domain Model

```text
Workspace
├ Project
│  ├ Milestone (optional in MVP)
│  └ Task
│     └ SubTask (Task.parent_id)
└ Event ── optional related_task_id / project_id
```

공통 ID는 시간 정렬, 충돌 회피, 수동 병합 편의를 위해 ULID를 사용한다. 제목이나 파일명이 바뀌어도 ID는 유지된다.

### Project

`id, title, description, start_date, end_date, progress, status, color, created_at, updated_at, version`

### Task

`id, title, description, project_id?, milestone_id?, parent_id?, start_date?, end_date?, due_date?, importance, urgency, progress, status, tags[], created_at, updated_at, version`

### Event

`id, title, date, start_time, end_time?, description, related_task_id?, project_id?, created_at, updated_at, version`

Task는 수행·완료 대상이며 기간과 진행률을 가진다. Event는 특정 날짜/시간에 존재하며 완료율을 갖지 않는다. Calendar에서 함께 표시해도 Entity는 합치지 않는다.

## 2. 권장 Workspace 구조

```text
MyPlanner/
├ README.md
├ projects/
│  └ 01K2...-customer-analysis.md
├ tasks/
│  ├ active/
│  │  └ 01K3...-report.md
│  └ archived/
├ events/
│  └ 2026/
│     └ 08/
│        └ 01K4...-team-meeting.md
├ journal/
│  └ 2026/
│     └ 2026-08-14.md
├ attachments/
└ .planner/
   ├ workspace.json
   ├ index.db
   ├ cache/
   └ recovery/
```

권장안은 Entity 파일을 정규 원본으로 두고 Journal은 메모와 Entity 링크를 담는 혼합 방식이다. 하루 파일 하나에 모든 업무를 넣으면 사람이 읽기 쉽지만, 여러 날짜에 걸친 Task의 소유 위치가 모호하고 한 파일의 충돌 범위가 커진다. Entity 파일은 파일 수가 늘지만 ID·관계·부분 갱신·Git merge가 안정적이다.

## 3. Markdown 형식

Project, Task, Event의 안정적인 필드는 YAML Frontmatter에, 장문 설명과 사람이 쓰는 메모는 본문에 둔다. 알려지지 않은 Frontmatter 필드는 round-trip 시 보존한다.

```markdown
---
schema_version: 1
entity: task
id: 01K3Q0J6S7B7Q3M4Z0J8PX1F5A
title: 보고서 작성
project_id: 01K2ZX...
parent_id: null
start_date: 2026-08-14
end_date: 2026-08-18
due_date: 2026-08-18
importance: high
urgency: high
progress: 30
status: in_progress
tags: [report]
version: 4
created_at: 2026-08-10T09:00:00+09:00
updated_at: 2026-08-14T11:20:00+09:00
---

# 보고서 작성

고객 분석 결과를 정리한다.

## Notes

- 시각화 결과 재검토
```

```markdown
---
schema_version: 1
entity: event
id: 01K4...
title: 팀 회의
date: 2026-08-14
start_time: "15:00"
end_time: "16:00"
project_id: 01K2ZX...
related_task_id: null
version: 1
---

# 팀 회의

신규 로그 구조 논의
```

`.planner/workspace.json`은 `name`, `timezone`, `weekStartsOn`, `schemaVersion`, `workspaceId`를 저장한다. Theme, 창 크기, 최근 Workspace, LLM 모델 경로는 OS App Data의 App Settings에 저장해 Workspace 설정과 분리한다.

## 4. SQLite Index Schema

SQLite는 원본이 아니라 projection이다. 모든 row에 `source_path`, `source_hash`, `source_mtime`, `schema_version`, `indexed_at`를 둬 증분 재색인을 지원한다.

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  start_date TEXT, end_date TEXT, progress INTEGER NOT NULL,
  status TEXT NOT NULL, color TEXT, version INTEGER NOT NULL,
  source_path TEXT NOT NULL UNIQUE, source_hash TEXT NOT NULL,
  source_mtime INTEGER NOT NULL, indexed_at TEXT NOT NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  project_id TEXT, milestone_id TEXT, parent_id TEXT,
  start_date TEXT, end_date TEXT, due_date TEXT,
  importance TEXT NOT NULL, urgency TEXT NOT NULL,
  progress INTEGER NOT NULL, status TEXT NOT NULL,
  version INTEGER NOT NULL, source_path TEXT NOT NULL UNIQUE,
  source_hash TEXT NOT NULL, source_mtime INTEGER NOT NULL,
  indexed_at TEXT NOT NULL
);

CREATE TABLE events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT,
  related_task_id TEXT, project_id TEXT, version INTEGER NOT NULL,
  source_path TEXT NOT NULL UNIQUE, source_hash TEXT NOT NULL,
  source_mtime INTEGER NOT NULL, indexed_at TEXT NOT NULL
);

CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL);
CREATE TABLE task_tags (task_id TEXT, tag_id INTEGER, PRIMARY KEY(task_id, tag_id));
CREATE TABLE index_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE parse_errors (source_path TEXT PRIMARY KEY, message TEXT, detected_at TEXT);
```

필수 Index는 `tasks(status, importance, urgency)`, `tasks(project_id, start_date, end_date)`, `events(date, start_time)`, `tasks(due_date)`다. 검색 규모가 커지면 FTS5 가상 테이블을 추가한다. Foreign key는 잘못된 수동 편집 때문에 전체 색인이 중단되지 않도록 projection 단계에서 soft reference로 취급하고 진단 경고를 남긴다.

## 5. 파일 동기화와 무결성

- Watcher event는 250~500ms debounce 후 path별로 합친다.
- `.planner`, 임시 파일, 앱 자체 write token은 감시 대상에서 제외하거나 self-event로 판별한다.
- `mtime + size`로 빠르게 거르고, 실제 변경은 content hash로 확정한다.
- 파싱 성공 시 SQLite transaction으로 해당 파일의 projection을 교체한다.
- 파싱 실패 시 기존 정상 row는 유지하고 `parse_errors`와 UI 경고를 갱신한다.
- 앱 수정은 읽을 때 받은 `version/hash`를 expected value로 보내는 optimistic concurrency를 쓴다.
- 충돌 시 자동 덮어쓰지 않고 “외부 변경 다시 불러오기 / 내 변경을 새 사본에 보존 / 비교”를 제공한다.
- 파일 쓰기는 같은 디렉터리에 temp 생성 → flush/fsync → atomic rename → 디렉터리 sync 순서로 한다.
- 파일 commit 후 index update가 실패하면 파일이 원본이므로 `index_dirty`를 표시하고 해당 파일 재색인을 예약한다.
- SQLite 손상 시 격리 이름으로 이동하고 Markdown full scan으로 새 DB를 만든다.

Schema migration은 parser가 이전 버전을 읽고 최신 Domain으로 올리는 read migration부터 지원한다. 실제 파일 rewrite는 백업과 사용자 확인을 거치는 별도 Workspace migration으로 수행한다.
