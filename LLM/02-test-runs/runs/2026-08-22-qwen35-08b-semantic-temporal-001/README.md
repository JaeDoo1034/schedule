# Qwen3.5 0.8B Semantic Temporal Test 001

`오늘`, `내일` 같은 상대 날짜를 SLM이 직접 계산하지 않고, YAML Semantic Layer와 결정적 Tool이 처리하는 구조를 검증한 Run이다.

## 핵심 결과

- SLM 단독 Semantic Parse 계약 완전 충족: 0/6
- YAML 기반 `resolve_relative_date` 날짜 처리: 6/6
- 결론: 상대 날짜의 의미와 실제 날짜 계산은 SLM이 아니라 Application Core가 소유해야 한다.

상세 내용은 [report.md](./report.md), 기계 판독 결과는 [results.json](./results.json)을 참고한다.

## 재실행

```bash
ruby DEV/experiments/local-llm/semantic-layer/test_date_resolver.rb
```
