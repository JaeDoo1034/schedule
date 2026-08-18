# 2026-08-18 · Qwen3.5-0.8B · Smoke Run 001

Qwen3.5-0.8B Q4_0을 처음 다운로드한 뒤 CPU에서 단일 일정 명령을 실행한 smoke test다.

## Run ID

```text
2026-08-18-qwen35-08b-smoke-001
```

## 목적

- 모델 파일이 정상적으로 로드되는지 확인
- CPU 전용 추론이 가능한지 확인
- 첫 한국어 일정 명령의 JSON 결과 확인
- 단순 prompt와 강화 prompt의 차이 확인
- 생성 속도와 최대 메모리 측정

## 파일

- [report.md](report.md): 두 차례 실행 결과와 분석

이 Run은 초기 smoke test이므로 별도 `test-cases.json`과 `results.json`을 만들기 전에 수행되었다. 이후 정형화된 테스트는 각 Run에 입력과 결과 JSON을 함께 보관한다.

