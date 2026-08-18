# My Planner 작업 개념 문서

My Planner는 인터넷과 계정 없이 동작하는 단일 사용자용 데스크톱 생산성 도구다. 동일한 Project·Task·Event 데이터를 Home, Priority, Gantt, Calendar가 서로 다른 관점으로 표현한다.

## 변하지 않는 원칙

- Local-first / Offline-first
- 사용자 소유 데이터와 사람이 읽을 수 있는 Markdown
- Backend·Cloud DB·계정이 필수가 아닌 구조
- Markdown은 Source of Truth, SQLite는 삭제 후 재생성 가능한 Index/Cache
- UI, Domain, Storage, File System, LLM 경계 분리
- LLM은 구조화된 Intent만 반환하며 파일·DB·OS 권한을 갖지 않음
- 8GB RAM, 4 Core CPU, GPU 없음 환경을 우선 지원

## 문서 안내

1. [architecture.md](architecture.md): 전체 구조, 모듈 책임, Tauri IPC, 프로젝트 구조
2. [domain-and-storage.md](domain-and-storage.md): Domain Model, Markdown 형식, SQLite Schema, 동기화
3. [llm-security-performance.md](llm-security-performance.md): Local LLM, 보안, 성능, 장애 복구, 테스트
4. [decisions-and-roadmap.md](decisions-and-roadmap.md): 주요 Trade-off와 MVP 개발 순서

실제 사용자 및 시스템 처리 순서는 `workflow/`에서 관리한다.
