# Agent 작업 지침

현재 구현은 0.4.0이다. `docs/REVIEW-0.4.0.md`를 먼저 읽는다. 화면별 작업은 `docs/REVIEW-0.3.0.md`, `public/screen-model.js`, `docs/screen-coverage.json`을 먼저 확인한다. `docs/REVIEW-0.2.0.md`, `docs/SUPPORT-MATRIX.md`, `docs/coverage-after.json`을 함께 읽는다. 출력 변경 시 `src/catalog.mjs`의 COMPILER_VERSION을 갱신해 이전 미리보기 캐시와 분리한다. 새 리소스/속성은 카탈로그·검증·출력·편집 UI·백업·회귀 테스트와 화면 연결을 함께 갱신한다. `node scripts/audit-screens.mjs`와 `node test/screen-workflow.mjs`로 누락을 검사한다. 공통 원본 SLOTS도 모두 화면에 연결해야 한다. 화면별 색상을 바꾸면서 공통 팔레트를 임의로 변경하지 말고 개별 override를 사용한다. 잠금 비밀번호 표시 8개와 키패드 눌림 이미지는 이미 개별 지원되므로 공통 도형으로 다시 축소하지 않는다.

## 먼저 읽을 문서

1. `docs/HANDOFF.md`: 구현 현황, 검증 근거, 남은 작업.
2. `README.md`: 실행 방법과 사용자 기능.
3. `docs/ARCHITECTURE.md`: 현재 코드·데이터 계약.
4. `docs/TESTING.md`, `docs/VERIFICATION.md`: 재현 명령과 확인 범위.

기존 `docs/tool-design.ko.md`, `docs/implementation-plan.ko.md`는 구현 전 설계다. 현재 동작과 차이가 있으면 HANDOFF/ARCHITECTURE/소스와 실제 실행 결과를 기준으로 판단한다.

## 목표와 경계

- 공통 정책에서 실제 iOS ktheme와 자체 서명 APK를 생성한다. 단순한 Android 소스 ZIP을 완성품으로 보고하지 않는다.
- 미리보기는 생성 이미지를 사용한다. 설정을 바꿨는데 출력과 미리보기 중 한쪽만 바뀌는 회귀를 막는다.
- 실제 카카오톡 적용 검증은 미완료다. APK 설치·서명 검증과 카카오톡 테마 적용 성공을 혼동하지 않는다.
- `deviceVerified`를 근거 없이 true로 바꾸지 않는다. 실제 기기/카카오톡 버전·캡처·관찰 결과를 함께 기록한다.
- 서명키 또는 비밀번호를 출력, 커밋, 프로젝트 백업, 결과 ZIP, 스크린샷에 포함하지 않는다. `.data`, `.test-data`를 소스 배포에 복사하지 않는다.
- 기존 테마의 package ID와 서명 fingerprint 연결을 유지한다. 키가 없으면 복원을 안내하고 다른 키를 자동 생성해 대체하지 않는다.
- 사용자 프로젝트·키·빌드 결과를 승인 없이 삭제하지 않는다. 정리할 때는 본인이 만든 임시 테스트 디렉터리로 한정한다.
- 카카오 공식 캐릭터 이미지를 기본값으로 도입하지 않는다. 규격 참조와 자산 사용 권한을 구분한다.

## 구현 규칙

