# 검증 기록

사용자 요청으로 이전 프로젝트, 등록 서명키, 생성 빌드 및 이전 예제 파일을 삭제하고 새 샘플 하나로 초기화했습니다. 아래 내용은 당시의 검증 이력이며 이전 생성 파일은 현재 존재하지 않을 수 있습니다. 새 샘플은 examples/sample-project.zip에 있습니다.


## 0.7.0 역할별 원본 이름·버전·이관 (2026-10-26)

- `node --test test/*.test.mjs`: 44개 통과. 새 asset-names 7개는 모든51 공통/146 출력의 안전·고유 경로, 같은 그림의 명시 슬롯별 독립 파일과 플랫폼 공통 대체, 불변 버전·동시 등록·실행취소·캐시, 플랫폼/배율 전용 원본·.9 가이드·공통 복귀, 변조/검증 정보 누락, 이관 전후 전체 출력 동일성, 전체146 원본 ZIP·포맷1/2 호환을 확인한다.
- `node test/storage-workflow.mjs`, `node test/unified-design.mjs`, `node test/state-geometry.mjs`, `node test/screen-workflow.mjs`, `node test/editor-upgrade.mjs`, `node test/browser.mjs`: 모두 통과. 공통 업로드와 정확한 배율 재정의의 실제 파일 경로/assetHashes, 재연결/실행취소, 독립 복원, 모든 상태/가이드, 개인키 없는 새 백업, 실제 APK/ktheme UI 다운로드를 유지했다. 상태 검사 기준은 가져오기로 이관된 초기 프로젝트다. 데스크톱/800px 저장소 캡처를 확인했다.
- `node test/integration.mjs`: 이관된 이름별 원본에서 실제 두 플랫폼 컴파일·서명·정렬, resources.arsc STORE, 다중9-patch·합성·인셋, 같은 키 versionCode 1→2, 키 복원과 다른 키 차단 통과. 근거: docs/integration-0.7.0.json, .test-data/integration-1792947397938/test-summary.json.
- audit-screens/audit-coverage/support-matrix 통과. iOS105/Android49/이미지82그룹146출력/공통51, 누락 없음·메타데이터 변경의 이미지 해시 보존. 앱/컴파일러0.7.0, storageVersion2, assetNamingVersion1, backupVersion3이다.
- 현재 .data 프로젝트2개를 확인하고 서버를 종료한 뒤 이관했다. 해시 참조가 있는 프로젝트1개·원본1개를 새 경로로 복사했다. 각 프로젝트의146 PNG를 포함한 전체 생성 파일 해시가 전후 동일하며 원본·키·빌드·백업182개 파일은 변경하지 않았다. 키는 내용 복사 없이 크기/수정시각/inode만 대조했다. 이관 전 theme/storage·원본 보존 기록은 .data/backups/asset-names-transition-2026-10-25T16-58-59-681Z에 있다. 같은 인증 링크/포트로 새 서버 실행을 확인했다. 사용자 디자인/프로젝트 ID/서명 연결은 유지했고 다른 체크아웃은 변경하지 않았다.
- 실제 카카오톡 적용/실기기 설치는 추가하지 않았다. deviceVerified/actualAppVerified=false이며 사용자 화면·개인키·인증값은 새 공개 근거에 포함하지 않았다.

## 0.6.0 프로젝트 저장소·백업·실제 이관 (2026-10-26)

