# Few-shot 예시 복사와 Demonstration Bias

## 1. 이 문서의 질문

Qwen3.5-0.8B JSON 테스트에서 다음 입력을 사용했다.

```text
다음주에 회의 하나 잡아줘
```

입력에는 구체적인 제목 수식, 요일과 시각이 없었지만 모델은 다음처럼 출력했다.

```json
{
  "title": "팀 회의",
  "date_expression": "다음주 화요일",
  "start_time": "14:00"
}
```

이 값들은 system prompt의 demonstration에 들어 있던 다음 예시와 일치했다.

```text
예시 입력: 다음주 화요일 오후 2시에 팀 회의 잡아줘
예시 출력: title=팀 회의, date_expression=다음주 화요일, start_time=14:00
```

이 현상을 어떻게 이해해야 하는지, 관련 논문에서 어떤 개념을 사용하는지 정리한다.

## 2. 먼저 용어를 구분한다

이 프로젝트에서 대화 중 사용한 “few-shot 오염”은 관찰을 쉽게 설명하기 위한 표현이다. 학계에서 하나의 고정된 단일 용어로 정의된 것은 아니다.

관련 논문에서는 다음 용어를 사용한다.

### In-Context Learning, ICL

모델 가중치를 바꾸지 않고 prompt 안에 입력·출력 demonstration을 제공해 새로운 입력을 처리하게 하는 방식이다. Few-shot prompting은 대표적인 ICL 형태다.

### Copying Bias

새 입력에 맞는 규칙을 일반화하지 않고 prompt의 demonstration answer를 복사하는 경향이다. 이번 테스트에서 `팀 회의`, `화요일`, `14:00`이 그대로 재사용된 현상과 가장 직접적으로 대응한다.

### Demonstration Bias

어떤 demonstration을 선택하고 어떤 순서로 배치했는지에 따라 모델의 task 이해와 성능이 달라지는 더 넓은 개념이다.

### Majority·Recency·Common-token Bias

Demonstration에서 자주 등장하는 answer, prompt 뒤쪽에 가까운 answer 또는 사전학습에서 흔한 token을 더 선호하는 현상이다.

### Order·Position Sensitivity

같은 demonstration을 사용하더라도 순서나 prompt 안의 위치가 바뀌면 예측과 정확도가 크게 달라지는 현상이다.

따라서 이번 현상을 가장 조심스럽게 표현하면 다음과 같다.

> Qwen3.5-0.8B의 단일 Run에서 demonstration의 구체적인 answer 값을 새 입력에 재사용하는 copy-like error가 관찰됐다. 이는 기존 연구의 copying bias와 demonstration bias에 부합하는 사례지만, 한 번의 관찰만으로 모델 내부 원인을 확정한 것은 아니다.

## 3. 가장 직접적인 논문: Copying Bias

### Ali, Wolf, and Titov, 2024

**Mitigating Copy Bias in In-Context Learning through Neuron Pruning**

- Authors: Ameen Ali, Lior Wolf, Ivan Titov
- Year: 2024
- Status: arXiv preprint / OpenReview 공개
- arXiv: <https://arxiv.org/abs/2410.01288>
- OpenReview: <https://openreview.net/forum?id=Hs1UTIOwKr>

이 논문은 ICL에서 모델이 demonstration의 answer를 복사하고 underlying pattern을 일반화하지 못하는 경향을 `copying bias`로 정의한다. 저자들은 synthetic transformation task와 실제 분류·추론 task에서 copying error를 분석했다.

특히 논문은 GPT2-Small, BLOOM-560M과 OPT-1.3B 등 비교적 작은 모델을 포함한 실험에서 전체 오류 중 demonstration answer 복사와 관련된 오류가 큰 비중을 차지할 수 있음을 보고한다. 저자들은 Integrated Gradients로 복사에 관여하는 neuron을 찾고 일부를 pruning하는 완화 방법도 제안한다.

My Planner 관찰과의 연결:

```text
Demonstration answer
title=팀 회의, weekday=화요일, time=14:00
                ↓
새 입력에는 없는 값이 그대로 재사용
                ↓
Copy-like error
```

