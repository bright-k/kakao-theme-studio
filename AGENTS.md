# Agent 작업 지침

현재 구현은 0.12.0이다. `docs/REVIEW-0.12.0.md`를 먼저 확인한다. `docs/REVIEW-0.11.0.md`를 먼저 확인한다. `docs/REVIEW-0.10.3.md`를 먼저 확인한다. `docs/REVIEW-0.10.2.md`를 먼저 확인한다. `docs/REVIEW-0.10.1.md`를 먼저 확인한다. `docs/REVIEW-0.10.0.md`를 먼저 확인한다. `docs/REVIEW-0.9.1.md`를 먼저 확인한다. `docs/REVIEW-0.9.0.md`, `docs/COMMON-COLORS.md`를 확인한다. `docs/REVIEW-0.8.0.md`, `docs/REVIEW-0.7.1.md`를 먼저 확인한다. `docs/REVIEW-0.7.0.md`, `docs/REVIEW-0.6.0.md`, `docs/REVIEW-0.5.0.md`, `docs/REVIEW-0.4.0.md`를 먼저 읽는다. 화면별 작업은 `docs/REVIEW-0.3.0.md`, `public/screen-model.js`, `docs/screen-coverage.json`을 먼저 확인한다. `docs/REVIEW-0.2.0.md`, `docs/SUPPORT-MATRIX.md`, `docs/coverage-after.json`을 함께 읽는다. 출력 변경 시 `src/catalog.mjs`의 COMPILER_VERSION을 갱신해 이전 미리보기 캐시와 분리한다. 새 리소스/속성은 카탈로그·검증·출력·편집 UI·백업·회귀 테스트와 화면 연결을 함께 갱신한다. `node scripts/audit-screens.mjs`와 `node test/screen-workflow.mjs`로 누락을 검사한다. 공통 원본 SLOTS도 모두 화면에 연결해야 한다. 화면별 색상을 바꾸면서 공통 팔레트를 임의로 변경하지 말고 개별 override를 사용한다. 잠금 비밀번호 표시 8개와 키패드 눌림 이미지는 이미 개별 지원되므로 공통 도형으로 다시 축소하지 않는다.

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
- 새 기하 필드는 검증·visualRevision 캐시·복제·ZIP 백업/복원·실제 APK 컴파일까지 함께 검증한다. 현재 compilerVersion은 0.12.0이다.
- `public/visual-geometry.js`의 드래그 중 DOM을 재생성하지 않는다. 실행취소는 진행 중 잠그고 미리보기·상세 갱신 완료 후 풀어 비동기 경합을 막는다.
- 변경 검증: 단위 테스트 전체, test/state-geometry.mjs, test/screen-workflow.mjs, test/editor-upgrade.mjs. 출력 변경이면 test/integration.mjs도 실행한다.


## 0.5.0 유지 계약

- 공통 원본은 51개이며 첫/연속 캐릭터 4개를 화면 연결·검증·백업에서 누락하지 않는다. bubbleDesign의 group은 선택적 독립 설정이다. 기존 applyTo 입력과 필드 없는 프로젝트를 보존한다.
- 색상/이미지 본체와 장식은 생성 단계에서 합성하고 미리보기는 실제 생성 그림을 사용한다. 확장 논리 크기·늘림·내용 여백은 public/bubble-model.js와 일치해야 한다. 첫/연속의 글자색은 플랫폼 속성이 공유한다.
- 클릭 대상은 실제 렌더링과 함께 기록하고 탐색만으로 프로젝트를 변경하지 않는다. 선택 오버레이를 내보내는 Canvas에 그리지 않는다. 새 검증은 composition.test.mjs와 unified-design.mjs를 포함한다.


## 0.6.0 저장소 유지 계약

- 앱 데이터는 .data/projects/<packageId>/theme.json 및 assets/에 독립 저장한다. 내부 UUID와 키/bindings는 유지한다. 사용자 데이터에 low-level importProject를 호출해 전역 자산을 쓰지 말고 project-store의 등록/복제/복원을 사용한다.
- assets/preview 조회에는 projectId를 포함한다. 프로젝트 밖 파일이나 구형 공유 원본으로 자동 fallback하지 않는다. 이관 원본/구형 빌드/보관 백업과 실행취소용 이미지는 자동 삭제하지 않는다.
- 새 ZIP은 프로젝트 루트 manifest와 검증된 참조 자산만 포함한다. 구형 ZIP 호환·중복 거부·staging 등록을 유지한다. project-store.test.mjs와 storage-workflow.mjs를 검증에 포함한다. 사용자 실제 저장소 이관은 서버/CLI 실행 잠금과 원본 보존 후에만 수행한다.


## 0.7.0 원본 파일명 유지 계약