- `node --test test/*.test.mjs`: 37개 통과. 새 project-store 5개는 패키지별 복사·기존 원본/키·bindings 보존·이관 재실행·146개 출력 바이트 일치, 독립 복제와 이름/패키지 규칙, 전역 fallback 거부, 버전별 백업/manifest·구형 호환·중복 실패의 무잔여 등록, 중단 자료 보존·실행 잠금·중복 ZIP·링크 거부를 확인한다.
- `node test/storage-workflow.mjs`: UI 저장 위치/자산 수·용량·원본/사용처, 한국 시간/패키지명 백업 파일명과 로컬 보관, 중복 가져오기의 기존 열기/독립 복사, projectId 없는 조회 및 다른 프로젝트의 자산/미리보기 접근 거부, 800px 화면을 확인했다. 데스크톱/좁은 화면 캡처를 확인했다. 근거: docs/project-storage-report.json, test-results/project-storage-desktop.png / project-storage-small.png.
- `node test/unified-design.mjs`, `node test/state-geometry.mjs`, `node test/screen-workflow.mjs`, `node test/editor-upgrade.mjs`, `node test/browser.mjs`: 모두 통과. 51개 공통 원본, 첫/연속 독립 본체·캐릭터, 모든 상태·원본/가이드·실행취소·복제, 프로젝트 생성/저장/키/실제 두 플랫폼 생성·다운로드와 새 백업의 개인키 제외를 유지했다. 상태 fixture는 공개 가져오기로 등록해 공용 자산의 우연한 재사용을 배제했다.
- `node test/integration.mjs`: 구형 프로젝트를 먼저 패키지명 폴더로 이관하고 해당 assets에서 컴파일해 프로젝트 builds에 실제 APK/ktheme를 생성했다. keys/bindings는 workspace에 유지했다. 색상·이미지 본체+첫/연속 별도 캐릭터, 다중 9-patch, iOS 인셋, AAPT2, resources.arsc STORE/4바이트 정렬·서명·동일 인증서의 versionCode 1→2·키 복원·다른 키 차단 통과. 근거: docs/integration-0.6.0.json, .test-data/integration-1792945357546/test-summary.json.
- audit-screens/audit-coverage/support-matrix 통과. 카탈로그 105개 iOS 속성·49개 Android 색상·82개 이미지 그룹/146개 출력·공통 51개 누락 없음, 메타데이터 수정의 이미지 해시 보존을 확인했다. compilerVersion 0.6.0이다.
- 실제 현재 작업 폴더의 서버를 검증 후 재시작해 기존 2개 프로젝트를 패키지명 폴더로 이관했다. 이관 전 API/디스크 일치, 원본 파일 7개의 내용/메타데이터 불변과 이관 전후 theme JSON 동일, 새 서버의 모든 프로젝트 경로·storageVersion 2 응답을 확인했다. 복구용 사본과 원본 해시 기록은 .data/backups/storage-transition-2026-10-25T16-27-31-393Z이며 개인키는 복사하지 않았다. 기존 인증 링크를 유지했다. 원본 JSON/공유 자산·기존 빌드/전역 백업/키·서명 연결은 삭제하거나 변경하지 않았다.
- 실제 카카오톡 적용과 이번 APK의 실기기 설치는 추가 확인하지 않았으며 deviceVerified/actualAppVerified는 false다. 사용자 프로젝트 내용/화면/개인키를 새 공개 보고서나 캡처로 복사하지 않았다.

## 0.5.0 공통 디자인·클릭 탐색·첫/연속 독립 말풍선 (2026-10-26)

