# 2026-08-18 · Qwen3.5-0.8B · JSON Run 001

이 폴더는 Qwen3.5-0.8B Q4_0으로 실행한 첫 번째 다중 JSON 구조 테스트를 독립적으로 보관한다.

## Run ID

```text
2026-08-18-qwen35-08b-json-001
```

## 실행 정보

| 항목 | 값 |
|---|---|
| 실행일 | 2026-08-18 |
| 모델 | Qwen3.5-0.8B Q4_0 |
| Runtime | llama.cpp b10489-169e4a7ff |
| 장치 | CPU only |
| CPU thread | 4 |
| Context | 2,048 tokens |
| 출력 상한 | 180 tokens |
| Temperature | 0 |
| Reasoning | off |
| 사례 수 | 5 |

## 파일

- [test-cases.json](test-cases.json): 입력과 기대 결과
- [results.json](results.json): 실제 모델 출력, 측정값과 판정
- [report.md](report.md): 사람이 읽는 상세 분석

## 결과 요약

```text
Process 정상 종료: 5/5
JSON parsing: 5/5
최상위 구조: 5/5
의미 정확성: 2/5
```

이 결과는 다른 run의 파일과 합치거나 덮어쓰지 않는다. 같은 모델과 설정으로 다시 실행해도 새 Run ID를 사용한다.
