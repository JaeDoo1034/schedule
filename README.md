# My Planner

CPU 기반 Local LLM의 도움을 받아 일정과 업무를 관리하는 Local-first 데스크톱 애플리케이션 프로젝트다.

사용자는 일반 일정관리 UI에서 Project, Task와 Event를 직접 관리할 수 있고, 자연어로 요청해 Local LLM이 일정 명령을 구조화하도록 할 수도 있다.

```text
직접 입력: Form · Home · Priority · Gantt · Calendar
자연어 입력: 사용자 문장 → Local LLM Intent → 검증 → Preview → 사용자 확인 → 저장
```

## 제품 목표

My Planner는 인터넷, 계정과 원격 AI API를 필수로 요구하지 않는 개인용 일정관리 프로그램을 목표로 한다.

핵심 목표:

- CPU만으로 Local LLM 추론 가능
- 약 4~8GB RAM 환경을 고려한 경량 실행
- GPU가 없어도 핵심 기능과 AI 명령 사용 가능
- Markdown 형식으로 사용자가 직접 소유하는 일정 데이터
- AI가 없어도 완전히 사용할 수 있는 수동 일정관리 UI
- 자연어를 이용한 Task, Event, Project 생성·수정·조회
- AI 결과를 바로 실행하지 않는 Preview와 사용자 확인 절차
- 외부 편집, 충돌, index 손상과 process 실패에 대한 복구 가능성

## 제품이 동작하는 방식

### 일반 UI 입력

사용자는 Home, Priority, Gantt, Calendar와 상세 화면을 통해 일정을 직접 관리한다.

```text
사용자 입력
→ UI Validation
→ Tauri IPC
→ Rust Core Validation
→ Domain Operation
→ Markdown Atomic Commit
→ SQLite Projection
→ UI Refresh
```

### 자연어 입력

Local LLM은 사용자의 문장을 실제 저장 명령으로 직접 실행하지 않는다. 제한된 Intent와 arguments를 추출하는 parser 역할만 담당한다.

```text
사용자 자연어
→ Local LLM 구조화 JSON
→ Schema와 Allowlist 검증
→ DateResolver와 대상 조회
→ Domain Dry-run
→ 변경 Preview
→ 사용자 확인
→ Version 재검증
→ Markdown과 Index 반영
```

예상 출력 형태:

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

상대 날짜 계산, 대상 식별, 중복 검사, 실제 저장과 충돌 처리는 일반 프로그램 로직이 담당한다.

## 핵심 설계 원칙

- Local-first / Offline-first
- 단일 사용자, 단일 Workspace 우선
- Markdown이 Source of Truth
- SQLite는 삭제 후 재생성 가능한 Index/Cache
- React UI와 Rust Core의 책임 분리
- Task와 Event Domain 분리
- UI, Domain, Storage, File System과 LLM 경계 분리
- File commit 성공을 원본 변경 성공 기준으로 사용
- LLM output과 외부 Markdown을 신뢰하지 않는 입력으로 취급
- 생성·수정·삭제는 사용자 확인 없이 적용하지 않음

## 기술 구성

```text
React / TypeScript Desktop UI
  Home · Priority · Gantt · Calendar · AI Preview
                    │
             Typed Tauri IPC
                    │
Rust Local Application Core
  Workspace · Project · Task · Event · Schedule
  DateResolver · Search · Validation · Transaction Coordinator
        │                    │                    │
 FileRepository        IndexRepository        LLMAdapter
        │                    │                    │
 Markdown Workspace      SQLite Cache      llama.cpp Sidecar
```

예정 기술:

- UI: React, TypeScript, Vite
- Desktop runtime: Tauri
- Core: Rust
- 원본 저장소: Markdown + YAML Frontmatter
- 조회용 index: SQLite, 향후 FTS5
- Local LLM runtime: `llama.cpp`
- Local model format: GGUF quantized model

## Domain 개요

```text
Workspace
├ Project
│  ├ Milestone, MVP에서는 선택적
│  └ Task
│     └ SubTask, Task.parent_id 사용
└ Event, optional related_task_id / project_id
```

