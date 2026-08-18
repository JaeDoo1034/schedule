# 터미널에서 llama.cpp 직접 사용하기

이 문서는 macOS 터미널을 처음 사용하는 사람도 현재 다운로드된 `llama.cpp`와 Qwen 모델을 직접 실행할 수 있도록 설명한다.

복잡한 앱 연동 없이 다음 과정을 해보는 것이 목표다.

```text
터미널 열기
→ 프로젝트 폴더로 이동
→ llama.cpp 실행 확인
→ 모델과 대화 시작
→ 질문 입력
→ 대화 종료
```

## 1. 현재 준비된 파일

이 컴퓨터에는 `llama.cpp`가 다음 위치에 있다.

```text
/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp
```

대화에 사용할 실행 파일은 다음과 같다.

```text
/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli
```

다운로드한 모델은 My Planner 프로젝트 안에 있다.

```text
/Users/hoduo02gmail.com/Desktop/01 Project/schedule/DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf
```

`03 Resource`와 `01 Project`에는 공백이 있다. 터미널 명령에서는 공백이 포함된 전체 경로를 작은따옴표 `'...'`로 감싸야 한다.

## 2. 터미널 열기

macOS에서 다음 중 편한 방법으로 Terminal을 실행한다.

### Spotlight 사용

1. `Command + Space`를 누른다.
2. `터미널` 또는 `Terminal`을 입력한다.
3. 검색 결과의 Terminal 앱을 실행한다.

### Finder 사용

1. Finder를 연다.
2. `응용 프로그램`을 연다.
3. `유틸리티` 폴더를 연다.
4. `터미널`을 실행한다.

터미널을 열면 마지막 줄에 `%` 또는 `$` 기호가 보인다. 이 기호 뒤에 명령을 입력하고 Enter를 누르면 된다. 문서의 코드 블록에 있는 `$` 같은 설명용 기호를 별도로 입력할 필요는 없다.

## 3. 프로젝트 폴더로 이동

아래 명령을 그대로 복사해 터미널에 붙여넣고 Enter를 누른다.

```bash
cd '/Users/hoduo02gmail.com/Desktop/01 Project/schedule'
```

현재 위치를 확인한다.

```bash
pwd
```

다음 경로가 출력되면 정상이다.

```text
/Users/hoduo02gmail.com/Desktop/01 Project/schedule
```

Finder에서 폴더를 터미널 창으로 끌어다 놓아 경로를 입력할 수도 있다.

## 4. llama.cpp 실행 파일 확인

아래 명령을 입력한다.

```bash
ls -lh '/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli'
```

파일 정보가 한 줄 출력되면 실행 파일이 존재하는 것이다.

버전을 확인한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' --version
```

현재 환경에서는 대략 다음 정보가 출력된다.

```text
version: 0.1.2-dev
build: 10489
commit: 169e4a7ff
built for Darwin arm64
```

버전 출력 후 명령 입력 줄로 돌아오면 정상이다.

## 5. 모델 파일 확인

모델이 실제로 다운로드되어 있는지 확인한다.

```bash
ls -lh DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf
```

약 `537M` 또는 `544M`로 표시되는 파일이 보이면 정상이다. `ls -lh`와 `du -h`의 단위 계산 방식이 달라 숫자가 조금 다르게 표시될 수 있다.

## 6. 가장 간단하게 한 번 질문하기

아래 명령은 모델에 한 번 질문하고 답변이 끝나면 자동으로 종료한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -t 4 \
  -c 2048 \
  -n 128 \
  --reasoning off \
  --single-turn \
  -p '내일 오후 3시에 병원 예약을 등록하고 싶어'
```

여러 줄로 표시된 명령 끝의 `\`는 “다음 줄에도 같은 명령이 이어진다”는 뜻이다. 위 블록 전체를 한 번에 복사해 붙여넣으면 된다.

잠시 기다리면 다음 순서로 출력이 나타난다.

1. 모델을 불러오는 메시지
2. 입력한 질문
3. 모델의 답변
4. prompt와 generation 속도
5. 명령 입력 줄로 복귀

처음 실행은 모델 파일을 메모리로 읽어야 해서 이후 실행보다 오래 걸릴 수 있다.

## 7. 모델과 계속 대화하기

여러 질문을 이어서 입력하려면 `--single-turn`과 `-p`를 제외하고 실행한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -t 4 \
  -c 2048 \
  --reasoning off
```