논문과 이번 실험은 task와 모델이 동일하지 않다. 논문 결과가 Qwen3.5-0.8B의 동일한 내부 neuron mechanism을 직접 증명하는 것은 아니다. 다만 “예시를 일반화하지 않고 answer를 복사하는 오류”라는 행동 수준의 정의는 이번 결과와 매우 가깝다.

## 4. Demonstration이 Format과 Label Space를 가르친다는 연구

### Min et al., EMNLP 2022

**Rethinking the Role of Demonstrations: What Makes In-Context Learning Work?**

- Authors: Sewon Min, Xinxi Lyu, Ari Holtzman, Mikel Artetxe, Mike Lewis, Hannaneh Hajishirzi, Luke Zettlemoyer
- Venue: EMNLP 2022
- DOI: <https://doi.org/10.18653/v1/2022.emnlp-main.759>
- ACL Anthology: <https://aclanthology.org/2022.emnlp-main.759/>

이 논문은 여러 classification과 multiple-choice task에서 demonstration의 정답 label을 무작위로 바꿔도 성능 저하가 예상보다 작을 수 있음을 보고했다. 반대로 demonstration이 제공하는 다음 요소가 중요하다고 분석했다.

- 가능한 label의 공간
- 입력 문장의 분포
- 전체 prompt와 출력의 format

이 연구가 의미하는 것은 모델이 demonstration에서 항상 올바른 추상 규칙만 학습하는 것이 아니라는 점이다. 모델은 예시의 출력 형식, 답변 후보와 표면적인 분포 신호를 강하게 사용할 수 있다.

My Planner 관찰에 대한 해석:

- 긍정적 효과: 단일 예시 덕분에 올바른 JSON key와 format을 빠르게 학습했다.
- 부정적 효과: format뿐 아니라 예시의 구체적인 slot value까지 재사용했다.

Min et al.의 실험은 주로 분류와 객관식 task이므로, 이 논문 하나가 구조화 JSON field 복사를 직접 증명한다고 말할 수는 없다. 하지만 demonstration의 표면 구조와 label space가 강한 신호가 된다는 근거를 제공한다.

## 5. Demonstration의 의미가 여러 방식으로 해석되는 문제

### Li et al., Findings of ACL 2024

**Debiasing In-Context Learning by Instructing LLMs How to Follow Demonstrations**

- Authors: Lvxue Li et al.
- Venue: Findings of ACL 2024
- DOI: <https://doi.org/10.18653/v1/2024.findings-acl.430>
- ACL Anthology: <https://aclanthology.org/2024.findings-acl.430/>

이 논문은 demonstration selection과 ordering에 따라 ICL 성능과 robustness가 달라지는 현상을 `demonstration bias`로 다룬다. 저자들은 주요 원인으로 demonstration이 여러 input-to-label mapping을 암시할 수 있는 semantic ambiguity를 제시한다.

하나의 예시가 다음 두 규칙을 동시에 암시할 수 있다고 생각할 수 있다.

```text
의도한 규칙:
입력에서 실제 제목·날짜·시각을 추출한다.

모델이 잘못 잡을 수 있는 규칙:
회의 요청이면 팀 회의·화요일·14:00 형태로 출력한다.
```

사람에게는 첫 번째 규칙이 명백하지만 작은 모델이 하나의 demonstration만 보고 어느 속성이 고정 template이고 어느 속성이 입력에 따라 달라지는 variable인지 구분하지 못할 수 있다.

Li et al.은 demonstration을 따르는 방식을 자연어 instruction으로 더 명확하게 제공하는 완화 전략을 연구했다. 이는 My Planner prompt에 다음 규칙을 명시해야 한다는 근거가 된다.

```text
예시의 title, date_expression, start_time 값은 복사하지 않는다.
각 값은 현재 사용자 입력에서만 추출한다.
입력에 근거가 없으면 값을 생성하지 않고 missing_fields로 보고한다.
```

## 6. Prompt 뒤쪽 예시와 자주 등장하는 답에 끌리는 현상

### Zhao et al., ICML 2021

**Calibrate Before Use: Improving Few-Shot Performance of Language Models**

