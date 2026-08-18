# My Planner Local LLM

이 폴더는 My Planner에서 Local LLM을 실제로 실행하고 검증한 기록과 재현 가능한 사용 방법을 관리한다.

설계 원칙과 제약은 `work_concept/`와 `Constraint/`에서 관리하고, 이 폴더에는 다음과 같은 실행 중심 자료를 둔다.

- `llama.cpp` 설치 및 사용 방법
- 모델 다운로드와 보관 방법
- 프롬프트와 구조화 출력 실험
- CPU 속도와 메모리 측정 결과
- 모델별 성공·실패 사례
- 앱에 연결하기 전에 확인해야 할 기술적 결론

## 폴더 구조

```text
LLM/
├ LOCAL_LLM_OVERVIEW.md
├ 01-llama-cpp-guide/
├ 02-test-runs/
├ 03-test-case-design/
└ 04-references/
```

1. [01-llama-cpp-guide/](01-llama-cpp-guide/README.md): `llama.cpp` 설치, 터미널 사용과 공통 실행 방법
2. [02-test-runs/](02-test-runs/README.md): 날짜·모델·목적별로 분리한 실제 테스트 실행 내역
3. [03-test-case-design/](03-test-case-design/README.md): 테스트 문장, 기대값, 판정 기준과 지표 설계 방법
4. [04-references/](04-references/REFERENCE_OVERVIEW.md): Local LLM 현상을 해석하는 논문과 연구 근거

## 문서 분류 기준

```text
llama.cpp를 어떻게 실행하는가?
└─ 01-llama-cpp-guide/

실제로 언제, 어떤 모델로, 무엇을 실행했고 결과가 어땠는가?
└─ 02-test-runs/

어떤 테스트를 만들고 어떻게 합격 여부를 판단하는가?
└─ 03-test-case-design/

실험 결과를 어떤 논문과 연구 개념으로 해석하는가?
└─ 04-references/
```

## 현재 상태

- Runtime: `llama.cpp`
- Model: `Qwen3.5-0.8B Q4_0`
- Model size: 약 544MiB
- Execution: CPU only, 4 threads
- Context: 2,048 tokens
- 첫 결론: 실행 성능은 충분하지만 작은 모델은 프롬프트 규칙과 예시가 약하면 의미 오류를 낼 수 있다.

모델 파일은 용량이 크므로 Git에 커밋하지 않는다. 저장소 루트의 `.gitignore`에서 `**/*.gguf`를 제외하고 있다.