- `node --test test/*.test.mjs`: 32개 통과. 새 composition 6개는 색상/이미지 본체+캐릭터, 비율·고정 영역과 양 플랫폼 배율, 첫/연속의 별도 본체/장식 및 선택적 비활성화, 기하·원본 추적, 캐시·복제·백업·예외 보존, 원본 .9.png 승격과 iOS 좌표 보정을 검사한다. 기존 146개 출력/모든 공통 원본 픽셀 대조도 유지했다.
- `node test/unified-design.mjs`: 통과. 축소 Canvas의 실제 포인터 호버/클릭, 키보드 대상 목록, 선택만으로 JSON 불변, 정확한 설정/출력 이동, 본체 모드·원본 보존·상속 표시, 연속 전용 캐릭터 등록, 선택 출력의 공통 연결·실행취소/다시실행, 역할 검색·800px 화면을 확인했다. 근거: docs/unified-design-report.json, test-results/unified-design-desktop.png 및 unified-design-small.png. 데스크톱/좁은 화면 캡처를 확인했다.
- `node test/state-geometry.mjs`, `node test/screen-workflow.mjs`, `node test/editor-upgrade.mjs`: 최종 첫/연속 UI를 포함해 모두 통과. 모든 51개 공통 입력과 105개 iOS 속성·49개 Android 색상·82개 이미지 그룹/146개 출력 접근 경로, 비밀번호 8개/키패드·선택/지역탭/프로필/버튼 상태, iOS 드래그와 Android 다중 가이드·원본 복귀, 세부 리소스·일괄 등록·템플릿·백업 흐름을 유지했다.
- `node test/browser.mjs`: 프로젝트 생성/오류/저장/전환, 키 생성, 실제 두 플랫폼 생성·APK/ktheme 다운로드, 공통 ID 일치와 개인키 없는 ZIP 백업 통과. 근거: test-results/browser-report.json. 첫/연속 추가 범위는 이후 unified-design 및 integration으로 별도 검증했다.
- `node test/integration.mjs`: 첫 번째에 색상 본체+캐릭터, 연속에 별도 이미지 본체+전용 캐릭터를 넣어 실제 APK·ktheme를 생성했다. 업데이트에서는 첫 본체도 이미지 모드로 전환했다. AAPT2 컴파일, resources.arsc STORE/4바이트 정렬·서명, 동일 ID/인증서의 versionCode 1→2, 키 복원과 다른 키 차단 통과. 근거: docs/integration-0.5.0.json 및 .test-data/integration-1792943508548/test-summary.json.
- `audit-screens`, `audit-coverage`, `support-matrix` 통과. screen-coverage.json은 toolVersion 0.5.0 / 공통 51개 / 누락 없음이며 coverage-after.json은 146개 출력 완비와 메타데이터 수정 시 이미지 해시 보존을 기록한다. compilerVersion 0.5.0으로 이전 캐시를 분리했다.
- 기존 사용자 .data·키·bindings·예제·빌드를 변경하지 않았고 테스트는 .test-data에 격리했다. 실제 기기 설치나 카카오톡 적용은 이번에 실행하지 않았으며 deviceVerified/actualAppVerified는 false다.

## iOS·Android 공통 ID 검증 (2026-10-25, compilerVersion 0.4.1)

- `node --test test/*.test.mjs`: 26개 통과. 기존 sample-project.zip을 복원해 생성한 실제 ktheme 내부 iOS ID가 packageId와 같고 입력 프로젝트 JSON은 변경되지 않음을 확인했다. 백업/복원·복제·명시적 `.ios` 입력 보존과 0.4.0 revision 캐시 분리도 확인했다.
- `node test/integration.mjs`: 실제 서명 APK의 검증된 packageId와 생성한 ktheme 내부 `-kakaotalk-theme-id`의 정확한 일치를 확인했다. APK 정렬·서명, 동일 키 versionCode 1→2, 키 복원 및 다른 키 차단도 통과했다. 근거: `.test-data/integration-1792939033461/test-summary.json`.
- `node test/browser.mjs`: 생성 창의 공통 ID 안내와 실제 다운로드한 iOS ktheme 내부 ID 일치, 지정 패키지명으로 두 플랫폼 생성·다운로드·백업 통과. test-results/browser-report.json과 새 생성 창 캡처를 확인했다.
- state-geometry, screen-workflow, editor-upgrade 및 audit-screens 모두 통과했다. 화면 연결 누락은 없다.
- 현재 작업 프로젝트만 수정했다. 사용자 .data·서명키·기존 결과와 바탕화면 사본은 변경하지 않았다. 기존 프로젝트도 다시 생성하면 iOS의 자동 `.ios` 접미사가 제거되며 기존 iOS 배포본과 ID가 달라진다. 실제 카카오톡 적용은 추가 검증하지 않았다.

## 새 프로젝트 패키지명 지정 검증 (2026-10-25, 공통 ID 변경 전 이력)

