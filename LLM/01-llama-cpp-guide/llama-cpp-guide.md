# llama.cpp 처음 사용하기

이 문서는 My Planner의 Local LLM 실험을 재현하기 위한 입문 가이드다. macOS Apple Silicon 환경을 기준으로 설명하지만, 핵심 명령 구조는 Linux와 Windows에서도 동일하다.

## 1. llama.cpp가 하는 일

`llama.cpp`는 GGUF 형식의 언어 모델을 로컬 컴퓨터에서 실행하는 C/C++ 기반 runtime이다. Python 서버나 외부 AI API 없이 CLI 또는 로컬 HTTP server 형태로 모델을 실행할 수 있다.

My Planner에서는 다음 이유로 `llama.cpp`를 우선 검토한다.

- CPU 기반 추론 지원
- Apple Silicon, x86 CPU 등 여러 환경 지원
- Q4, Q8 등 양자화된 소형 GGUF 모델 지원
- CLI로 모델과 프롬프트를 빠르게 시험 가능
- 향후 sidecar process 또는 local server로 앱과 연결 가능
- grammar와 JSON Schema를 이용한 구조화 출력 지원

공식 자료:

- <https://github.com/ggml-org/llama.cpp>
- <https://huggingface.co/ggml-org/Qwen3.5-0.8B-GGUF>
- <https://huggingface.co/Qwen/Qwen3.5-0.8B>

## 2. 이번 실험의 경로

현재 `llama.cpp` 소스와 빌드 결과는 다음 위치에 있다.

```text
/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp
```

주요 실행 파일은 다음과 같다.

```text
/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli
/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-server
```

다운로드한 모델은 프로젝트 안의 다음 위치에 있다.

```text
DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf
```

경로에 공백이 있으므로 shell 명령에서 `llama-cli` 경로를 작은따옴표로 감싸야 한다.

## 3. 설치 또는 빌드 상태 확인

먼저 실행 파일이 있는지 확인한다.

```bash
ls -lh '/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli'
```

버전과 CPU 아키텍처를 확인한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' --version
```

이번에 확인한 빌드는 다음과 같다.

```text
version: 0.1.2-dev
build: 10489
commit: 169e4a7ff
compiler: AppleClang 17
target: Darwin arm64
```

아직 빌드하지 않았다면 `llama.cpp` 폴더에서 다음 순서로 빌드할 수 있다.

```bash
cd '/path/to/llama.cpp'
cmake -B build
cmake --build build -j --target llama-cli llama-server
```

빌드 후 실행 파일은 일반적으로 `build/bin/` 아래에 생성된다.

## 4. GGUF와 양자화 이해하기

`llama.cpp`는 주로 GGUF 모델 파일을 사용한다. 모델 이름에 붙는 `Q4_0`, `Q4_K_M`, `Q8_0`, `BF16` 등은 가중치 저장 정밀도와 양자화 방식을 뜻한다.

일반적인 경향은 다음과 같다.

| 형식 | 파일과 메모리 | 품질 | 초기 용도 |
|---|---:|---:|---|
| Q4 계열 | 작음 | 비교적 낮음 | 저사양 기기, 빠른 가능성 검증 |
| Q8_0 | 중간 | Q4보다 높음 | 여유 메모리가 있는 로컬 실행 |
| BF16/F16 | 큼 | 원본에 가까움 | 품질 기준 측정, 고사양 환경 |

양자화가 작을수록 항상 더 빠르거나 더 좋은 것은 아니다. CPU 종류와 모델 구조에 따라 달라지므로 파일 크기, 최대 메모리, 생성 속도와 실제 명령 정확도를 함께 측정해야 한다.

## 5. 모델 다운로드

이번 실험에서는 공식 `ggml-org`의 Qwen3.5-0.8B Q4_0 모델을 사용했다.

프로젝트 루트에서 모델 폴더를 만든다.

```bash
mkdir -p DEV/experiments/local-llm/models
```

모델을 다운로드한다.

```bash
curl -L --fail --continue-at - \
  --output DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  https://huggingface.co/ggml-org/Qwen3.5-0.8B-GGUF/resolve/main/Qwen3.5-0.8B-Q4_0.gguf
```

옵션의 의미:

- `-L`: Hugging Face의 실제 파일 주소로 이어지는 redirect를 따라간다.
- `--fail`: HTTP 오류가 발생하면 성공한 것처럼 파일을 남기지 않는다.
- `--continue-at -`: 중단된 다운로드가 있으면 가능한 경우 이어받는다.
- `--output`: 저장할 파일 경로를 지정한다.

파일 크기와 체크섬을 확인한다.

```bash
ls -lh DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf
shasum -a 256 DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf
```

이번에 받은 파일의 SHA-256은 다음과 같다.

```text
57d1997790d1744fba5b40a7317df71ea5e2acee28c47e78f0cce39c0703f8cf
```

체크섬은 모델 배포자가 별도로 게시한 공식 checksum과 대조할 수 있을 때 무결성 확인에 사용한다. 여기 기록된 값은 이번 다운로드 파일을 이후 실험에서 동일하게 식별하기 위한 값이다.

## 6. 가장 간단한 실행

프로젝트 루트에서 아래 명령을 실행한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -p '안녕하세요. 한 문장으로 자기소개해 주세요.'
```

