# 검증 기록

사용자 요청으로 이전 프로젝트, 등록 서명키, 생성 빌드 및 이전 예제 파일을 삭제하고 새 샘플 하나로 초기화했습니다. 아래 내용은 당시의 검증 이력이며 이전 생성 파일은 현재 존재하지 않을 수 있습니다. 새 샘플은 examples/sample-project.zip에 있습니다.


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
