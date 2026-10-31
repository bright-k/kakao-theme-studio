# Codex·Claude 공통 스킬 스펙

스펙 버전: 1. 대상은 로컬 저장소에서 실행하는 Kakao Theme Studio의 테마 제작이다. 앱 버전과 독립적으로 관리한다.

## 파일과 배치

```text
skills/kakao-theme-studio/           # 공통 원본
  SKILL.md                          # 공통 name/description과 제작 절차
  agents/openai.yaml                # Codex UI 메타데이터만
  references/{spec,environment,editing,build}.md
  scripts/prepare.mjs                # Node 내장 모듈만 사용
.agents/skills/kakao-theme-studio    # ../../skills/kakao-theme-studio 링크
.claude/skills/kakao-theme-studio    # 같은 원본을 가리키는 링크
```

Codex는 `$kakao-theme-studio`, Claude Code는 `/kakao-theme-studio`로 명시 호출할 수 있으며 설명에 맞는 요청에서는 자동 선택도 허용한다. 특정 도구 이름, Claude 전용 frontmatter, Codex MCP를 공통 절차에 요구하지 않는다. `agents/openai.yaml`은 Claude에서 사용하지 않아도 된다. 루트 `CLAUDE.md`는 공통 AGENTS를 읽도록 연결해 제작 범위를 유지한다.

저장소 안의 두 상대 링크를 사용하면 pull 이후 같은 원본이 유지된다. 링크를 지원하지 않는 체크아웃에서는 두 위치에 공통 폴더를 복사할 수 있으나 이후 갱신 때 동기화해야 한다. 중복된 스킬이 선택되지 않도록 이전 설치본과 프로젝트 설치본의 이름 충돌을 확인한다.

다른 작업 폴더에서도 사용하려면 공통 스킬 폴더 전체를 개인 스킬 위치에 복사하거나 실제 경로로 링크한다. Claude Code는 `~/.claude/skills/kakao-theme-studio`, Codex는 `~/.agents/skills/kakao-theme-studio`를 사용할 수 있다. 이 저장소 구성은 홈 디렉터리에 자동 설치하지 않는다. 사본은 작업할 저장소 경로를 받아 최신 저장소 지침을 다시 읽어야 한다.

Claude 웹/Cowork/클라우드의 스킬 로딩과 로컬 Claude Code의 폴더 검색은 같지 않다. 웹 환경 배포 시 공통 폴더를 별도 업로드해야 할 수 있으며, 로컬 저장소·서버 접근 권한도 별도로 필요하다. 원격 컨테이너에서 로컬 `.data`나 서명키가 있다고 가정하지 않는다. 현재 패키지는 로컬 Codex/Claude Code를 우선 지원한다.

공식 형식 근거(2026-10-31 확인): [Codex 스킬](https://learn.chatgpt.com/docs/build-skills), [Claude Code 스킬](https://code.claude.com/docs/en/skills). 두 도구 모두 스킬 디렉터리의 symlink 검색을 문서화한다. 실제 앱에서의 선택/권한은 설치 환경에서 확인해야 한다.

## 범위와 권한

최초 설치·새 호스트·실행 실패 시 [설치와 실행 환경](environment.md)을 읽는다. 작업별 필수 도구, Node/pnpm 고정 의존성, JDK/Android SDK 설치, 경로·라이선스와 준비 판정을 제공한다. 설치 안내와 실제 설치를 구분하며 환경 부족을 앱 코드 수정으로 해결하지 않는다.

기본 모드는 테마 제작이다. 사용자 요청 없이 스튜디오 코드·템플릿·의존성·실행 스크립트·테스트를 수정하지 않는다. 지원 범위를 벗어나거나 제품 오류가 발견되어도 자동으로 개발 모드로 전환하지 않는다. 최신화와 환경 확인은 준비 작업이며 코드 수정·push·기기 설치·원본 삭제 권한이 아니다. Git 접근이 없으면 제공받은 파일 기준으로 작업하고 최신 여부를 미확인으로 알린다.

## 준비 스크립트 계약

```sh
node skills/kakao-theme-studio/scripts/prepare.mjs --repo .
node skills/kakao-theme-studio/scripts/prepare.mjs --repo . --pull
node skills/kakao-theme-studio/scripts/prepare.mjs --repo . --doctor
```

- 기본은 읽기 전용이다. `--repo`는 필수이며 cwd에 상대적으로 해석한다. 유효한 스튜디오 루트인지 파일로 확인한다. 경로 탐색/사본 선택은 스킬에서 담당한다.
- `--pull`은 깨끗한 현재 브랜치에 upstream이 있고 진행 중 Git 작업이 없을 때만 fetch 후 fast-forward pull한다. 원격 ref와 비교해 로컬 선행/분기를 구분한다. fetch 뒤에도 브랜치·HEAD·작업 트리를 재확인한다. stash/reset/rebase/merge commit/checkout/push를 하지 않는다. Git 설정의 autostash도 끈다.
- Git 없음·non-Git 배포·upstream 없음·변경 있음·detached HEAD·Git 작업 중·원격 실패는 상태로 반환한다. pull 실패 후 자동 재시도하거나 최신이라고 표시하지 않는다. 네트워크/인증 대기는 제한하며 원격 URL과 Git 원문 오류를 출력하지 않는다.
- `--doctor`는 현재 저장소 CLI의 doctor만 실행한다. 의존성 설치·서버 실행·API 쓰기·키 읽기·프로젝트 열기/이관·데이터 삭제를 수행하지 않는다. 갱신된 지침을 읽은 뒤 실행한다.
- stdout은 `schemaVersion`, `repository`, `git`, `versions`, `catalog`, `dataRoot`, `node`, 선택 `doctor`의 JSON 한 개다. Git/환경 미확인은 exit 0의 상태로 전달한다. 잘못된 인자·저장소/메타데이터는 exit 1이다. 토큰·비밀번호·키·프로젝트 목록·원격 URL·Git 원문 로그는 출력하지 않는다.
- `dataRoot`는 현재 셸 기준 추정이다. 실행 서버의 실제 저장 위치는 UI로 대조한다. 이 스크립트는 다른 프로세스의 편집/생성을 감지하거나 잠그지 않으므로 작업자가 시작 전에 확인한다. 동시 소스 편집/다른 pull과 병행하지 않는다.

## 검수

스킬 frontmatter와 두 링크의 실제 대상을 검증한다. 준비 스크립트는 격리된 로컬 Git 저장소로 fast-forward, 미커밋/미추적 파일 보호, 분기, detached/upstream 없음/Git 작업 중, 원격 실패와 오프라인 점검을 검증한다. 사용자 `.data`를 테스트 입력으로 열거나 이동하지 않는다. 앱 출력 변경이 없으므로 스킬 배포만으로 compilerVersion을 올리지 않는다.

행동 확인 예: “배경을 바꿔줘”는 프로젝트 편집, “이미지 모드가 안 먹어”는 모드/예외 진단이며 임의 코드 패치가 아니다. “스튜디오 오류를 고쳐줘”처럼 별도 개발 요청이 있어야 제품 코드 수정으로 전환한다. 두 도구에서 실제 세션 호출을 하지 않았다면 형식/스크립트 검증과 실제 세션 검증을 구분해 보고한다.