주요 옵션:

- `-m`: 실행할 GGUF 모델 경로
- `-p`: 첫 사용자 prompt
- `-n`: 최대 생성 token 수
- `-c`: context 크기
- `-t`: CPU thread 수
- `-sys`: system prompt
- `--temp`: sampling temperature
- `--single-turn`: 한 번 답한 뒤 종료

## 7. CPU만 사용하기

Apple Silicon에서는 기본 설정이 Metal을 사용할 수 있다. CPU만 사용하는 조건을 시험하려면 다음 옵션을 명시한다.

```text
-dev none
-ngl 0
--no-op-offload
```

- `-dev none`: offload 장치를 사용하지 않는다.
- `-ngl 0`: 모델 layer를 GPU에 올리지 않는다.
- `--no-op-offload`: 연산을 accelerator device로 넘기지 않는다.

CPU 4개 thread, context 2,048, 최대 출력 192 token으로 실행하는 예시는 다음과 같다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none \
  -ngl 0 \
  --no-op-offload \
  -t 4 \
  -c 2048 \
  -n 192 \
  --temp 0 \
  --reasoning off \
  --single-turn \
  --no-display-prompt \
  --simple-io \
  -p '내일 오후 3시에 병원 예약 등록해줘'
```

## 8. 이번 옵션을 선택한 이유

### Context `-c 2048`

일정 명령 해석은 긴 문서 생성이 아니다. 초기 실험에서는 짧은 system prompt, 현재 사용자 명령과 소수의 후보 일정만 전달할 것이므로 2,048 token부터 시작한다. 큰 context는 KV cache 메모리를 증가시킬 수 있다.

### Output `-n 160~192`

구조화된 일정 JSON 하나를 출력하는 데 긴 생성이 필요하지 않다. 출력 상한을 작게 두면 잘못된 장문 생성과 실행 시간을 줄일 수 있다.

### Temperature `--temp 0`

일정 명령 parser는 창의성보다 반복 가능성과 안정성이 중요하다. 같은 입력에 비슷한 구조를 얻기 위해 우선 0으로 시험한다.

### Reasoning `--reasoning off`

내부 reasoning을 길게 생성할 필요가 없는 단순 정보 추출 작업이다. reasoning을 끄면 token과 지연 시간을 줄일 수 있다.

### Single turn `--single-turn`

한 명령을 처리하고 process 동작을 확인하기 위한 CLI 실험에 적합하다. 실제 앱에서는 process 재사용 전략을 별도로 시험해야 한다.

## 9. 일정관리용 system prompt

작은 모델에 단순히 “JSON으로 출력하라”고만 지시하면 의미 오류가 발생할 수 있다. 분류 규칙, 날짜 보존 규칙, 출력 키와 예시를 함께 제공하는 편이 안정적이었다.

이번에 성공한 system prompt의 핵심은 다음과 같다.

```text
일정관리 명령을 JSON으로 변환한다.
JSON 외의 텍스트는 금지한다.

규칙:
- 특정 날짜와 시각의 약속·회의·예약은 CREATE_EVENT다.
- 수행하거나 완료할 업무는 CREATE_TASK다.
- 오늘·내일·다음주 같은 상대 날짜는 실제 날짜로 바꾸지 않는다.
- 상대 날짜 표현은 date_expression에 그대로 복사한다.
- title은 날짜·시간·등록 요청을 제거한 일정 이름이다.
- 모든 생성은 requires_confirmation=true다.
- schema_version은 숫자 1이다.

예시 입력:
다음주 화요일 오후 2시에 팀 회의 잡아줘

예시 출력:
{"schema_version":1,"intent":"CREATE_EVENT","confidence":0.95,"arguments":{"title":"팀 회의","date_expression":"다음주 화요일","start_time":"14:00"},"missing_fields":[],"requires_confirmation":true}
```

프롬프트는 모델이 따라야 할 제품 정책을 대신하지 않는다. 모델 출력은 이후 JSON Schema, allowlist, DateResolver와 Domain validation을 반드시 통과해야 한다.

## 10. 속도와 메모리 측정

macOS에서는 `/usr/bin/time -l`로 process 통계를 함께 확인할 수 있다.

```bash
/usr/bin/time -l \
  '/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none -ngl 0 --no-op-offload \
  -t 4 -c 2048 -n 160 \
  --temp 0 --reasoning off \
  --single-turn --no-display-prompt --simple-io \
  -p '내일 오후 3시에 병원 예약 등록해줘'
