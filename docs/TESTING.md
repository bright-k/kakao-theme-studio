# 검증 재현

프로젝트 루트에서 Node 22 이상으로 실행한다. `Studio.command`가 찾는 Node 경로가 PATH에 없다면 번들 Node 실행 파일의 절대 경로를 사용해도 된다.

```sh
node src/cli.mjs doctor
node --test test/*.test.mjs
node test/integration.mjs
node test/browser.mjs
node test/editor-upgrade.mjs
node test/screen-workflow.mjs
node scripts/audit-screens.mjs
node scripts/audit-coverage.mjs
node scripts/support-matrix.mjs
```

integration은 JDK/Android SDK가 필요하다. 별도의 임시 제작자 키를 생성하고 두 APK를 컴파일·서명해 package ID/fingerprint/versionCode를 확인하며 키 백업·복원과 다른 키 거부를 확인한다. 암호는 난수로 만들고 출력하지 않는다.

browser는 Playwright Chromium 설치가 필요하다. `npx playwright install chromium`으로 준비한다. 로컬 서버/브라우저 실행 권한이 필요하며 test-results에 캡처와 보고서를 남긴다. 인증 거부, Origin·경로 검사, 프로젝트 저장/전환, 이미지 업로드, 키 생성, 두 플랫폼 생성 및 다운로드, 프로젝트 백업, 네 화면 미리보기를 확인한다.

새 프로젝트 창의 취소·잘못된 형식·Java 예약어·중복 오류·입력값 유지·좁은 화면·사용자 지정/자동 패키지명도 browser에서 확인한다. project-creation.test.mjs는 지정 ID의 iOS 연결·백업/복원, API 형식 검증, 동시 중복 생성과 PUT/ZIP 우회 거부, 기존 ID 불변을 검사한다. integration은 사용자 지정 패키지명으로 실제 APK를 컴파일·서명하고 동일 인증서의 다음 버전 업데이트를 검사한다. 생성한 ktheme 내부 CSS의 iOS ID가 APK 검증을 통과한 Android packageId와 정확히 같은지도 확인한다. 기존 sample-project.zip을 복원·컴파일하는 회귀 검사로 기존 프로젝트의 공통 ID 출력과 compilerVersion 0.4.1 캐시 분리를 확인한다.

`editor-upgrade`는 실행취소·복제·iOS 세부 설정·Android ARGB·잠금화면 8개 이미지 UI·키패드·패턴·리소스 일괄 등록을 검증한다. `audit-coverage`는 카탈로그 전체 출력과 메타데이터 수정 시 이미지 해시 보존을 검사한다.

`.test-data/`는 테스트 키 등 민감한 임시 파일을 포함하므로 배포/커밋하지 않는다. test-results의 portable ZIP에는 키가 없다. 예제 파일에 테스트 키를 넣지 않는다.

## 실제 Android 설치 확인

ADB의 serial을 먼저 확인하고 테스트용 에뮬레이터만 대상으로 한다. 이번 검증은 read-only Pixel 6 API 33 AVD, serial emulator-5556에서 수행했다. 일반적인 확인 명령:

```sh
adb devices
adb -s TEST_SERIAL install -r FIRST_BUILD_APK
adb -s TEST_SERIAL shell am start -W -n PACKAGE_ID/.MainActivity
adb -s TEST_SERIAL install -r UPDATE_BUILD_APK
adb -s TEST_SERIAL shell dumpsys package PACKAGE_ID
```

첫/업데이트 APK는 같은 package ID·서명키여야 하며 다음 versionCode를 사용한다. signature verify가 성공해도 resources.arsc 압축 오류 등으로 설치가 거부될 수 있으므로 패키징 변경 후 설치 확인이 유효하다.

실제 카카오톡 검증은 별개다. 테마 목록 인식, 선택/적용, 친구·채팅 목록, 짧은/긴/연속 말풍선, 배경·아이콘·글자색, 잠금화면을 확인하고 카카오톡/OS 버전과 캡처를 기록한다. iOS도 파일 열기와 같은 화면 확인이 필요하다. 테스트 계정/기기 준비가 없으면 확인 완료로 보고하지 않는다.

## 확인된 회귀 방지 항목

- Android R+용 resources.arsc는 압축하지 않고 4바이트 정렬.
- `.ktheme` ZIP 루트에 KakaoTalkTheme.css와 Images/ 배치.
- 9-patch 테두리 투명도, 늘림 구간과 내용 구간의 분리.
- iOS CSS 문자열 이스케이프와 top/left/bottom/right 인셋 순서.
- Android 문자열 리소스의 apostrophe/quote 이스케이프.
- 선택 키 fingerprint 불일치 시 Android 실패, iOS 결과 유지.
- 프로젝트 ZIP에서 서명키/비밀번호 제외, 이미지 해시 보존.