- 원본은 assets/common·assets/ios·assets/android 아래 역할/상태/배율과 불변 버전으로 자동 등록한다. asset-names의 매핑을 사용하고 최종 카카오 출력 파일명은 변경하지 않는다. 서로 다른 명시적 슬롯은 독립 파일이며 같은 항목의 공통 플랫폼/대체 연결은 유지한다.
- 원본 읽기·캐시·복제·백업에 assets/index.json과 theme.assetHashes를 함께 검증한다. 새 버전을 덮어쓰거나 기존 보관 파일을 자동 삭제하지 않는다. 폴더/최신 버전 존재로 현재 resourceOverrides를 추정하지 않는다.
- 현재 storageVersion=2, assetNamingVersion=1, 백업 format=3이며 구형 format 1·2를 읽는다. 이관 전 설정/해시 원본/키/bindings/빌드는 보존한다. 새 검증에는 test/asset-names.test.mjs와 storage-workflow/unified-design, 전체 단위·기존 브라우저·통합 빌드를 포함한다.

## 0.8.0 Android·선택 영역 유지 계약

- Android targetSdk37/minSdk28, SDK Platform/Build Tools37 이상을 유지한다. 구형 SDK로 자동 fallback하지 않는다. doctor의 안정 버전 탐색과 실제 APK badging 검증을 유지한다.
- 선택 DOM 좌표는 preview-interaction을 사용하며 프레임 border를 중복 적용하지 않는다. 새 장면/도형은 실제 그리기 좌표·clip과 함께 hit를 기록한다. 캐릭터는 실제 nine-slice 투영을 사용한다.
- 배너·버튼의 적용 장면과 플랫폼 크게 보기는 UI 상태이며 프로젝트를 변경하지 않는다. 기존 catalog-editor를 재사용하고 생성 이미지·출력 속성을 미리보기에 사용한다.
- 새 검증은 test/android-policy.test.mjs, test/preview-context.mjs와 test/bubble-fixed-size.mjs를 포함한다.

## 0.9.0 공통 정책 유지 계약

- commonColors의39개 역할 정의를 서버·카탈로그·UI·감사에서 공유한다. 플랫폼 overrides가 최우선이며 공통 입력이 기존 예외나 팔레트를 자동으로 덮어쓰지 않는다. audit-common-colors로 미분류/중복을 검사하고 COMMON-COLORS.md를 갱신한다.
- 캐릭터 보호 영역과 사용자 padding을 분리한다. bodyHeight/폭 확장은 본체 중앙만 늘리며 원본 승격 시 중앙 띠를 제거해 픽셀을 보존한다. 캐릭터 on/off의 첫 본체와 고정 캐릭터 크기 회귀를 유지한다.
- 선택 여유는 overlay에만 적용한다. 실제 hit/생성 PNG에는 포함하지 않고 배너·버튼의 설명용 backdrop은 선택하지 않는다.
- common-colors.test, common-policy-workflow, bubble-fixed-size와 기존 단위·화면·상태·브라우저·통합 빌드를 함께 검증한다.

## 0.9.1 본체 크기 계약

- 자동 색상 본체는 필요한 cap만 남긴 compact 크기다. 캐릭터 on/off에서 bodyHeight와 세로 본문 여백이 같아야 하고 header만 추가한다. 본체 전체 높이를 고정 padding으로 추가하지 않는다.
- bubble-body-size로 실제 그려진 본체 픽셀 높이를 비교한다. 고정 캐릭터는 최소 글자 폭1/한 줄16 기준의 경계도 검사한다. UI는 공통 기준의 적용 최소 여백을 보여 준다.
- 원본 승격은 고정 모서리·꼬리를 보존하고 중앙 띠만 변환하며, 본체와 헤더 조립은 원본 가장자리 픽셀을 보존한다.

## 0.10.0 캐릭터 배치 계약

- shiftX/placementY/layer는 본체 크기·내부 여백을 바꾸지 않는다. 외부 투명 여백과 bodyRect/bodyWidth/bodyInsets를 구분하고 늘림·글자 영역을 넘는 이동은 안전 범위로 제한한다.
- 반투명 겹침은 알파 합성하며 본체 승격은 장식 전 본체를 재생성한다. 슬라이더와 미리보기 드래그가 같은 설정을 수정하며 드래그 취소는 저장하지 않는다.
- character-placement.test.mjs 및 character-placement.mjs로 양 플랫폼의 본체·글자 좌표/줄바꿈·캐릭터 픽셀 불변, 안전 범위·알파·가이드·승격·백업/복제/캐시·슬라이더/드래그/취소/undo를 유지한다.

## 0.10.1 연속 미리보기 계약

- 미리보기는80ms debounce/160ms maxWait이며 작업1개와 최신 대기1개만 유지한다. 완료된 중간 프레임도 표시하고 프로젝트 객체/epoch가 바뀐 결과는 폐기한다. 명시적 전환/undo는 대기 없이 갱신하며 저장350ms와 분리한다.
- input은 유효한 값만 반영하고 활성 입력 DOM/포커스를 보존한다. 이전 편집 콜백이 다음 프로젝트에 적용되지 않도록 소유 프로젝트를 검사한다. 개별 선택 undo를 연속 입력과 합치지 않는다.
- preview-queue.test/live-preview/preview-cache 검증을 유지한다. 변환 캐시는 바이트 해시·크기·옵션을 키로 하고 자산 검증과146출력 동일성을 유지한다.