- `node --test test/*.test.mjs`: 25개 통과. 사용자 지정/자동 패키지명, 형식·길이·Java 예약어, iOS ID 연결과 백업/복원, 서버 중복·동시 생성·PUT/ZIP 우회 거부 및 기존 ID 불변을 확인했다.
- `node test/browser.mjs`: 생성 창 취소, 잘못된 형식·예약어·중복 오류와 입력값 유지, 사용자 지정 ID 저장, 빈 입력의 자동 생성, 프로젝트 전환과 개인키 없는 백업을 확인했다. UI에서 실제 두 플랫폼 생성과 APK 다운로드도 통과했다.
- 생성 창과 중복 오류의 데스크톱/390px 캡처를 육안 확인했다. 근거는 test-results/new-project-dialog.png, new-project-error-mobile.png, browser-report.json이다.
- `node test/integration.mjs`: `com.bright.theme.forest_2026`으로 실제 APK 컴파일·정렬·서명·ID 검사, versionCode 1→2와 인증서 유지, 키 백업/복원·다른 키 차단 통과. iOS ID도 지정 패키지명 + `.ios`로 출력됐다. 근거는 `.test-data/integration-1792938167929/test-summary.json`이다.
- `node test/state-geometry.mjs`, `node test/screen-workflow.mjs`, `node test/editor-upgrade.mjs` 및 `node scripts/audit-screens.mjs` 통과. 전체 리소스 연결 누락은 없다.
- 테스트는 격리한 .test-data에서 수행했다. 이번에는 기기 설치·실제 카카오톡 적용을 추가 검증하지 않았다. compilerVersion은 출력 규칙이 같아 0.4.0을 유지한다.

## 0.4.0 상태·원본·시각 편집 검증 (2026-10-25)

- 단위·회귀 23개 통과. 새 검사는 공통 원본 47개를 넣고 전체 146개 출력의 원본 추적과 실제 픽셀을 대조한다. Android 다중 늘림/여백 변경 시 내부 그림 픽셀 보존, 프로젝트 복제·ZIP 복원·캐시 분리와 잘못된 좌표 거부를 확인했다.
- state-geometry 브라우저 검증 통과: 비밀번호 0~4자리의 8개 독립 상태 이미지, 누른 0번 키, 로컬/통화/만화 선택 탭, 전체 프로필 1~3, 연속 선택 말풍선, 버튼 누름/선택 색상·이미지를 픽셀로 확인했다. 상태만 변경했을 때 프로젝트 JSON이 그대로인 것도 확인했다.
- 현재 원본/출력별 재정의 표시와 공통 원본의 가려진 출력 수가 실제 미리보기와 일치한다. iOS 가이드 드래그·개별 늘림·공유 여백·실행취소/다시실행, Android 드래그·다중 늘림 추가/삭제·실제 출력 PNG 반영·원본 가이드 복귀를 확인했다.
- 기존 editor-upgrade, screen-workflow, preview-seams 브라우저 회귀도 통과했다. 시각 편집 캡처를 확인했고, 드래그 중 입력 DOM 교체와 실행취소의 비동기 경합을 보완했다.
- integration에서 새 Android 다중 가이드와 iOS stretch/insets를 넣은 실제 두 플랫폼을 생성했다. AAPT2 컴파일, 서명/정렬, 인증서·버전 유지 업데이트, 키 백업/복원과 다른 키 거부가 통과했다. 근거는 integration-0.4.0.json이다.
- 카탈로그 감사 결과: iOS 105개 속성, Android 49개 색상, 이미지 82개 그룹/146개 출력, 공통 원본 47개. missing은 빈 배열이며 메타데이터 편집 시 이미지 해시도 유지된다.
- 모든 테스트 데이터/키는 격리한 .test-data에 있다. 실제 카카오톡/iPhone 적용 검증은 여전히 미완료다.

## 0.3.1 미리보기 경계 검증 (2026-10-25)