- Project: 여러 Task를 묶는 작업 단위
- Task: 수행·진행·완료 대상이며 기간, 마감과 진행률을 가질 수 있음
- Event: 특정 날짜와 시간에 존재하는 일정
- SubTask: 별도 Entity가 아니라 Task의 parent 관계로 표현
- Milestone: Schema에는 예약하지만 초기 MVP에서 필수로 강제하지 않음

모든 Entity는 제목이나 파일명이 바뀌어도 유지되는 ULID를 사용한다.

## 데이터 저장 방식

사용자가 선택한 Workspace의 권장 구조:

```text
MyPlanner/
├ projects/
├ tasks/
│  ├ active/
│  └ archived/
├ events/
├ journal/
├ attachments/
└ .planner/
   ├ workspace.json
   ├ index.db
   ├ cache/
   └ recovery/
```

Project, Task와 Event는 개별 Markdown 파일을 원본으로 사용한다. 안정적인 필드는 YAML Frontmatter에, 장문 설명과 메모는 Markdown 본문에 둔다.

SQLite row에는 원본 파일 경로, hash, 수정 시간과 schema version을 기록한다. Index가 실패하거나 손상돼도 Markdown 전체 scan으로 재생성할 수 있어야 한다.

## Local LLM 실행 현황

현재 첫 Local LLM 후보를 다운로드하고 CPU 전용 실행과 JSON 테스트를 완료했다.

```text
Runtime: llama.cpp
Model: Qwen3.5-0.8B Q4_0
Model file: 약 544MiB
Inference: CPU only
Threads: 4
Context: 2,048 tokens
Generation: 약 98~100 tokens/s
Maximum model process RSS: 약 1.28GiB
```

현재까지의 결론:

- 8GB RAM을 가정한 CPU 환경에서 실행 가능성은 충분함
- 강화된 단일 예시에서는 원하는 Event JSON 생성에 성공
- 5개 다중 테스트에서 JSON parsing과 최상위 구조는 5/5 통과
- 같은 테스트에서 의미 정확성은 2/5 통과
- 작은 모델이 system prompt 예시의 제목·요일·시각을 입력에 없는데도 복사하는 현상 확인
- 모델이 반환하는 confidence는 실제 정확도를 반영하지 않았음

따라서 현재 모델은 사용자 확인 없는 자동 등록에 사용할 수 없다. Prompt 개선, JSON Schema, 입력 근거 검증, Domain validation과 더 큰 모델 비교가 필요하다.

자세한 내용은 [Local LLM 영역 안내](LLM/LOCAL_LLM_OVERVIEW.md)에서 확인한다.

## 현재 개발 상태

### 완료 또는 진행된 항목

- 제품 원칙과 시스템 아키텍처 설계
- Domain과 Markdown/SQLite 저장 방식 설계
- 사용자 여정과 Domain operation workflow 설계
- AI Command의 parse, preview, confirm, apply 경계 설계
- 외부 파일 동기화, 충돌과 장애 복구 설계
- React/TypeScript 기반 Phase 1 Home 목업
- Sidebar, Metric, 오늘 업무, 우선 확인, 프로젝트와 일정 UI
- 검색, 완료 체크, Task Drawer와 새 작업 Modal 목업
- 자연어 명령 Preview와 적용 UI 목업
- Qwen3.5-0.8B Local LLM CPU 실행
- JSON 구조 및 의미 정확성 초기 테스트
- 반복 테스트 Run 폴더와 테스트 케이스 설계 기준

### 아직 구현되지 않은 주요 항목

- Priority 실제 화면
- Gantt 실제 화면
- Calendar 실제 화면
- Project, Inbox, Completed, Archive와 Settings 화면
- Tauri 앱 구성
- Rust Domain/Core
- Markdown FileRepository
- SQLite IndexRepository
- FileWatcher와 충돌 UI
- 실제 LLMAdapter와 UI 연결
- JSON Schema/Grammar constrained generation
- 50개 이상 한국어 평가 문장 기반 모델 비교

## 개발 로드맵

