# Kakao Theme Studio 작업 지침

먼저 이 저장소의 [AGENTS.md](AGENTS.md)를 읽고 동일한 프로젝트·원본·서명·검증 계약을 따른다.

최초 실행·새 호스트에서는 [설치와 실행 환경](skills/kakao-theme-studio/references/environment.md)에 따라 Node·고정 실행 의존성, Android용 JDK/SDK 및 선택 도구를 확인한다. doctor 실행 성공과 Android 준비 완료를 구분하고 환경 문제를 앱 소스 수정으로 우회하지 않는다.

**테마 제작·편집·생성 중에는 별도 요청 없이 스튜디오 도구 자체를 수정하지 않는다.** 작업 대상은 테마 프로젝트의 설정·등록 에셋·생성 결과다. 지원하지 않는 디자인이나 오류를 발견하면 한계와 재현 조건을 보고한다. `src/`, `public/`, `templates/`, 앱 실행 스크립트·의존성·테스트 수정은 사용자가 도구 개발을 명시적으로 요청한 경우에만 수행한다.

제작 절차는 [공통 스킬](skills/kakao-theme-studio/SKILL.md)을 사용한다. Claude Code의 `/kakao-theme-studio`와 Codex의 `$kakao-theme-studio`는 같은 원본을 읽는다. Git 최신화는 스킬의 안전 조건에 따르며 코드 수정·커밋·push·충돌 해결까지 허용하는 것은 아니다.