모델 로딩이 완료되면 다음과 비슷한 입력 표시가 나타난다.

```text
>
```

`>` 뒤에 질문을 입력하고 Enter를 누른다.

```text
> 내일 오후 3시에 병원 예약을 등록하고 싶어
```

답변이 끝나고 다시 `>`가 나타나면 다음 질문을 입력할 수 있다.

```text
> 방금 일정을 오후 4시로 바꿔줘
```

대화형 모드는 이전 대화 내용을 context에 유지한다. 오래 대화하면 context를 더 많이 사용하고 모델이 앞선 대화에 영향을 받을 수 있다.

## 8. 대화 종료하기

대화 입력 줄에 다음 명령을 입력한다.

```text
/exit
```

또는 키보드에서 `Control + C`를 누른다. macOS의 `Command + C`가 아니라 `Control + C`다.

정상 종료되면 일반 터미널 입력 줄로 돌아온다.

모델이 답변을 너무 길게 생성하는 중에도 `Control + C`로 중단할 수 있다. 한 번 눌렀을 때 현재 생성만 중단되고 대화가 계속된다면 `/exit`를 입력하거나 다시 `Control + C`를 누른다.

## 9. CPU만 사용해서 실행하기

Apple Silicon용 `llama.cpp`는 기본적으로 Metal 가속을 사용할 수 있다. GPU 가속 없이 CPU 조건만 시험하려면 다음 옵션을 추가한다.

```text
-dev none
-ngl 0
--no-op-offload
```

CPU 전용 대화형 실행 명령:

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none \
  -ngl 0 \
  --no-op-offload \
  -t 4 \
  -c 2048 \
  --reasoning off
```

이번 My Planner 실험에서는 위 설정으로 CPU 추론을 확인했다.

## 10. 자주 쓰는 옵션 이해하기

| 옵션 | 의미 | 현재 권장값 |
|---|---|---:|
| `-m` | 사용할 GGUF 모델 파일 | 현재 Qwen 모델 경로 |
| `-t` | 생성에 사용할 CPU thread 수 | `4` |
| `-c` | prompt와 대화를 담는 context 크기 | `2048` |
| `-n` | 한 번에 생성할 최대 token 수 | JSON은 `128~192` |
| `-p` | 시작할 때 전달할 사용자 질문 | 원하는 문장 |
| `-sys` | 모델의 역할과 규칙을 정하는 system prompt | 일정 parser 규칙 |
| `--temp` | 출력의 무작위성 | 구조화 출력은 `0` |
| `--reasoning off` | 별도 추론 과정 생성 비활성화 | 일정 추출 시 사용 |
| `--single-turn` | 한 번 답한 뒤 종료 | 자동 테스트 시 사용 |
| `--no-display-prompt` | 입력 prompt 재출력 생략 | 결과 수집 시 사용 |
| `--simple-io` | 단순한 표준 입출력 사용 | script 연동 시 사용 |

옵션은 짧은 형식과 긴 형식이 섞여 있다. 예를 들어 `-m` 다음에는 반드시 모델 경로가 와야 한다.

## 11. System prompt로 역할 정하기

아무 규칙 없이 대화하면 모델은 일반 assistant처럼 답한다. 일정 parser로 시험하려면 `-sys`에 역할과 출력 규칙을 전달한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none -ngl 0 --no-op-offload \
  -t 4 -c 2048 -n 160 \
  --temp 0 \
  --reasoning off \
  --single-turn \
  --no-display-prompt \
  --simple-io \
  -sys '일정관리 명령을 JSON으로 변환한다. 특정 날짜와 시각의 약속, 회의, 예약은 CREATE_EVENT다. 수행하거나 완료할 업무는 CREATE_TASK다. 상대 날짜는 실제 날짜로 바꾸지 않는다. JSON 외의 설명은 출력하지 않는다.' \
  -p '내일 오후 3시에 병원 예약 등록해줘'
```

`-sys`는 모델에게 규칙을 알려줄 뿐, 규칙 준수를 보장하지는 않는다. 실제 앱에서는 JSON Schema 검증과 Domain validation을 추가해야 한다.