1. UI Shell과 Home 목업
2. Priority 화면과 quadrant 변경
3. Gantt hierarchy와 read-only bar
4. Calendar의 Task range와 Event time block
5. Rust Domain, validation과 DateResolver
6. Markdown parser와 atomic FileRepository
7. SQLite projection, query와 rebuild
8. FileWatcher, 외부 수정과 conflict
9. Tauri IPC와 mock repository 교체
10. Local LLM benchmark와 모델 선정
11. LLMAdapter, AI Preview와 Apply 연결
12. Crash, corruption, 장기 데이터와 저사양 통합 시험

## 저장소 폴더 안내

```text
schedule/
├ README.md          # 프로젝트 전체 안내, 현재 문서
├ FOLDER_GUIDE.md    # 문서를 어디에 배치할지 결정하는 기준
├ DEV/               # 실제 애플리케이션 코드와 코드 직접 관련 문서
├ work_concept/      # 시스템 구조, Domain, 저장소와 기술적 결정
├ workflow/          # 사용자 행동과 시스템 처리 순서
├ Constraint/        # 설계와 구현이 반드시 지켜야 할 제약
└ LLM/               # llama.cpp 사용, 모델 테스트와 테스트 설계
```

상세 분류 기준은 [FOLDER_GUIDE.md](FOLDER_GUIDE.md)를 따른다.

## 주요 문서

### 시스템 설계

- [시스템 설계 개요](work_concept/SYSTEM_DESIGN.md)
- [전체 아키텍처](work_concept/architecture.md)
- [Domain과 저장소](work_concept/domain-and-storage.md)
- [LLM·보안·성능](work_concept/llm-security-performance.md)
- [설계 결정과 로드맵](work_concept/decisions-and-roadmap.md)

### Workflow

- [Workflow 개요](workflow/WORKFLOW_OVERVIEW.md)
- [사용자 여정](workflow/user-journeys.md)
- [Domain operation](workflow/domain-operations.md)
- [AI Command](workflow/ai-command.md)
- [동기화와 복구](workflow/sync-and-recovery.md)

### 제약사항

- [제품·환경·LLM 제약](Constraint/README.md)

### Local LLM

- [Local LLM 영역 안내](LLM/LOCAL_LLM_OVERVIEW.md)
- [llama.cpp 사용 가이드](LLM/01-llama-cpp-guide/README.md)
- [터미널 사용법](LLM/01-llama-cpp-guide/terminal-usage.md)
- [테스트 실행 내역](LLM/02-test-runs/README.md)
- [테스트 케이스 설계](LLM/03-test-case-design/README.md)
- [Few-shot 예시 복사와 연구 근거](LLM/04-references/few-shot-demonstration-copy-bias.md)
- [Semantic Layer와 Tool Contract](LLM/05-semantic-layer/SEMANTIC_LAYER_OVERVIEW.md)
- [Semantic YAML 작성 Ground Rules](LLM/05-semantic-layer/semantic/SEMANTIC_YAML_GROUND_RULES.md)

## 목업 실행

애플리케이션 코드는 `DEV/`에 있다.

```bash
cd DEV
npm install
npm run dev
```

Vite가 출력한 localhost 주소를 브라우저에서 연다.

현재 저장소에서 받은 `node_modules`가 운영체제 또는 CPU 아키텍처와 맞지 않으면 기존 의존성을 그대로 사용하지 말고 현재 환경에서 `npm install`로 다시 구성한다.

## Local LLM 직접 실행

현재 개발 환경의 `llama.cpp`와 모델 경로를 사용한 CPU 전용 실행 예시:

```bash
cd '/Users/hoduo02gmail.com/Desktop/01 Project/schedule'

'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none \
  -ngl 0 \
  --no-op-offload \
  -t 4 \
  -c 2048 \
  --reasoning off
```

대화 입력 줄에서 `/exit` 또는 `Control + C`로 종료한다. 자세한 설명은 [터미널 사용법](LLM/01-llama-cpp-guide/terminal-usage.md)을 참고한다.

## 초기 MVP 범위 밖

- Cloud Sync
- 사용자 계정과 인증 서버
- 원격 LLM API 의존
- 범용 챗봇
- RAG
- 외부 Calendar 연동
- 여러 Workspace 동시 실행
- GPU 전용 기능

이 기능들은 Local-first, 사용자 소유 데이터와 저사양 실행 조건이 검증된 이후 검토한다.