```

출력에서 주로 확인할 항목:

```text
Prompt: ... t/s
Generation: ... t/s
... real
maximum resident set size
swaps
```

- `Prompt t/s`: 입력 prompt를 처리한 속도
- `Generation t/s`: 답변 token 생성 속도
- `real`: 전체 wall-clock 시간
- `maximum resident set size`: process 최대 상주 메모리
- `swaps`: 메모리가 부족해 swap이 발생했는지 확인

macOS의 `maximum resident set size`는 byte 단위다. GiB로 바꾸려면 `1024 × 1024 × 1024`로 나눈다.

## 11. 대화형 CLI와 단발 실행

### 대화형 사용

`--single-turn` 없이 chat template이 활성화되면 여러 문장을 이어서 입력할 수 있다. 터미널에서 모델의 일반적인 반응을 탐색할 때 사용한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -t 4 -c 2048
```

종료할 때 `/exit` 또는 `Ctrl+C`를 사용한다.

### 단발 실행

평가 자동화에는 `--single-turn`, `-p`, `--simple-io` 조합이 적합하다. 입력 하나에 출력 하나를 받고 process가 종료되므로 결과 파일 수집과 비교가 쉽다.

## 12. llama-server 사용

`llama-server`는 모델을 한 번 로드하고 로컬 HTTP API로 여러 요청을 처리할 수 있다. 앱 통합을 빠르게 검증할 때 유용하지만, 최종 제품에서 localhost server를 사용할지는 공격면, port 관리와 process 수명 제약을 검토한 뒤 결정한다.

CPU 전용 server 예시:

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-server' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none \
  -ngl 0 \
  --no-op-offload \
  -t 4 \
  -c 2048 \
  --host 127.0.0.1 \
  --port 8080
```

서버가 실행되면 OpenAI 호환 endpoint를 사용할 수 있다. 정확한 요청 형식은 사용 중인 `llama.cpp` 빌드의 `tools/server/README.md`와 `/v1/models` 응답으로 확인한다.

최종 My Planner 구조에서는 HTTP server 대신 stdin/stdout sidecar도 후보로 유지한다. CLI 실험 결과만으로 통합 방식을 확정하지 않는다.

## 13. 자주 발생하는 문제

### `No such file or directory`

실행 파일 또는 모델 경로가 틀린 경우다. 현재 위치를 확인하고 절대 경로나 프로젝트 루트 기준 상대 경로를 사용한다.

```bash
pwd
ls -lh '/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli'
ls -lh DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf
```

### 경로의 `Resource/llama.cpp` 앞에서 명령이 끊김

`03 Resource`에 공백이 있기 때문이다. 전체 경로를 작은따옴표로 감싼다.

### 모델 파일을 읽지 못함

다운로드가 중간에 끊겼는지 파일 크기와 checksum을 확인한다. 필요하면 같은 `curl --continue-at -` 명령으로 이어받는다.

### 답변이 JSON 앞뒤로 설명을 붙임

system prompt에 JSON 외 텍스트 금지를 명시하고 `--reasoning off`를 사용한다. 이후 단계에서는 JSON Schema 또는 grammar constrained generation을 추가한다.

### 상대 날짜를 임의의 실제 날짜로 바꿈

작은 모델이 현재 날짜를 추측한 결과다. 모델에는 상대 표현을 그대로 보존하도록 예시를 주고, 실제 날짜 계산은 Core의 DateResolver가 담당해야 한다.

### Task와 Event를 혼동함

약속·회의·예약과 수행 업무의 분류 기준을 prompt에 명시하고 각 Intent별 예시를 제공한다. 모델 결과는 Domain 단계에서 다시 점검한다.

### 메모리 사용량이 예상보다 큼

모델 파일 크기와 실행 메모리는 동일하지 않다. 모델 가중치 외에도 KV cache, 계산 buffer, runtime과 prompt가 메모리를 사용한다. context, batch, 병렬 요청 수를 줄이고 더 작은 양자화를 비교한다.

### 첫 실행만 오래 걸림

파일을 처음 읽을 때 OS page cache가 비어 있을 수 있다. 이후 실행은 cache 효과로 빨라질 수 있으므로 cold와 warm 결과를 구분해 기록한다.

## 14. 다음 실험 순서

1. JSON Schema 또는 grammar로 출력 문법을 강제한다.
2. CREATE_TASK, CREATE_EVENT, UPDATE, DELETE, QUERY 평가 문장을 만든다.
3. 정상·모호·위험·불완전 명령을 구분해 시험한다.
4. Q4와 Q8 품질 및 메모리를 비교한다.
5. 0.8B와 더 큰 모델의 의미 정확도를 비교한다.
6. cold load, warm inference, idle memory를 각각 측정한다.
7. 단발 CLI와 지속 process의 메모리·지연 시간을 비교한다.
8. 기준을 만족한 뒤 현재 UI의 AI Preview와 연결한다.
