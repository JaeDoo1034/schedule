# My Planner — Phase 1 설계

## A. Home 레이아웃

- 고정 Sidebar 232px + 유동 Main Content. Main은 최대 1400px이다.
- Header 아래 4열 Metric Summary, 본문은 `오늘 업무/우선 확인`, `프로젝트/일정`의 2열 그리드다.
- AI Command는 본문 전체 폭의 하단 카드다. 1100px 이하에서는 요약 2열, 본문 1열로 재배치한다.

## B. Component Tree

```text
App
└ AppShell
  ├ Sidebar
  └ HomePage
    ├ Header / Metric
    ├ TodayTask
    ├ PriorityPreview
    ├ ProjectProgressPreview
    ├ TodaySchedule
    ├ AICommandBar / AIChangePreview
    ├ TaskDrawer
    └ NewTaskModal
```

## C. UI State

- App: route, tasks, search query
- HomePage: selected task, new-task modal, toast
- AICommandBar: 자연어 명령, 변경 Preview 표시 상태
- 완료 상태와 progress는 하나의 Task collection에서 함께 갱신한다.

## D. Data Model

`src/types.ts`에 Project, Task, PlannerEvent를 분리했다. `PlannerRepository`는 현재 in-memory 구현이며, 향후 Tauri IPC repository로 교체한다. Task는 기간, Event는 특정 시각을 나타낸다.

## E. Interaction

- Sidebar: route 변경, 미구현 화면은 placeholder 표시
- Checkbox: 완료/미완료 및 Metric 동시 갱신
- Search: Task 제목과 Project 제목 필터
- Task/Priority item: 공통 상세 Drawer
- 새 작업: Modal에서 Task 생성
- AI Command: dummy parsing → 변경 Preview → 취소/적용
- Project/Gantt/Calendar 링크: 미래 route placeholder 이동

## F. 확장 포인트

- Priority는 Task importance/urgency를 quadrant drop 결과로 갱신한다.
- Timeline은 Project/Task의 startDate, endDate, parentId를 그대로 사용한다.
- Calendar는 Task 기간과 PlannerEvent 시각을 서로 다른 presentation으로 렌더링한다.
- Repository 구현만 교체해 Markdown source-of-truth, SQLite cache, Tauri IPC를 연결한다.
- AI parser는 UI에 직접 쓰지 않고 structured command를 preview한 뒤 application service가 반영한다.
