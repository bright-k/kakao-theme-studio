# 다음 agent를 위한 인수인계

현재 앱 버전은 0.4.0, compilerVersion은 0.4.1이다. REVIEW-0.4.0.md와 아래 공통 ID 변경을 확인한다. 화면별 편집 변경은 REVIEW-0.3.0.md와 screen-coverage.json을 확인한다. 작업 대상은 `/Users/bright/Desktop/work/kakao-theme-studio`이며 다른 사본과 동기화하지 않는다. 이 폴더의 Studio.command로 실행한다. README, AGENTS, REVIEW-0.2.0, SUPPORT-MATRIX, ARCHITECTURE, TESTING 순으로 확인한다. 별도 글로벌 스킬은 필요 없다.

## iOS·Android 공통 ID (2026-10-25)

- 사용자 요청에 따라 신규·기존 프로젝트 모두 iOS ManifestStyle/-kakaotalk-theme-id와 Android 패키지명에 packageId를 그대로 사용한다. src/styles.mjs의 자동 `.ios` 추가를 제거했으며 입력값 자체가 `.ios`로 끝나면 그대로 유지한다.
- schemaVersion과 프로젝트 JSON에는 별도 변경이 필요 없다. ZIP 복원과 복제에도 같은 규칙이 적용되며 Android package ID/fingerprint bindings는 유지한다. 사용자 프로젝트·키·기존 빌드 파일은 수정하지 않았다. 기존 결과는 다시 생성해야 바뀌고, 과거 배포한 iOS 테마와는 ID가 달라진다. 사용자가 기존 프로젝트에도 적용하도록 명시적으로 요청했다.
- 출력 변경으로 src/catalog.mjs의 COMPILER_VERSION을 0.4.1로 올려 예전 출력/미리보기 캐시와 분리했다. 생성 창과 설정의 ID 안내, README/ARCHITECTURE/TESTING도 공통 ID에 맞췄다.
- 기존 sample-project.zip 복원·컴파일·ktheme 내부 ID, 백업/복원·복제·명시적 .ios 입력 보존·구버전 revision 분리 회귀 검사를 추가했다. 검증 결과는 VERIFICATION.md의 공통 ID 항목을 따른다.

## 새 프로젝트 패키지명 지정 (2026-10-25)

- 작업 대상은 현재 프로젝트 `/Users/bright/Desktop/work/kakao-theme-studio`다. 사용자 확인 없이 바탕화면 `/Users/bright/Desktop/KakaoThemeStudio`를 실행 대상으로 추정해 변경 파일을 추가 복사한 것은 잘못된 범위 판단이었다. 사용자가 현재 프로젝트로 범위를 바로잡아, 바탕화면의 12개 파일은 사전 소스 백업에서 복원하고 직접 추가한 테스트 파일 1개만 제거했다. 복사 후 다른 변경이 없음을 먼저 확인했고 복원 후 원본 바이트 일치도 확인했다. 현재 프로젝트의 기능 수정은 유지하며 양쪽 사용자 .data·키·빌드 결과는 변경하지 않았다. 이후 바탕화면 사본을 동기화하지 않는다.
- `＋`는 테마 이름·Android 패키지명 입력 창을 연다. 패키지명은 선택 입력이며 빈 값은 기존 고유 ID를 자동 생성한다. 형식/길이/Java 예약어/기존 프로젝트 중복을 거부하고 오류 시 입력을 유지한다. 취소로 프로젝트를 만들지 않는다.
- POST projects/newProject에 기존 packageId의 선택 입력 경로를 추가했다. 서버 저장 큐에서 신규 ID 중복 검사를 직렬화해 동시 요청 및 PUT/ZIP 가져오기 우회도 차단한다. 기존 프로젝트의 packageId 변경 금지와 서명 fingerprint 연결을 유지한다. 테마 복제는 기존 자동 새 ID 방식을 유지한다.
- 최초 패키지명 입력 추가 당시에는 iOS에 `.ios`를 붙였으나, 후속 공통 ID 요청으로 위 0.4.1 규칙으로 바뀌었다. 서버 변경 반영에는 재시작과 브라우저 새로고침이 필요하다.
- 단위/API 25개, browser, state-geometry, screen-workflow, editor-upgrade, audit-screens 통과. 데스크톱/390px 생성 창·중복 오류 캡처를 확인했다. integration에서 `com.bright.theme.forest_2026`으로 실제 APK 컴파일·서명·같은 키 업데이트 및 다른 키 차단을 검증했다.
- 근거: 작업 체크아웃의 test-results/browser-report.json, new-project-dialog.png, new-project-error-mobile.png 및 `.test-data/integration-1792938167929/test-summary.json`. 테스트 키는 격리한 .test-data에만 있고 설치본에 복사하지 않았다. 실제 기기 설치/카카오톡 적용은 이번에 추가 검증하지 않았으며 deviceVerified는 false다. 복제 시 사용자 지정 패키지명은 이번 범위에 포함하지 않는다.