## 12. 긴 System prompt를 파일로 관리하기

System prompt가 길어지면 터미널 명령 안에서 편집하기 어렵다. 별도의 text 파일로 저장하고 `-sysf`로 읽을 수 있다.

예를 들어 `LLM/prompts/schedule-parser.txt` 파일이 있다고 가정하면 다음처럼 실행한다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none -ngl 0 --no-op-offload \
  -t 4 -c 2048 -n 160 \
  --temp 0 --reasoning off \
  --single-turn --simple-io \
  -sysf LLM/prompts/schedule-parser.txt \
  -p '다음주 화요일 오후 2시에 팀 회의 잡아줘'
```

현재는 경로 사용법을 설명하기 위한 예시이며, `LLM/prompts/schedule-parser.txt`는 후속 prompt 설계 단계에서 추가한다.

## 13. 사용자 입력을 파일에서 읽기

긴 테스트 입력은 `-f` 옵션으로 파일에서 읽을 수 있다.

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -t 4 -c 2048 -n 160 \
  --reasoning off --single-turn \
  -f LLM/input-example.txt
```

이 역시 `LLM/input-example.txt` 파일을 실제로 만든 뒤 사용하는 예시다.

## 14. 매번 긴 실행 경로를 입력하지 않는 방법

현재 터미널 창에서만 사용할 짧은 변수를 만들 수 있다.

```bash
LLAMA_CLI='/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli'
MODEL_FILE='/Users/hoduo02gmail.com/Desktop/01 Project/schedule/DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf'
```

변수가 잘 저장됐는지 확인한다.

```bash
"$LLAMA_CLI" --version
ls -lh "$MODEL_FILE"
```

그다음에는 짧게 실행할 수 있다.

```bash
"$LLAMA_CLI" \
  -m "$MODEL_FILE" \
  -dev none -ngl 0 --no-op-offload \
  -t 4 -c 2048 \
  --reasoning off
```

이 변수는 현재 터미널 창을 닫으면 사라진다. 처음에는 shell 설정 파일을 변경하지 말고 이 방식으로 연습하는 편이 안전하다.

## 15. 출력 결과를 파일로 저장하기

`>` redirect를 사용하면 화면에 출력하는 대신 파일에 저장할 수 있다.

```bash
"$LLAMA_CLI" \
  -m "$MODEL_FILE" \
  -dev none -ngl 0 --no-op-offload \
  -t 4 -c 2048 -n 160 \
  --temp 0 --reasoning off \
  --single-turn --no-display-prompt --simple-io \
  -p '내일 오후 3시에 병원 예약 등록해줘' \
  > LLM/latest-output.txt
```

저장된 내용을 확인한다.

```bash
cat LLM/latest-output.txt
```

주의할 점:

- 같은 파일에 다시 `>`를 사용하면 기존 내용이 덮어써진다.
- 여러 결과를 이어 붙이려면 `>>`를 사용하지만, JSON 자동 평가에는 입력별 파일을 따로 두는 편이 낫다.
- runtime 로그 일부가 표준 오류로 출력되면 결과 파일과 터미널에 나뉘어 보일 수 있다.

## 16. 실행 속도와 메모리 확인하기

macOS에서는 명령 앞에 `/usr/bin/time -l`을 붙인다.

```bash
/usr/bin/time -l \
  "$LLAMA_CLI" \
  -m "$MODEL_FILE" \
  -dev none -ngl 0 --no-op-offload \
  -t 4 -c 2048 -n 160 \
  --temp 0 --reasoning off \
  --single-turn --simple-io \
  -p '내일 오후 3시에 병원 예약 등록해줘'
```

마지막 부분에서 다음 값을 확인한다.

```text
Generation: ... t/s
... real
maximum resident set size
swaps
```

- `Generation`: 초당 생성한 token 수
- `real`: 사용자가 기다린 전체 시간
- `maximum resident set size`: 최대 상주 메모리, macOS에서는 byte
- `swaps`: 메모리 부족으로 swap을 사용한 횟수

한 번만 측정하지 말고 첫 실행과 반복 실행을 나눠 기록한다. 두 번째부터 OS file cache 때문에 더 빨라질 수 있다.