`screen-workflow`는 여섯 화면별 실제 DOM 항목을 카탈로그와 대조하고, 모든 공통 원본의 입력 UI, 색상 수정의 Canvas 픽셀 반영, 다른 화면 재설정 시 보존, 이전/다음 이동, 전체 목록 복귀, 작은 화면 폭을 검증한다. `screen-workflow.test.mjs`와 `audit-screens`는 모든 속성·물리 이미지·공통 슬롯의 접근 경로를 검사한다. 생성 규칙을 수정하지 않은 UI 변경만으로 통합 APK 검증을 불필요하게 반복할 필요는 없다.

말풍선 미리보기 경계 회귀는 `node test/preview-seams.mjs`로 확인한다. 원본 PNG 내부색, 소수점 위치/크기의 불투명·반투명 비트맵과 여러 늘림 구간을 검사한다. 기본은 Chromium이며 `SEAM_BROWSER=webkit`은 별도 WebKit 설치가 필요하다.

0.4.0은 `node test/state-geometry.mjs`로 상태별 픽셀·적용 원본 표시·iOS 드래그/실행취소·Android 다중 가이드 편집/원본 복귀를 검증한다. `test/geometry-provenance.test.mjs`는 전체 146개 출력의 원본 추적을 실제 픽셀과 대조하며 원본 그림 보존·새 기하 검증·복제·백업·캐시를 검사한다. integration은 새 기하를 넣은 두 플랫폼을 실제 생성하고 다중 9-patch의 AAPT2 수용과 서명/업데이트를 확인한다.


0.5.0 추가 검증은 `node --test test/composition.test.mjs`와 `node test/unified-design.mjs`다. 전체 단위 실행은 이 검사를 포함한다. 색상/이미지 본체, 비율 보존 캐릭터, 양 플랫폼 배율, 첫/연속의 별도 색상·이미지·장식/비활성화, 가변 여백, 원본 추적, 캐시·복제·백업과 출력 예외를 검사한다. iOS 수동 가이드의 헤더 크기 변경/해제 보정도 검사한다.

unified-design은 실제 축소 Canvas 좌표의 호버/클릭과 키보드 대상 목록, 정확한 속성/출력 이동, 공통 설정의 프로젝트 불변, 별도 연속 캐릭터 등록, 색상/이미지 전환·원본 보존, 선택 출력 연결·실행취소/다시실행, 역할 검색과 좁은 화면을 검사한다. test-results/unified-design-*.png와 unified-design-report.json을 남긴다. integration은 기존 다중 가이드 검증을 유지하면서 첫/연속에 서로 다른 본체·장식 원본을 넣어 실제 APK·ktheme를 생성하며 색상/이미지 모드 모두 컴파일한다. .test-data는 배포하지 않는다.


0.6.0 저장소 검증은 `node --test test/project-store.test.mjs`와 `node test/storage-workflow.mjs`다. 전체 단위에 이관 전후 전체 출력 픽셀/바이트 보존, ID·키/bindings·구형 원본 보존, 독립 파일 복제, 패키지/경로 위장·공용 fallback 거부, 백업 manifest·구형 호환·실패 잔여물·중단 재실행·실행 잠금·중복 ZIP/링크 거부를 포함한다. storage-workflow는 실제 UI의 경로/용량/이미지 목록, 백업 이름·로컬 보관, 중복 가져오기 선택과 독립 복원, 범위를 벗어난 asset/preview 요청 거부, 800px 캡처를 확인한다. 근거는 test-results/project-storage-report.json과 project-storage-desktop.png / project-storage-small.png다.

integration은 구형 자료를 패키지 폴더로 이관한 뒤 그 위치에서 APK·ktheme를 생성하고, 전역 keys/bindings를 유지한 같은 키의 versionCode 1→2를 검증한다. browser는 manifest가 있는 새 백업의 루트/내용을 확인한다. state-geometry의 fixture도 공개 프로젝트 가져오기 경로로 등록해 전역 파일의 우연한 재사용을 막는다. 실행 중인 사용자 서버가 있으면 직접 .data를 여는 이관 테스트를 수행하지 않으며 격리 .test-data를 쓴다.


0.7.0 원본 이름 검증은 `node --test test/asset-names.test.mjs`다. 모든 역할/출력의 고유 경로, 동일 그림의 독립 슬롯, 플랫폼/배율 예외와 공통 복귀, 불변 버전·동시 등록·실행취소/캐시, 원본 변조/검증 정보 누락, 구형 참조 이관 전후 전체 출력 동일성, 전체146 원본 ZIP과 포맷1·2 호환을 확인한다. 전체 `node --test test/*.test.mjs` 및 integration/storage-workflow/unified-design/state-geometry/screen-workflow/editor-upgrade/browser도 실행한다.