## 0.10.2 Android 합성 가이드 계약

- 합성 말풍선의 개별 resourceGeometry는 헤더 전체가 아니라 참조 bodyRect에서 현재 본체로 변환한다. 선택 bodyRect는 출력 픽셀 좌표이며 구형64:56 레코드는 본체 프레임으로 읽는다. 저장 원본은 자동 수정하지 않는다.
- 캐릭터/고정 모서리 밖의 안전 늘림과 본체 내부 내용 영역을 유지하고 논리 픽셀에 맞춘다. 원본/출력별 이미지 재정의는 기존 파일별 가이드 우선순위를 유지한다.
- 세부 편집은 실제 적용 가이드를 보여 주고 편집 시 bodyRect를 저장한다. composed-guides.test.mjs/android-composed-guides.mjs의 글자·그림 실제 픽셀, 캐릭터 크기·위치, 저장·backup·undo와 실제 APK 회귀를 유지한다.

## 0.10.3 공통 본체 등록 계약

- 공통 본체 등록/승격은 해당 본체를 이미지 모드로 활성화한다. API/UI의 activateCommonBubbleBody를 공유하고 다른 상태·캐릭터·플랫폼 이미지/가이드 예외를 지우지 않는다. 기존 프로젝트를 열 때 일괄 활성화하지 않는다.
- 기존 원본 적용 버튼과 플랫폼별 기본 이미지/가이드 바로가기는 기존 catalog-editor를 재사용한다. 기본 대상은 해당 플랫폼의 모든 배율이며 개별 이미지는 최종 출력으로 공통 합성보다 우선한다.
- shared-bubble-body.test.mjs/shared-bubble-body.mjs로 자동 활성화·양 플랫폼 픽셀·가이드 독립·이미지 예외/재업로드/undo·기존 자산 보존을 유지한다.

## 0.11.0 플랫폼 본체·캐릭터 계약

- bubblePlatforms의 body/character는 독립적인 선택 예외다. 필드가 없으면 공통/상위 정책을 상속하며 플랫폼 본체가 공통 캐릭터를 끊어서는 안 된다. 연속의 기존 공통 원본·상태 정책도 유지한다.
- 생성/스타일/미리보기/가이드/provenance는 platformBubbleProject의 동일 투영을 사용한다. 공통 원본51개/출력146개와 플랫폼 입력16개의 화면 연결을 유지한다.
- 최종 resourceOverrides가 최우선이다. 기존 사용자 설정을 자동 전환하지 않으며 명시 합성 적용으로 해당 예외만 해제하고 파일·가이드는 보존한다. 본체/캐릭터 복귀도 독립적으로 처리한다.
- 새 원본 역할/해시/이관/복제/ZIP 및 platform-bubbles.test.mjs/platform-bubbles.mjs, 실제 APK와 ktheme의 서로 다른 본체+공통/개별 캐릭터 픽셀 검증을 유지한다.

## 0.12.0 에셋 정리 계약

- 후보는 현재 저장/편집 설정과 undo·redo 전체 참조의 여집합이다. shared assetReferences를 사용하고 비활성/대체/플랫폼 본체·캐릭터도 보호한다. assetHashes는 버전 예약 기록이며 참조 판정과 구분한다.
- 이동 직전 서버 transaction 안에서 참조를 재검사한다. 등록된 다른 탭의 기록도 보호하고 순번이 지난 요청으로 보호를 해제하지 않는다. 자동 정리는 제공하지 않는다. 사용자가 선택한 후보/보관함 원본은 검토 후 영구 삭제도 지원한다. 같은 참조 보호와 버전 예약을 유지한다.
- asset-trash의 manifest를 먼저 기록하고 실제 위치로 중단 상태를 판단한다. 원본 index/해시/버전 번호는 유지하고 복구 시 다른 파일을 덮어쓰지 않는다. 키·빌드·기존 백업은 에셋 정리 대상이 아니다.
- asset-cleanup.test.mjs/asset-cleanup.mjs의 보호·이동/복구·중단/충돌/링크·출력 불변·백업 제외·썸네일/용량·좁은 화면을 유지한다. 사용자 원본을 검증 목적으로 실제 이동하지 않는다.

- 프로젝트 정리는 project-trash로 전체 폴더를 보관/복구하거나 검토 후 영구 삭제한다. 전역 keys/bindings와 구형 이관 원본은 보존한다. retired ID/패키지는 오래된 저장/자동 재이관을 막는다. 영구 삭제 뒤 명시 백업 복원만 같은 정체성 재등록을 허용한다.
- 프로젝트 정리에는 최신 revision과 실행 중 빌드 확인이 필요하다. 링크가 포함된 폴더는 거부하고 마지막 프로젝트 정리 뒤에는 빈 상태를 유지한다. project-management.test.mjs/project-management.mjs를 검증한다.