- Authors: Tony Z. Zhao, Eric Wallace, Shi Feng, Dan Klein, Sameer Singh
- Venue: ICML 2021
- PMLR: <https://proceedings.mlr.press/v139/zhao21c.html>
- PDF: <https://proceedings.mlr.press/v139/zhao21c/zhao21c.pdf>

이 논문은 few-shot ICL의 불안정성을 분석하며 다음 세 가지 bias를 구분했다.

- Majority label bias: demonstration에서 더 자주 나온 answer를 선호
- Recency bias: prompt 뒤쪽에 가까운 demonstration answer를 선호
- Common token bias: 사전학습에서 흔한 token을 선호

저자들은 prompt format, demonstration 선택과 순서만 바뀌어도 정확도가 크게 변할 수 있다고 보고했으며, content-free input을 이용한 contextual calibration을 제안했다.

My Planner prompt에서는 하나의 demonstration이 system prompt 끝부분에 위치했다. 이 예시는 유일하면서 동시에 사용자 입력 바로 앞에 가까운 구체적인 answer였다. 따라서 예시 값이 과도하게 영향을 준 현상은 recency와 demonstration dominance 관점에서도 해석할 수 있다.

다만 이 논문의 실험은 주로 label prediction이다. `14:00` 같은 구조화 field value 복사를 직접 측정한 논문은 아니므로, 이번 사례와의 연결은 행동적 유사성에 기반한 추론이다.

## 7. 같은 예시도 순서에 따라 성능이 달라진다

### Lu et al., ACL 2022

**Fantastically Ordered Prompts and Where to Find Them: Overcoming Few-Shot Prompt Order Sensitivity**

- Authors: Yao Lu, Max Bartolo, Alastair Moore, Sebastian Riedel, Pontus Stenetorp
- Venue: ACL 2022
- DOI: <https://doi.org/10.18653/v1/2022.acl-long.556>
- ACL Anthology: <https://aclanthology.org/2022.acl-long.556/>

이 논문은 동일한 few-shot example set도 순서를 바꾸면 성능이 near-random 수준에서 높은 수준까지 크게 달라질 수 있음을 보였다. 이 현상은 여러 model size에서 나타났고, 한 모델에서 좋은 순서가 다른 모델에 그대로 전달되지 않았다.

My Planner에 주는 의미:

- 좋은 예시 몇 개를 찾는 것만으로 prompt가 안정적이라고 볼 수 없다.
- 같은 예시를 여러 순서로 배치한 permutation test가 필요하다.
- Qwen3.5-0.8B에서 좋은 순서가 Qwen3-1.7B에도 좋다고 가정하면 안 된다.

## 8. Demonstration 위치와 작은 모델의 민감성

### Cobbina and Zhou, EMNLP 2025

**Where to Show Demos in Your Prompt: A Positional Bias of In-Context Learning**

- Authors: Kwesi Adu Cobbina, Tianyi Zhou
- Venue: EMNLP 2025
- DOI: <https://doi.org/10.18653/v1/2025.emnlp-main.1503>
- ACL Anthology: <https://aclanthology.org/2025.emnlp-main.1503/>

이 논문은 system prompt, demonstration과 user message의 위치를 바꿀 때 예측과 정확도가 달라지는 positional bias를 분석했다. Qwen, Llama, Mistral과 Cohere 계열 모델을 포함한 실험에서 demonstration 위치가 output 안정성에 영향을 주었고, 작은 모델이 더 크게 영향을 받는 경향을 보고했다.

논문에서는 prompt 시작부의 demonstration이 더 안정적인 경우가 있었고, user message 끝부분에 예시를 두면 일부 QA task에서 많은 예측이 바뀌면서 정확도는 개선되지 않았다고 보고했다.

이번에 사용한 0.8B 모델은 매우 작은 편이다. 따라서 demonstration의 위치, 개수와 순서에 대한 민감성을 별도 변수로 시험해야 한다.

## 9. 논문 근거로 설명한 이번 현상

이번 prompt에는 하나의 concrete demonstration만 있었다.

```text
입력: 다음주 화요일 오후 2시에 팀 회의 잡아줘
출력: 팀 회의 / 다음주 화요일 / 14:00
```