## 0.3.0 화면별 작업

- 여섯 화면을 고르면 미리보기와 옆 설정이 동기화된다. 화면별 공통 원본, 말풍선 정책, 잠금 설정, iOS/Android 전체 세부 항목과 이미지 변형을 편집한다.
- `screen-model.js`가 전체 카탈로그와 공통 SLOTS를 화면에 연결하며, 누락·미분류를 단위 테스트와 audit-screens로 차단한다. 모든 상태·배율·원본 9-patch 편집을 유지했다.
- 공통 목록·프로필·탭은 실제 공통값임을 안내한다. 화면 재설정은 표시된 설정에만 적용한다. 전체 대화상자를 닫으면 원래 화면 편집으로 복귀한다.
- 생성 규칙과 schema는 바꾸지 않았으므로 compilerVersion은 0.2.0을 유지한다. 아이콘·시작화면 미리보기는 기존 출력 파일에서 읽는다.
- 검증은 .test-data에서 수행했다. 사용자 .data와 examples/sample-project.zip을 덮어쓰거나 테스트 키를 배포하지 않는다.

## 구현 완료

- 공통 디자인 입력에서 iOS ktheme와 자체 서명 APK 생성. 로컬 Node ESM/정적 브라우저 모듈, Android 공식 독립 빌드 도구 사용.
- 공식 26.9.0 기준 iOS 105개 속성, Android 49개 색상, 이미지 82개 그룹/146개 배율·화면 슬롯 카탈로그와 개별 편집.
- 잠금화면 전용 UI: 비밀번호 표시 1~4 입력 전·후 8개 이미지, iOS 키패드 눌림 이미지, 양 플랫폼 배경·숫자·안내 색상, Android 눌림·패턴 색상.
- 상태/배율별 리소스 교체, 원본 Android 9-patch, 배경 이미지 끄기·크롭, 리소스 템플릿 ZIP·파일명 매칭 일괄 등록.
- 실행취소·다시실행, 디자인을 유지한 테마 복제와 새 앱 ID 발급.
- 키 생성·잠금 해제·암호화 백업·복원, 고정 fingerprint, versionCode 증가. 키 비밀번호는 서버 메모리에만 두고 재실행 후 다시 입력한다.
- 프로젝트 백업은 세부 설정과 원본 참조를 포함하고 개인키를 제외한다.

## 검증 근거

VERIFICATION.md, coverage-before/after.json, integration-report.json, browser-report.json, editor-upgrade-report.json, emulator-report.json을 확인한다. 18개 단위·회귀 테스트와 두 브라우저 흐름이 통과했다. 전 리소스 템플릿을 다시 가져온 상태에서 실제 APK를 컴파일·서명했고 Android 13 에뮬레이터에서 신규 설치·Activity 실행·다음 버전 업데이트를 확인했다.

실제 iPhone 및 카카오톡 내부 테마 인식·적용은 여전히 미검증이다. deviceVerified/actualAppVerified를 근거 없이 true로 바꾸지 않는다. 생성·설치 가능한 것과 실제 카카오톡 화면에 적용되는 것은 별도다. 가로/태블릿 파일은 생성하지만 해당 실기기 표시도 미검증이다.

## 데이터 보존

사용자 데이터는 .data다. 프로젝트, 키, bindings, 빌드 결과를 삭제하거나 테스트 데이터로 덮어쓰지 않는다. 이전 schemaVersion 1 프로젝트는 새 필드가 생략돼도 동작한다. 서버 코드 업데이트는 재시작이 필요하고 키의 잠금 해제가 다시 필요하다. 테스트 키가 들어 있는 .test-data는 배포·커밋하지 않는다. examples의 APK와 ZIP에는 개인키를 넣지 않았다.

## 구조와 수정 주의