- 생성 말풍선 PNG의 내부 픽셀이 균일함을 확인했다. 미리보기 drawNine의 분할 조각을 정수 경계의 임시 Canvas에 합쳐 한 번에 그리도록 변경했다.
- Chromium의 불투명·반투명, 배율 2/3, 단일/다중 늘림 구간 8가지 내부 픽셀 검사가 통과했다. 소수점 위치와 크기를 사용했으며 반투명 겹침도 검사한다. Chromium 기존 방식에서는 같은 픽셀 검사가 통과했으므로 사용자 캡처와 동일한 GPU 조건의 재현이라고 주장하지 않는다.
- 단위·회귀 20개와 화면별 편집 브라우저 검증도 통과했다. 생성 파일 내용과 서명 규칙은 바꾸지 않았다.
- 임시 WebKit 추가 검증은 이 Mac 환경에서 응답이 멈춰 완료하지 못했고 테스트 프로세스를 종료했다. 실제 사용자 브라우저에서 남는 현상이 있으면 추가 캡처로 확인한다.

## 0.3.0 화면별 편집 검증 (2026-10-25)

- 단위·회귀 20개 통과. 전체 카탈로그와 공통 원본 47개의 화면 연결에 누락이 없다.
- screen-workflow 브라우저 검증 통과: 여섯 화면별 실제 DOM의 속성·색상·이미지 전수 대조, 색상 수정의 Canvas 픽셀 반영, 다른 화면 초기화 시 보존, 전체 목록 복귀, 800px 화면 폭 검증.
- editor-upgrade 브라우저 회귀 통과: 실행취소·복제·ARGB·비밀번호 상태 이미지·패턴·배율별 교체·일괄 등록·템플릿 다운로드.
- browser 제작 흐름 통과: 임시 서명키 생성, 실제 두 플랫폼 생성·APK 다운로드, 개인키 없는 프로젝트 백업. 사용자 데이터와 별도인 .test-data를 사용했다.
- 생성 규칙은 그대로다. 이번 변경으로 실제 기기/카카오톡 검증 범위를 넓혔다고 주장하지 않는다.
- 근거: screen-coverage.json, screen-workflow-report.json, editor-upgrade-report.json, browser-report.json, REVIEW-0.3.0.md.

## 0.2.0 추가 검증 (2026-10-25)

- 단위·회귀 테스트 18개 통과. 카탈로그/공식 템플릿 식별자 일치, 105개 iOS 속성·49개 Android 색상과 146개 출력 슬롯, 전 리소스 템플릿 재등록, 9-patch, 비밀번호 8개 개별 매핑, 백업·복원, 실행취소·복제 등을 확인했다.
- 기존 브라우저 제작·키·파일 생성/다운로드 흐름과 새 전체 구성/일괄 등록/잠금화면/ARGB/실행취소 흐름 통과. `editor-upgrade-report.json`에 근거를 남겼다.
- 통합 APK는 전체 리소스 템플릿을 다시 가져온 상태에서 비밀번호 이미지·개별 색상·ARGB·원본 9-patch를 포함해 생성했다. 서명, 동일 인증서 업데이트, 키 복원과 다른 키 차단이 통과했다.
- 위 APK를 Android 13 에뮬레이터에서 신규 설치 Success, Activity COLD 실행 Status: ok, versionCode 2 업데이트 설치 Success로 확인했다.
- 지원 범위 보고서: `coverage-before.json`, `coverage-after.json`, `SUPPORT-MATRIX.md`.
- 아래 0.1.0 기록의 '6개 테스트' 등은 이전 단계의 기록이다. 실제 카카오톡 내부 적용·iPhone 검증은 여전히 미완료다.

날짜: 2026-10-25 (한국 시간). 이 기록은 실제 실행 결과를 구분해서 기술한다.

## 통과