모델은 이 demonstration에서 최소한 다음 신호를 받았다.

```text
Task format:
자연어 → JSON

Label/Intent space:
CREATE_EVENT

Output structure:
title, date_expression, start_time

Concrete answer tokens:
팀 회의, 화요일, 14:00
```

새 입력이 불완전했을 때 모델은 근거 없는 field를 비워 두거나 `missing_fields`로 보내는 대신, 가장 강하게 제공된 concrete answer pattern을 재사용했다.

논문들을 종합하면 다음 설명이 가능하다.

1. Demonstration은 올바른 추상 규칙뿐 아니라 format과 answer 분포를 강하게 제공한다.
2. 하나의 예시는 variable과 constant의 경계를 모호하게 만들 수 있다.
3. Prompt의 최근·유일한 answer가 output distribution을 그 값 쪽으로 이동시킬 수 있다.
4. 작은 모델은 demonstration 선택·순서·위치에 더 민감할 수 있다.
5. 그 결과 새 입력에 근거가 없는 demonstration answer를 복사하는 copy-like error가 발생할 수 있다.

이 설명은 관련 연구에 부합하지만, 아직 이번 Qwen Run에 대한 실험적 가설이다. 정확히 확인하려면 controlled ablation이 필요하다.

## 10. 이번 관찰을 검증하는 Controlled Test

동일한 test case를 다음 prompt 조건에서 비교한다.

### A. Zero-shot rules only

Demonstration을 완전히 제거하고 규칙만 제공한다.

목적:

- `팀 회의`, `화요일`, `14:00` 복사가 사라지는지 확인
- 형식 준수율이 함께 떨어지는지 확인

### B. One-shot A

기존 demonstration을 사용한다.

```text
팀 회의 / 화요일 / 14:00
```

### C. One-shot B

값만 완전히 다른 demonstration으로 교체한다.

```text
치과 검진 / 목요일 / 09:30
```

만약 모호한 새 입력의 출력도 B의 값으로 이동하면 copying bias 가설이 강해진다.

### D. Diverse few-shot

서로 다른 제목·요일·시각의 예시를 3개 이상 제공한다.

목적:

- 특정 concrete value의 dominance 감소 여부 확인
- format 안정성과 의미 정확성의 trade-off 확인

### E. Missing-field demonstration

입력에 시간이 없을 때 `start_time`을 생성하지 않고 `missing_fields`에 넣는 예시를 포함한다.

### F. Order permutation

동일한 예시 set의 순서를 바꾸어 실행한다.

### G. Position variation

Demonstration을 system prompt 앞부분, 끝부분과 user message 인접 위치에 각각 둔다.

각 조건을 동일 모델·quantization·temperature·context에서 여러 번 실행한다.

## 11. 측정할 지표

```text
json_parse_rate
schema_pass_rate
intent_accuracy
field_exact_match_rate
hallucinated_field_rate
demonstration_value_copy_rate
missing_field_detection_rate
semantic_pass_rate
```

`demonstration_value_copy_rate`는 다음처럼 정의할 수 있다.

```text
새 입력에는 없고 demonstration answer에만 있는 값이
모델 output에 등장한 test case 수
÷
전체 관련 test case 수
```

제목, 날짜와 시각을 별도로 계산하는 것이 좋다.

## 12. 제품 수준의 완화 전략

### Prompt 단계

- 단일 concrete example에 의존하지 않는다.
- 서로 다른 값의 예시를 균형 있게 사용한다.
- missing-field와 negative example을 포함한다.
- 예시 값은 복사하지 말고 현재 입력의 evidence에서만 추출하도록 명시한다.
- 예시 선택, 순서와 위치를 고정하기 전에 permutation test를 한다.

### Output 단계

- JSON Schema 또는 grammar로 문법을 제한한다.
- `evidence` 또는 `source_span`을 함께 반환하게 한다.
- arguments 값이 입력 원문에 근거하는지 일반 코드로 검사한다.
- 입력에 없는 날짜·시각은 자동으로 거부한다.

예시:

