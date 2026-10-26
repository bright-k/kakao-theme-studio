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

0.7.1의 `node test/bubble-fixed-size.mjs`는 실제 생성한 iOS PNG/CSS와 Android 9-patch를 읽어 텍스트+여백만으로 그리기 크기를 정한다. 12/72 크기·좌우·보냄/받음·첫/연속 32개 조합에서 한 글자와 긴 문장의 캐릭터 픽셀 폭/높이가 원래 크기와 같은지 검사한다. PNG 최소 크기나 캐릭터 선택 영역 메타데이터를 검증 근거로 대신 사용하지 않는다. test-results/bubble-fixed-size.png 및 bubble-fixed-size-report.json을 남긴다. 실제 카카오톡 재적용 확인은 사용자가 수행하며 자동 검증의 deviceVerified는 false다.

0.8.0 검증:

```sh
node --test test/*.test.mjs
node test/preview-context.mjs
node test/bubble-fixed-size.mjs
node test/unified-design.mjs
node test/state-geometry.mjs
node test/screen-workflow.mjs
node test/editor-upgrade.mjs
node test/browser.mjs
node test/integration.mjs
node scripts/audit-screens.mjs
```

android-policy.test.mjs는 구형 환경 거부, preview 제외, 37.2 폴더/빈 CodeName 수용과 target37/min28을 검사한다. integration은 실제 APK의 aapt badging 검사와 도구 보고서(target37, compile>=37, Build Tools>=37)를 확인한다. 최신 SDK 준비 명령은 README를 따른다. 이미 완료한 관련 검증은 새 변경이 없다면 반복하지 않는다.

preview-context는 네 장면의 설정 연결, 픽셀로 확인한 알림 글자색, 탐색/플랫폼 전환의 데이터 불변과 undo를 검사한다. 알려진 실제 버튼 사각형을 독립 기준으로 overlay를 비교하며 1520/800/390px, 양 플랫폼, 소수점 border와 scale(.83)에서 오차0.12CSSpx 미만을 요구한다. 6개 화면의 clip, 비밀번호28×28 및 탭32×32도 검사한다. context-notification/share/buttons/tab/selection/mobile.png와 preview-context-report.json을 남긴다. bubble-fixed-size도 실제 캐릭터 픽셀과 nineRect의 선택 영역 투영을 대조한다. 기기 적용은 별도이며 deviceVerified=false다.

`node --test test/launcher.test.mjs`는 현재 소스와 실행 서버의 버전 일치를 확인하는 회귀다. storage/assetNamingVersion이 같아도 compilerVersion이 없거나 오래된 서버는 열지 않는다. 실제 서버 복구 시 작업 폴더·포트·PID를 확인하고 같은 인증 주소를 보존하며 프로젝트/키를 변경하지 않는다. 사용자 데이터를 캡처에 남기지 않는다.

0.9.0 추가 검증:

```sh
node scripts/audit-common-colors.mjs
node --test test/common-colors.test.mjs test/composition.test.mjs
node test/common-policy-workflow.mjs
```

common-colors 단위는39개 정책의 양 플랫폼 기본/지정값·예외·우선순위·검증/캐시/복제/이력/ZIP, 보낸/받은 첫 본체의 캐릭터 on/off 모서리·꼬리·여백 반영을 확인한다. composition은 늘린 본체 승격 후 원래 그림의 모든 픽셀이 보존되는지도 검사한다. common-policy-workflow는 실제 UI의 상속 동기화·캐릭터 on/off·공통 배너의 양 Canvas 픽셀·플랫폼 예외/재연결/undo·팔레트 불변·39개 화면 연결을 검사한다. shared-banner.png, shared-color-controls.png, shared-banner-small.png와 common-policy-report.json을 남긴다. preview-context는5px 여유를 포함한 선택 위치를 검사하고 장면 backdrop이 목록에 없음을 확인한다. integration은 공통 지정색을 실제 ktheme CSS와 APK aapt resource dump에서 확인한다.

0.9.1의 핵심 회귀는 node test/bubble-body-size.mjs다. 동일 메시지·radius·padding에서 캐릭터 off/on을 생성하고 실제 renderPlatform의 본체 region과 색 픽셀 높이를 비교한다. 양 플랫폼·양 방향·색상/이미지 본체·3여백 조건을 포함한다. 첨부와 같은13/7/r18 조건은 본체47픽셀, 색 픽셀43으로 켬/끔이 같다. bubble-body-on-off.png 및 bubble-body-size-report.json을 남긴다. 단순히 설정 후 PNG 해시가 달라진다는 것만으로 검증하지 않는다.

bubble-fixed-size는32출력에 한 글자/긴 문장 외에1픽셀 폭·16픽셀 한 줄의 경계도 추가했다. composition은 좌우·작고 큰 캐릭터에서 compact 색상 본체를 승격한 결과를 canonical64×56 모서리·꼬리 픽셀과 대조한다. 기존 이미지 본체 전체 픽셀 보존도 유지한다. 전체 단위와 state/screen/editor/unified/common-policy/browser 및 실제 integration을 함께 확인한다.

0.10.0 검증은 `node --test test/character-placement.test.mjs`와 `node test/character-placement.mjs`다. 기하 조합은 본체 폭·높이/내부 여백 불변과 안전 cap, 수동 가이드의 본체 상대 좌표를 검사한다. 알파 앞/뒤·장식 없는 승격·clone/ZIP/cache도 확인한다. 브라우저는 양 플랫폼·양 모서리·색상/이미지·최소/일반/긴 문장에서 실제 본체 영역·글자 좌표/줄바꿈·캐릭터 마커 픽셀 크기를 비교하고 슬라이더/키보드 Home·값 표시·레이어/undo/redo·CSS 축소 드래그/Escape를 검사한다. test-results/character-placement-controls.png, desktop/small.png와 report.json을 남긴다. integration은 첫/연속에 서로 다른 외부 이동·겹침·앞뒤를 넣어 실제 두 플랫폼을 생성한다.

