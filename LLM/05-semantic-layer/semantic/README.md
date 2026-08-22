# Semantic Concept YAML Guide

이 폴더는 일정관리 자연어를 Application이 이해하는 고정된 의미로 변환하기 위한 Semantic Concept YAML을 관리한다.

YAML을 새로 만들거나 기존 Concept를 확장하기 전에 반드시 [Semantic YAML Ground Rules](./SEMANTIC_YAML_GROUND_RULES.md)를 따른다. 이 문서는 key의 이름, 타입, 책임 경계, 버전 변경, 검증과 테스트 기준을 정의하는 Source Contract다.

## 현재 파일

- [temporal-concepts.yaml](./temporal-concepts.yaml): 상대 날짜 표현과 canonical 값, 날짜 resolver 연결
- [SEMANTIC_YAML_GROUND_RULES.md](./SEMANTIC_YAML_GROUND_RULES.md): 모든 Semantic YAML에 적용되는 전체 작성 규칙

## 반드시 지킬 기준

1. 자연어 표현은 `aliases`, 시스템 내부 의미는 `canonical`로 분리한다.
2. 현재 시각, timezone처럼 실행 시점에 달라지는 값은 YAML에 고정하지 않고 `context`에서 주입 출처를 선언한다.
3. 실제 날짜 계산이나 데이터 변경은 LLM이 아니라 `resolver` 또는 Tool이 수행한다.
4. 하나의 alias는 같은 locale과 scope 안에서 하나의 canonical 의미만 가져야 한다.
5. 새 key를 추가하기 전에 Application consumer, Schema, Tool 명세와 테스트에서 그 key를 처리할 수 있는지 확인한다.
6. 의미나 계약을 바꾸면 `semantic_layer.version`을 올리고 회귀 테스트를 추가한다.

## 변경 순서

```text
요구사항 정의
→ Concept와 canonical 이름 결정
→ alias 및 필요한 context 정의
→ resolver/Tool 계약 연결
→ policy 정의
→ Schema와 Application validator 반영
→ 정상·별칭·경계·거부 테스트 추가
→ 문서와 version 갱신
```

YAML만 수정해서 기능이 완성되는 것은 아니다. YAML은 의미 계약이며, Application validator와 결정적 Tool이 이를 실제로 집행해야 한다.