```json
{
  "start_time": "14:00",
  "evidence": {
    "start_time": "오후 2시"
  }
}
```

입력 원문에 `오후 2시`가 없으면 Core가 해당 결과를 거부할 수 있다.

### Domain 단계

- LLM output을 실행 권한으로 사용하지 않는다.
- DateResolver와 Domain validation을 거친다.
- 모호하거나 누락된 field는 사용자에게 질문한다.
- 생성·수정·삭제는 항상 Preview와 확인을 거친다.
- Model confidence만으로 자동 실행하지 않는다.

### Evaluation 단계

- Prompt가 바뀌면 새 Run을 만든다.
- 실패 결과도 보존한다.
- 동일 test set으로 zero-shot, one-shot과 diverse few-shot을 비교한다.
- 더 큰 모델과 quantization 변경 시 같은 evaluation set을 사용한다.

## 13. 이 연구들이 직접 증명하지 않는 것

다음 주장은 현재 근거만으로 확정하면 안 된다.

- 모든 작은 모델이 항상 demonstration 값을 복사한다.
- Qwen3.5-0.8B의 특정 neuron이 이번 오류를 만들었다.
- Few-shot 예시는 사용하지 않는 것이 항상 더 좋다.
- 예시를 늘리면 복사 오류가 반드시 사라진다.
- Prompt만 개선하면 안전한 자동 일정 등록이 가능하다.

연구가 지지하는 더 제한적인 결론은 다음과 같다.

> ICL은 demonstration 선택, 내용, 순서와 위치에 민감하며, 일부 모델은 underlying rule을 일반화하는 대신 demonstration answer를 복사할 수 있다. 따라서 few-shot prompt는 controlled evaluation과 외부 검증 없이 신뢰해서는 안 된다.

## 14. My Planner에 적용할 결론

1. `few-shot 오염`이라는 내부 표현은 보고서에서 `demonstration value copying` 또는 `copy-like error`로 구체화한다.
2. Copying bias가 확정됐다고 쓰기보다 관련 현상과 부합한다고 표현한다.
3. 단일 concrete example을 production prompt에 그대로 사용하지 않는다.
4. 입력 근거가 없는 field를 Core에서 차단한다.
5. 다음 Run에서 zero-shot, one-shot A/B와 diverse few-shot ablation을 수행한다.
6. 작은 모델의 JSON 형식 준수와 의미 정확성을 별도 지표로 유지한다.
7. 모델 변경 시 demonstration selection과 order를 다시 평가한다.

## 15. 참고 논문 목록

1. Ali, A., Wolf, L., & Titov, I. (2024). *Mitigating Copy Bias in In-Context Learning through Neuron Pruning*. arXiv:2410.01288. <https://arxiv.org/abs/2410.01288>
2. Min, S., et al. (2022). *Rethinking the Role of Demonstrations: What Makes In-Context Learning Work?* EMNLP 2022. <https://aclanthology.org/2022.emnlp-main.759/>
3. Li, L., et al. (2024). *Debiasing In-Context Learning by Instructing LLMs How to Follow Demonstrations*. Findings of ACL 2024. <https://aclanthology.org/2024.findings-acl.430/>
4. Zhao, T. Z., et al. (2021). *Calibrate Before Use: Improving Few-Shot Performance of Language Models*. ICML 2021. <https://proceedings.mlr.press/v139/zhao21c.html>
5. Lu, Y., et al. (2022). *Fantastically Ordered Prompts and Where to Find Them: Overcoming Few-Shot Prompt Order Sensitivity*. ACL 2022. <https://aclanthology.org/2022.acl-long.556/>
6. Cobbina, K. A., & Zhou, T. (2025). *Where to Show Demos in Your Prompt: A Positional Bias of In-Context Learning*. EMNLP 2025. <https://aclanthology.org/2025.emnlp-main.1503/>

## 16. 관련 프로젝트 자료

- [JSON Test Run 001](../02-test-runs/runs/2026-08-18-qwen35-08b-json-001/report.md)
- [테스트 케이스 설계 가이드](../03-test-case-design/README.md)
- [Local LLM 영역 안내](../LOCAL_LLM_OVERVIEW.md)