- ESM `.mjs` 서버/CLI, 브라우저 `.js`, 빌드 없는 정적 편집기다. 이유 없이 프레임워크나 복잡한 배포 계층을 추가하지 않는다.
- 파일 검색은 rg를 우선한다. 의존성은 package.json과 pnpm-lock.yaml에 고정한다.
- 서브프로세스는 `spawn(executable, args, {shell:false})`를 유지한다. 사용자 입력을 셸에 삽입하지 않는다.
- SDK/JDK 탐색은 `doctor()`를 사용한다. 개인 경로를 새 코드에 하드코딩하지 않는다. 기존 호스트 전용 fallback은 일반화할 수 있다.
- ZIP의 루트 구조와 자산 이름, `.9.png`의 1픽셀 가이드, 논리/물리 좌표 변환을 보존한다.
- Android R+ 설치를 위해 `resources.arsc`는 STORE 압축 방식과 4바이트 정렬이 필요하다. 서명 검증만으로 이 회귀를 잡을 수 없으므로 테스트를 유지한다.
- APK 서명 이후 내용을 변경하지 않는다. 바이너리 결과는 직접 컴파일해서 검증한다.
- 새 범위를 구현한 뒤 README/HANDOFF/VERIFICATION의 구현 상태를 실제 결과에 맞게 수정한다.

## 검증

변경에 맞춰 `node --test test/core.test.mjs test/coverage.test.mjs`, `node test/integration.mjs`, `node test/browser.mjs`, `node test/editor-upgrade.mjs`를 선택 실행한다. 이미지·패키징·서명 변경은 통합 테스트가 필요하다. UI 변경은 브라우저 테스트와 캡처 확인을 수행한다. 화면별 UI는 공통 catalog-editor 인스턴스를 옆 패널/전체 대화상자에 이동해 사용한다. 별도 편집기를 복제해 지원 범위가 어긋나게 하지 않는다. 사용자 데이터는 .data에 유지하고 새 검증은 격리한 .test-data에서 한다. 이미 통과한 검증은 새 변경이나 문제가 없으면 불필요하게 반복하지 않는다.

실제 앱 설치 확인은 전용 테스트 에뮬레이터에만 수행한다. 사용자의 실제 휴대폰·계정으로 바꾸기 전 대상과 권한을 확인한다. 테스트용 기기에서 읽는 개인정보를 문서·이미지에 남기지 않는다.

## 권장 다음 작업

1. 실제 iPhone/Android의 카카오톡에서 테마 인식·적용 확인.
2. 현재 버전의 이미지/색상 슬롯 매핑과 실제 렌더링 차이 보정.
3. Keychain 지원, 작업 취소·오류 복구, 서버 재시작 후 작업 상태 복구.
4. 플랫폼별 예외, 세부 상태·배율·태블릿/가로 프로필 확장.

지금 요청받지 않은 범위를 임의로 진행하지 말고 현재 사용자 목표에 맞춰 우선순위를 정한다. 다음 agent를 위해 완료 사항·근거·미완료 항목을 HANDOFF에 갱신한다.

## 0.4.0 유지 계약

- 상태 미리보기는 UI 상태다. 탭/자리 수/프로필/버튼 상태를 바꿔 프로젝트나 생성 결과를 변경하지 않는다.
- `src/provenance.mjs`는 실제 생성 우선순위와 일치해야 한다. 모든 공통 원본과 146개 출력의 픽셀 대조 테스트를 유지한다. 공통값보다 출력별 재정의가 우선이며 이미지 비활성화가 최우선이다.
- `resourceGeometry`는 Android 9-patch 파일별 좌표(폭/높이, 여러 stretchX/Y 구간, insets)다. 원본 그림·원본 파일 참조는 보존하고 출력 가이드만 재생성한다. iOS는 기존 overrides의 논리 좌표를 편집하며 선택/기본 상태가 공유하는 내용 여백을 구분해 안내한다.
- 새 기하 필드는 검증·visualRevision 캐시·복제·ZIP 백업/복원·실제 APK 컴파일까지 함께 검증한다. 현재 compilerVersion은 0.4.0이다.
- `public/visual-geometry.js`의 드래그 중 DOM을 재생성하지 않는다. 실행취소는 진행 중 잠그고 미리보기·상세 갱신 완료 후 풀어 비동기 경합을 막는다.
- 변경 검증: 단위 테스트 전체, test/state-geometry.mjs, test/screen-workflow.mjs, test/editor-upgrade.mjs. 출력 변경이면 test/integration.mjs도 실행한다.