- catalog.mjs와 profile-26.9.0.json이 속성/리소스 등록을 담당한다. 공식 템플릿 식별자와 카탈로그 일치 테스트가 있다.
- styles.mjs는 typed 재정의를 CSS/XML로 직렬화한다. resources.mjs는 완성 이미지, 9-patch 가이드, 옵션과 전체 지원 범위를 검증한다.
- editor-service.mjs는 전체 리소스와 미리보기 파일 메타데이터를 연결한다. public/catalog-editor.js, history.js, preview-renderer.js가 편집·복원·출력 리소스 검토를 담당한다.
- 출력 규칙이 바뀌면 COMPILER_VERSION을 갱신한다. 미리보기·키 관련 입력을 셸 명령 문자열에 넣지 않는다.
- Android resources.arsc는 STORE 및 4바이트 정렬을 유지한다. 서명 후 APK를 수정하지 않는다.
- 카카오 캐릭터 PNG를 기본 자산으로 복사하지 않는다. 프로필의 기준 범위·출처와 실제 적용 확인 여부를 유지한다.

## 남은 작업

최우선은 준비된 실제 카카오톡/iPhone 테스트 환경에서 인식·적용·화면 차이를 검증하는 일이다. 새 버전 프로필 추가는 별도로 검증한다. Keychain, 작업 취소·재시작 복구, 프로세스 간 버전 락, 캐시 자동 정리는 아직 구현하지 않았다. 한 dataRoot에서 서버와 CLI를 동시에 빌드하지 않는다. 이미지 업로드는 PNG/JPEG/WebP이며 외부 SVG와 임의 CSS/XML 삽입은 지원하지 않는다.

복제는 새로운 ID와 초기 버전으로 만든다. 동일 ID의 프로젝트 ZIP을 다시 가져오면 기존 프로젝트를 열도록 안내한다. 미리보기는 자체 화면으로 글꼴·배치의 픽셀 일치를 보장하지 않는다.

## 0.3.1 미리보기 말풍선 경계

사용자가 확대 캡처에서 말풍선 분할 경계의 가는 밝은 선을 보고했다. 원본 PNG 내부는 균일했다. drawNine은 임시 Canvas의 정수 픽셀 경계에 조각을 합친 뒤 목적지에 한 번 그린다. 분할 경계의 소수점 좌표와 반투명 조각 중첩을 피한다. 생성 PNG/9-patch/패키징은 변경하지 않아 compilerVersion 0.2.0을 유지했다. test/preview-seams.mjs는 불투명/반투명·iOS/Android 배율·다중 늘림 구간의 내부 픽셀을 검사한다.

## 0.4.0 상태·원본·기하 편집

- 상태 미리보기: 0~4자리 비밀번호/누른 숫자, 전체 8개 탭, Android 프로필 1~3/전체 원본, 첫·연속 말풍선과 iOS 선택 상태, 버튼/목록 기본·누름·선택, 기본/라이트 배너. 대표 레이아웃이며 실제 기기 검증은 아니다.
- 실제 출력별 source 메타데이터와 전체 sources 색인으로 적용 원본·기본 생성·비활성화·재정의·가이드 출처를 안내한다. src/provenance.mjs와 전체 픽셀 대조 테스트가 근거다.
- iOS 말풍선은 기존 typed overrides를, Android 9-patch는 resourceGeometry를 편집한다. 원본 픽셀은 보존하고 테두리 가이드만 바꾼다. 다중 늘림 구간·복제·백업·캐시를 지원한다.
- compilerVersion 0.4.0으로 이전 미리보기 캐시와 분리한다. schemaVersion 1의 선택 필드 추가이며 기존 프로젝트와 샘플은 호환된다.
- 실행취소 갱신이 끝나기 전에 다음 작업을 시작하지 않으며 가이드 입력 DOM을 매번 재생성하지 않는다.
- 사용자 프로젝트/키/예제는 보존한다. 새 테스트는 .test-data에만 만들고 키와 생성 APK를 사용자 examples로 복사하지 않는다.

0.4.0 검증 근거는 VERIFICATION.md, state-geometry-report.json, integration-0.4.0.json, screen-coverage.json과 coverage-after.json이다. 단위 23개 및 기존/신규 브라우저 검증이 통과했다. 새 기하를 포함한 실제 서명 APK 생성·업데이트 검증도 통과했다. 이전 18/20개 기록은 과거 버전의 이력이다.