0.10.1은 `node --test test/preview-queue.test.mjs test/preview-cache.test.mjs`와 `node test/live-preview.mjs`를 포함한다. 가짜 시계로80ms trailing/160ms maxWait/취소를 검증하고 수동 비동기 경계로 최신 대기 합치기·중간 프레임·동시 작업1·실패 복구를 확인한다. 캐시는146 PNG 바이트 동일성과 원본 교체 무효화를 검사한다. 브라우저는 실제 마우스를 누른 채 연속 이동해 Canvas 변화를 기록하고 첫 요청 지연·동시 작업 수·마지막값 저장·HEX 포커스/양 플랫폼 픽셀을 검사한다. 요청을 의도적으로 지연한 뒤 프로젝트를 바꿔 이전 결과와 이전 입력의 blur가 새 프로젝트를 수정하지 않는지도 확인한다. live-preview-report.json/live-preview.png를 남긴다.

0.10.2는 `node --test test/composed-guides.test.mjs`와 `node test/android-composed-guides.mjs`다. 구형192×168 본체 가이드를 헤더 포함 PNG로 변환하고 보호 띠·내용 영역·논리 픽셀 정렬·원본 불변·frame clone/ZIP을 확인한다. 브라우저는 실제 렌더러/생성 PNG의 본문 글자 경계가 실제 본체 색 픽셀 안인지, 짧음/김·이동/겹침에서 캐릭터32px와 양 플랫폼 본체 크기가 맞는지, 편집 시 bodyRect 기록·보호값 표시·blur 안정·undo 원본 복귀를 검사한다. android-composed-guides.png/report.json을 남긴다. integration은 명시 bodyRect가 있는 개별 가이드로 합성 말풍선을 실제 APK/ktheme로 생성한다.

0.10.3은 `node --test test/shared-bubble-body.test.mjs`와 `node test/shared-bubble-body.mjs`다. 공통 업로드가 색상 모드에서 이미지 모드로 넘어가는 API와 실제 양 플랫폼 PNG 픽셀, 가이드만 바꿀 때 반대 플랫폼 해시 불변, 플랫폼 이미지 우선·공통 재업로드 시 예외 보존을 검사한다. 브라우저는 기존 원본 적용/undo·자동 모드·플랫폼 바로가기/all 배율·가이드 독립·iOS2배율 교체/undo/Android 유지·좁은 화면을 검사한다. shared-body-preview/controls.png와 report.json을 남긴다. integration은 공통 본체를 활성화해 ktheme 내부 픽셀을 확인하고 다른 플랫폼의 개별 그림·가이드를 유지해 서명 APK를 생성한다.

0.11.0은 `node --test test/platform-bubbles.test.mjs`와 `node test/platform-bubbles.mjs`(또는 `npm run test:platform-bubbles`)다. 서로 다른 플랫폼 본체+공통 캐릭터, 개별 이미지/크기/배치·연속 비활성화·반대 플랫폼 PNG/Canvas 불변·독립 복귀·최종 예외 우선, immutable 역할 이름/해시·이관146PNG 동일·복제/ZIP·카탈로그16개/화면 연결·API를 검사한다. 브라우저는 scoped drag/undo, 명시 합성 전환/원본 보존,800px·오류0을 확인하고 platform-bubbles-preview/controls.png 및 report.json을 남긴다. integration은 실제 ktheme와 컴파일된 APK9-patch를 해독해 플랫폼 본체색과 공통/개별 캐릭터색을 확인한다. 기존 state/screen/editor/shared/unified/storage/browser/live-preview 회귀도 포함한다.

0.12.0은 `node --test test/asset-cleanup.test.mjs`와 `node test/asset-cleanup.mjs`(`npm run test:asset-cleanup`)다. 현재/비활성/플랫폼/undo/redo 참조 보호, 폐기 이력 제외, 저장된 최신 설정 및 다른 탭/오래된 요청 재검사, 경로/프로젝트/링크/해시/충돌·부분 중단, 재시작 후 복구, 원본 버전 예약·설정/전체 생성 바이트 불변·백업 제외를 검사한다. 브라우저는 실제 두 번 업로드와 undo로 redo를 만들고 후보1개만 표시하는지, 썸네일과 선택 용량, 이동/복구와 이력 유지·설정 불변,800/390px 레이아웃을 확인한다. asset-cleanup-candidates/trash/800/390.png 및 report.json이 근거다. 모든 이동은 격리 샘플에서 수행하며 실제 사용자 데이터에는 읽기 전용 검증만 한다.

프로젝트 관리는 `node --test test/project-management.test.mjs`와 `node test/project-management.mjs`(`npm run test:projects`)다. 전체 폴더·키/bindings·ID 보존과 보관/복구/재시작·구형 재이관/오래된 저장 차단·revision/빌드/링크·영구 삭제·명시 백업 복원, 실제 UI 이름 변경/열기/복제/백업/정리 확인/취소·마지막 프로젝트 빈 상태/재접속/복구와1480/800/390px을 검사한다. project-manager-*.png 및 project-management-report.json이 근거다. 에셋 브라우저는 영구 삭제 확인/취소와 복구 불가까지 추가 검사한다.