| 검증 | 실제 결과 | 근거 |
|---|---|---|
| 핵심 단위 테스트 | 6개 통과 | `test/core.test.mjs` |
| iOS 패키지 | 루트 CSS, 이미지 참조, @2x/@3x 및 테마 아이콘 확인 | 단위 테스트, 예제 ktheme |
| Android 컴파일 | AAPT2, javac, D8, resources.arsc, classes.dex 생성 | 통합 테스트 |
| 자체 키 서명 | apksigner verify 통과, 선택한 인증서 fingerprint 일치 | `examples/verified-build/signature-verification.txt` |
| 업데이트 일관성 | 같은 package ID·인증서로 versionCode 1→2 | `docs/integration-report.json` |
| 키 백업·복원 | 암호화 키를 다른 저장소로 가져와 같은 fingerprint 확인, 잘못된 암호 거부 | 통합 테스트 |
| 다른 키 차단 | 기존 테마의 키를 바꾸면 Android 실패, iOS 성공 결과 유지 | 통합 테스트 |
| 브라우저 편집 | 프로젝트 생성·자동 저장·전환, 색·여백, 이미지 업로드 | `docs/browser-report.json` |
| 브라우저 생성 | 키 생성, 두 플랫폼 생성, 실제 APK·프로젝트 ZIP 다운로드 | 브라우저 테스트 |
| 예상 화면 | 친구/채팅 목록/채팅방/잠금화면, 긴 메시지, PNG 캡처 | `test-results/` PNG |
| 접근 경계 | 인증 누락·다른 Origin·경로 이탈 거부 | 브라우저 테스트의 API 검사 |
| 프로젝트 백업 | 자산·고정 ID 유지, 개인키 제외 | 단위·브라우저 테스트 |
| Android 설치 | Android 13(API 33) 에뮬레이터에서 Success | `docs/emulator-report.json` |
| Android 실행 | am start -W Status: ok, UI 트리에 이름·안내·적용 버튼 존재 | `docs/android-ui.xml` |
| Android 업데이트 | 같은 키·앱 ID의 다음 APK install -r Success, 설치 버전 1.0.1/versionCode 2 | 에뮬레이터 보고서 |

도구 버전: Node 24.22.1, JDK 17, Android Build Tools 33.0.1, Platform 33, Playwright 1.62.1 Chromium. APK minSdk 28 / targetSdk 33. 에뮬레이터는 기존 Pixel_6_API_33 AVD를 read-only/no-snapshot-save로 실행했다.

## 발견하고 수정한 문제

서명 검증을 통과한 첫 APK가 Android 설치 중 `resources.arsc must be stored uncompressed and aligned` 오류로 거부됐다. JSZip이 리소스 테이블을 다시 압축한 것이 원인이었다. resources.arsc를 STORE로 쓰고 zipalign 후 서명하도록 수정했다. 수정 후 신규 설치와 업데이트 설치 모두 성공했다. 통합 테스트에 압축 방식 검사를 추가했다.

프로젝트 전환 시 목록 갱신이 선택값을 이전 프로젝트로 되돌리는 문제도 브라우저 테스트 과정에서 수정했다.

## 확인하지 못한 범위

- 테스트 에뮬레이터에 카카오톡이 설치되어 있지 않아 **카카오톡의 테마 목록 인식 및 실제 적용**은 확인하지 못했다.
- 실제 iPhone/iOS 카카오톡 파일 열기·적용도 확인하지 못했다.
- 오래된 에뮬레이터 렌더러의 화면 캡처가 검게 나와 Android 픽셀 화면은 검증 근거로 사용하지 않았다. 설치·실행·UI 트리로 확인했다. 브라우저 미리보기 캡처는 정상이며 별도로 육안 검토했다.
- 다양한 OS, 실제 폰, 태블릿, 가로, 카카오톡의 새 버전, Google Play 출시 정책은 검증 범위가 아니다.

따라서 모든 생성 보고서의 `deviceVerified`는 false다. '실제 Android APK 설치/실행 성공'을 '카카오톡 테마 적용 검증 완료'로 해석하면 안 된다.