## 17. 모델을 바꿔 실행하기

다른 GGUF 모델을 다운로드하면 `-m` 뒤의 경로만 바꾼다.

```bash
"$LLAMA_CLI" -m '/path/to/another-model.gguf' -t 4 -c 2048
```

모델마다 chat template, reasoning 방식과 권장 sampling 옵션이 다를 수 있다. 모델을 바꾸면 해당 Hugging Face 모델 카드와 현재 `llama.cpp` 지원 여부를 먼저 확인한다.

## 18. 실행이 되지 않을 때 확인할 것

### `command not found`

`llama-cli`라는 짧은 이름만 입력했지만 시스템 PATH에 등록되지 않은 경우다. 이 문서처럼 실행 파일의 전체 경로를 사용한다.

### `No such file or directory`

실행 파일이나 모델 경로가 틀린 경우다.

```bash
ls -lh '/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli'
ls -lh '/Users/hoduo02gmail.com/Desktop/01 Project/schedule/DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf'
```

### `permission denied`

실행 파일에 실행 권한이 없을 수 있다. 먼저 권한을 확인한다.

```bash
ls -l '/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli'
```

파일 권한 앞부분에 `x`가 있어야 한다. 직접 빌드한 정상적인 `llama-cli`에는 보통 실행 권한이 설정되어 있다.

### 경로가 공백에서 끊김

경로 전체를 `'...'` 또는 `"..."`로 감싸지 않은 경우다.

잘못된 예:

```bash
/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli
```

올바른 예:

```bash
'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli'
```

### 모델을 불러오다 종료됨

메모리 부족, 손상된 다운로드, 지원하지 않는 모델 형식 등을 확인한다.

```bash
ls -lh "$MODEL_FILE"
shasum -a 256 "$MODEL_FILE"
```

context와 thread를 줄여 시험할 수도 있다.

```bash
"$LLAMA_CLI" -m "$MODEL_FILE" -t 2 -c 1024 -n 64 -p '안녕'
```

### 답변이 끝나지 않음

대화형 모드로 실행되었거나 최대 출력이 지정되지 않았을 수 있다. 한 번만 답하게 하려면 `--single-turn`과 `-n 128`을 추가한다.

### 답변이 이상하거나 날짜를 지어냄

모델 실행 실패가 아니라 모델 품질 또는 prompt 문제다. system prompt에 규칙과 예시를 추가하고, 앱에서는 모델 결과를 바로 저장하지 않는다.

## 19. 처음 연습할 때 추천 순서

다음 순서대로 한 단계씩 해보면 된다.

1. `--version`으로 실행 파일을 확인한다.
2. `ls -lh`로 모델 파일을 확인한다.
3. `--single-turn`으로 간단한 한국어 질문을 한다.
4. 대화형 모드로 두세 번 질문한다.
5. `/exit`로 정상 종료한다.
6. CPU 전용 옵션을 추가해 실행한다.
7. `-sys`로 일정 parser 역할을 지정한다.
8. `/usr/bin/time -l`로 메모리와 속도를 확인한다.
9. 입력 문장과 실제 결과를 `LLM/` 실험 문서에 기록한다.

## 20. 바로 복사해서 사용할 권장 명령

### 일반 대화

```bash
cd '/Users/hoduo02gmail.com/Desktop/01 Project/schedule'

'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -t 4 \
  -c 2048 \
  --reasoning off
```

### CPU 전용 일반 대화

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

### CPU 전용 단일 질문

```bash
cd '/Users/hoduo02gmail.com/Desktop/01 Project/schedule'

'/Users/hoduo02gmail.com/Desktop/03 Resource/llama.cpp/build/bin/llama-cli' \
  -m DEV/experiments/local-llm/models/Qwen3.5-0.8B-Q4_0.gguf \
  -dev none \
  -ngl 0 \
  --no-op-offload \
  -t 4 \
  -c 2048 \
  -n 128 \
  --reasoning off \
  --single-turn \
  -p '내일 오후 3시에 병원 예약을 등록하고 싶어'
```

이 세 명령으로 대화형 사용, CPU 제약 실험과 단발 자동 테스트를 각각 시작할 수 있다.
