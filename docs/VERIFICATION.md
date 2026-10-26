# 0.12.0 에셋·프로젝트 정리 (2026-10-26)

- `node --test test/*.test.mjs`:76개 통과. 신규 에셋6개/프로젝트4개가 현재·비활성·대체·플랫폼·undo/redo 참조 보호, 다른 탭/늦은 요청·최신 저장본 재검사, 보관/복구·영구 삭제·버전 예약, 원본/전체 생성 바이트 불변·백업 제외, 부분 중단/손상/링크/충돌·인증/경로/프로젝트 소유 검증을 확인했다.
- 프로젝트 단위 검증은 전체 폴더·ID/패키지/keys/bindings 보존, 보관/재시작/복구, 최신 revision·생성 작업 보호, 구형 JSON 자동 재이관 및 stale PUT의 부활 방지, 영구 삭제와 유효한 백업 ZIP의 명시 동일 ID 복원을 포함한다.
- `node test/asset-cleanup.mjs` 통과. 실제 두 번 업로드/undo로 만든 redo 원본도 보호하고 후보1개만 표시했다. 썸네일/용량/선택합계·이동/복구/원본바이트·이력 유지/설정 및 모든 생성파일 불변·영구 삭제 검토/취소/실행·800/390px·JS오류0을 확인했다. `test-results/asset-cleanup-{candidates,trash,delete-review,800,390}.png`와 report.json이 근거다. 캡처에서 체크박스 너비 충돌을 발견해 수정한 뒤 재검증했다.
- `node test/project-management.mjs` 통과. 이름 변경·열기·복제·백업 다운로드, 보관/취소/복구, 영구 삭제 범위 검토, 마지막 프로젝트 빈 상태/재접속/보관함 복구, 전역 키 유지와1480/800/390px·JS오류0을 확인했다. `test-results/project-manager-*.png`를 육안 확인하고 project-management-report.json에 기록했다. 확인 영역의 숨김 입력 표시도 수정 후 재검증했다.
- 기존 `test/browser.mjs`, storage-workflow, editor-upgrade, screen-workflow 통과. 생성 UI의 실제 APK/ktheme 다운로드·ZIP 복원도 포함한다. 별도 integration도 통과했다: `.test-data/integration-1792978405329/test-summary.json`. API37·서명/업데이트·resources.arsc STORE/정렬·플랫폼 합성 픽셀·백업 복원/다른 키 거부를 유지했다.
- audit-screens/audit-common-colors/audit-coverage/support-matrix와 git diff --check 통과. 공통 원본51/플랫폼 입력16/공통색39/출력146개 누락0이다.
- 실행 서버0.12.0을 같은 주소/인증으로 반영하고 실제 프로젝트2개의 설정·원본 바이트와 서명키 메타데이터 보존을 확인했다. 관리 API·새 모듈·정리/삭제 UI·양 플랫폼 미리보기·JS오류0 및 런처 재사용을 읽기 전용으로 확인했다. 실제 사용자 프로젝트/에셋을 이동·삭제하지 않았고 사용자 화면도 저장하지 않았다. 실제 카카오톡 적용은 이번 검증에 포함하지 않았으며 deviceVerified=false다.

# 0.11.0 플랫폼별 본체·캐릭터 분리 (2026-10-26)

- `node --test test/*.test.mjs`:66개 통과. 신규3개는 서로 다른 플랫폼 본체/공통 캐릭터, 개별 캐릭터/연속 상태/반대 PNG 불변, final 예외 우선, 플랫폼 원본 이름/이관146PNG 동일/해시/clone/ZIP/API/검증/화면 연결을 확인했다.
- `node test/platform-bubbles.mjs` 통과. 서로 다른 본체에 공통 캐릭터 합성, iOS 캐릭터 그림·크기·겹침/드래그/undo가 Android Canvas를 바꾸지 않음, 연속 비활성화·본체/캐릭터 독립 복귀, legacy final→명시 합성/원본GET200·undo,800px 넘침/JS오류0. test-results/platform-bubbles-preview.png와 controls.png 육안 확인, report.json 기록.
- state-geometry/screen-workflow/editor-upgrade/shared-bubble-body/unified-design/storage-workflow/browser/live-preview 모두 통과. live는 포인터를 누른 동안12회 갱신, 첫 요청83ms, 동시 생성1개, blur 전 HEX/마지막값 저장/프로젝트 전환 경합을 확인했다.
- 실제 integration 통과: `.test-data/integration-1792977082576/test-summary.json`. ktheme의 주황 본체+개별 초록 캐릭터, APK의 보라 본체+공통 캐릭터를 실제 패키지 PNG에서 픽셀 확인했다. 기존 다중 가이드·선택 상태 유지, API37·resources.arsc STORE/4바이트 정렬·서명/같은 키 업데이트·백업 복원/다른 키 거부도 통과했다. 로그는 .test-data/platform-bubbles-*.log에 있다.
- audit-screens/audit-common-colors/audit-coverage/support-matrix 통과. 공통 원본51/출력146/공통색39개 유지, 플랫폼 입력16개 누락0. 실제 카카오톡 적용은 확인하지 않았으며 deviceVerified=false다.

- 실행 서버0.11.0을 같은 포트/인증으로 반영했다. 두 프로젝트 설정 해시와 서명키 메타데이터 보존, 새 모듈200·두 플랫폼 설정 패널·Canvas 렌더링·JS오류0을 읽기 전용으로 확인했다. 메모리 사본의 플랫폼 본체+공통 캐릭터 출처도 일치했고 사용자 프로젝트 파일은 불변이다. 사용자 화면은 저장하지 않았다. 런처의 기존 서버 재사용도 통과했다. 새로고침 후 사용하며 실제 카카오톡 검증/deviceVerified는 미확인 상태를 유지한다.

# 미리보기 옵션 별도 행 (2026-10-26)

- HTML/CSS만 변경했다. 긴 메시지/선택 상태는 화면 탭 아래 별도 행이며 표시 옵션이 없을 때도 최소 높이를 유지한다.
- 격리 브라우저에서 여섯 화면×1520/800/390px의18조합을 확인했다. 탭 x/y/폭/높이와 다음 설정 행 y 불변, 가로 넘침·JS오류 없음, 탐색 전후 프로젝트 JSON 동일. toolbar-chat/friends.png를 육안 확인했고 toolbar-layout-report.json에 측정값을 기록했다. git diff --check 통과.
- 생성 이미지·출력 설정·compilerVersion은 변경하지 않아 APK 재검증은 반복하지 않았다. 현재 서버 재시작 없이 새로고침으로 적용된다.

# 0.10.3 공통 본체 이미지 활성화 (2026-10-26)

- 실제 설정에서 sentBubble 원본 존재/body=color/플랫폼 이미지 예외0을 읽기 전용으로 확인했다. 등록 API/UI가 본체 방식을 바꾸지 않던 경로를 수정했다. 기존 프로젝트는 자동 재해석하지 않고 기존 원본 적용 버튼을 제공한다.
- `node --test test/*.test.mjs`:63개 통과. 신규2개는 관련 첫/연속만 이미지 모드로 전환·다른 상태/캐릭터/예외 보존, API 공통 등록 후 두 플랫폼 생성 픽셀 일치, Android 가이드만 변경 시 iOS 그림 불변, iOS 다른 이미지 후 공통 원본 재등록에도 개별 이미지/가이드 유지 등을 검사한다.
- `node test/shared-bubble-body.mjs` 통과. 기존 이미지 재업로드 없이 적용·undo, 새 등록 후 자동 이미지 모드/양 Canvas 공통색, 새 플랫폼 버튼에서 기본 대상all, Android 본체 가이드만 수정·공통 자산 및 iOS PNG 해시 유지, iOS 기본 이미지2배율 교체·Android 유지·undo 복귀를 확인했다.800px 가로 넘침·JS오류 없음. shared-body-preview.png/controls.png를 육안 확인했다. 근거: shared-body-report.json.
- unified-design/storage-workflow/editor-upgrade/screen-workflow 통과. audit-screens/audit-common-colors/audit-coverage/support-matrix 및 git diff --check 통과. 기존 원본51/출력146/공통 색상39개는 유지한다.
- integration 통과. 공통 본체 활성화 후 iOS 이미지 예외만 해제한 실제 ktheme의 본체 픽셀52/107/154를 확인했고 Android 별도 이미지·다중 기하 예외를 유지한 실제 APK를 생성했다. API37·resources.arsc STORE/정렬·서명·동일키1→2·키 복원/다른 키 차단 유지. 근거: .test-data/integration-1792974183478/test-summary.json.
- 같은 포트/인증의 서버0.10.3으로 갱신했다. 두 프로젝트 설정 해시·키 메타데이터 보존, 실제 원본을 쓰는 메모리 사본의 양 플랫폼 공통 소스 적용, 새 플랫폼 설정/기존 원본 적용 버튼·JS오류0·원본 프로젝트 파일 불변과 launch 재사용을 확인했다. 사용자 화면은 저장하지 않았다. 기존 등록 원본은 새로고침 후 적용 버튼으로 활성화하며 사용자 디자인 설정을 자동으로 바꾸지 않았다.
- 실제 카카오톡 적용은 사용자 확인 대상이며 deviceVerified/actualAppVerified=false다.

# 0.10.2 Android 합성 본체/글자 가이드 회귀 (2026-10-26)

- 실제 사용자 가이드192×168/stretchX69~70/stretchY66~67/insets42/20/46/21을 테스트 자산으로 재현했다. 구형 본체 프레임을 합성 전체 PNG에 비례 적용해 글자는 본체 위로 올라가고 캐릭터가 늘림 띠에 걸리는 것을 확인했다. 이전 기록에서 단순 재정의 예외로 남겼던 문제를 수정했다.
- `node --test test/*.test.mjs`:61개 통과. 신규3개는 구형 본체→현재 본체 변환·헤더/바깥 여백 분리·고정 그림/내용 영역 보호·논리 픽셀 정렬, 명시 bodyRect의 배치 변화 불변과 검증/clone/ZIP, PNG 내부 픽셀 및 저장 원본 불변을 확인한다.
- `node test/android-composed-guides.mjs` 통과. 양 플랫폼·짧음/김·3배치의 실제 glyph 사각형이 실제 본체 색 픽셀 안에 있고 캐릭터32×32px, 양 플랫폼 본체 크기가 일치함을 확인했다. 시각 편집에서 적용 가이드/선택 bodyRect 저장, 보호값 표시·blur 안정, undo로 원래 레코드 복귀도 확인했다. 근거: test-results/android-composed-guides-report.json, android-composed-guides.png 육안 확인.
- state-geometry/screen-workflow/editor-upgrade 통과. 최종 반올림 수정 후 character-placement/bubble-fixed-size/live-preview도 통과했다. 기존 원본9-patch 다중 구간과 이미지 내부 바이트는 유지한다.80ms/160ms 미리보기와 프로젝트 전환 보호도 유지된다. audit-screens/audit-common-colors/audit-coverage/support-matrix 및 git diff --check 통과.
- 최종 실제 APK/ktheme integration 통과. 명시 bodyRect가 있는 개별 Android 가이드와 합성 그림을 컴파일했고 resources.arsc STORE/정렬·서명·동일 키 업데이트1→2·키 복원/다른 키 차단을 유지했다. 근거: .test-data/integration-1792972837374/test-summary.json.
- 실행 서버0.10.2를 같은 포트/인증으로 반영했다. 두 프로젝트 설정 해시와 키 메타데이터를 보존했다. 현재 프로젝트의 긴 메시지3줄 모두 Android 본체271×93 안에 들어가며 내용 가이드가 본체 내부임을 읽기 전용으로 확인했다. 두 Canvas·새 helper모듈·JS오류0과 프로젝트 파일 불변, launch 재사용 정상. 사용자 화면은 저장하지 않았다. 기존 개별 가이드의 초기화나 저장 데이터 이관은 수행하지 않았다.
- 실제 카카오톡 적용은 사용자가 확인하며 deviceVerified/actualAppVerified=false다. 새로고침 후 미리보기가 갱신되고 새 테마 생성에도 보정된 가이드가 적용된다.

# 0.10.1 짧은 디바운스·연속 미리보기 (2026-10-26)

- 사용자 후속 요청에 따라80ms trailing debounce/160ms 최대 대기를 적용했다. 저장350ms와 분리한다. `node --test test/*.test.mjs`:58개 통과. 신규 큐3개는 가짜 시계의 debounce/deadline/cancel, 작업1개/최신 대기 합치기·중간 결과 표시·실패 후 복구를 검사한다. 신규 캐시1개는146 PNG의 모든 바이트 동일성과 원본 변경 무효화를 검사한다.
- `node test/live-preview.mjs` 최종 통과. 약1.7초간 실제 마우스를 누르고 계속 이동하는 동안 서로 다른 Canvas 결과12개, 첫 생성 요청82ms, 생성 동시1개를 확인했다. 마지막 슬라이더 값 저장, blur 전 HEX 반영·포커스 유지와 양 플랫폼 픽셀을 검사했다. 느린 기존 요청 도중 프로젝트 전환 시 이전 결과와 이전 입력의 change/blur가 다음 프로젝트를 수정하지 않음을 확인했다. 근거: test-results/live-preview-report.json, live-preview.png 육안 확인.
- character-placement/editor-upgrade/state-geometry/screen-workflow/unified-design/browser 및 최종 소유 프로젝트 검사 후 common-policy/editor/unified 회귀 통과. 빠른 갱신 때문에 개별 모드 선택을 연속 히스토리와 합치던 조건도 수정하고 undo를 확인했다. audit-screens/audit-common-colors/audit-coverage/support-matrix 및 git diff --check 통과.
- 실제 APK/ktheme integration 통과. 변환 캐시 이후에도 가이드/서명/정렬/resources.arsc STORE·동일키1→2·키 복원/다른 키 차단을 유지했다. 근거: .test-data/integration-1792971729311/test-summary.json. .9.png 등록 방식과 최종 출력 형식은 변경하지 않았다.
- 같은 포트/인증의0.10.1 서버로 갱신했다. 두 프로젝트 설정 해시와 키 메타데이터를 보존했다. 현재 UI의 새 preview-queue 모듈200·슬라이더·양 Canvas·JS오류0과 읽기 전용 검사 후 파일 불변, launch 재사용을 확인했다. 사용자가 추가한 Android 개별 말풍선 기하1개도 유지한다. 해당 재정의 때문에 이전 실서버47px 고정 기대값은 더 이상 적용하지 않는다. 사용자 화면은 저장하지 않았다.
- 실제 카카오톡 적용은 사용자 확인 대상이며 deviceVerified/actualAppVerified=false다.

# 0.10.0 캐릭터 위치·겹침·슬라이더 (2026-10-26)

- `node --test test/*.test.mjs`:54개 통과. 신규3개는 양 플랫폼용 기하의 본체 크기/내부 여백 불변, 좌우 기준 모서리·첫/연속·크기12/32/72·radius0/18·안전 범위, 수동 iOS 가이드의 본체 상대 여백 유지, 반투명 앞/뒤 합성·장식 없는 승격·복제/ZIP/캐시/잘못된 값 거부를 확인한다. 최초 제한 실행의 API listen EPERM은 허용된 격리 재실행에서 해소됐다.
- `node test/character-placement.mjs` 통과. 실제 preview API/production renderPlatform에서 양 플랫폼·양 모서리·색상/이미지·4배치·짧은/긴 메시지의 본체 사각형과 글자 좌표/줄바꿈을 정확히 비교했다. 별도 최소/긴 크기의 실제 drawNine 마커 픽셀 폭·높이와 nineRect도 불변이다. 반투명 가장자리 색 변화는 단위 알파 검증으로 분리하고 크기 검사는 불투명 마커를 쓴다.
- 처음 숫자 입력을 만들었으나 사용자의 후속 요청에 따라 range-control 슬라이더로 변경했다. 최종 브라우저 재검증은 위치 range 타입·안전 min/max·Home 키·현재 값 표시, 레이어/undo/redo·CSS 축소 좌표 드래그·Escape 무저장을 확인했다. common-policy-workflow도 모서리 슬라이더 input 이벤트에 맞춰 재검증 통과했다. character-placement-controls.png와 desktop/small.png를 육안 확인했다. 근거: test-results/character-placement-report.json.
- bubble-fixed-size/bubble-body-size/state-geometry/screen-workflow/editor-upgrade/unified-design/common-policy-workflow/browser/preview-context/storage-workflow 모두 통과. audit-screens/audit-common-colors/audit-coverage/support-matrix 통과, 공통51·이미지146·색상 정책39 유지. git diff --check 통과.
- integration 통과. 받은 첫 색상 본체에 shiftX−16/placementY−6/front, 연속 이미지 본체에−10/−4/back을 적용한 실제 APK/ktheme 생성, 새 가이드·인셋·API37·resources.arsc STORE/정렬·서명·동일키 업데이트1→2·키 복원/다른 키 차단을 확인했다. 근거: .test-data/integration-1792970403776/test-summary.json. 이후 슬라이더 변경은 UI만 바꿔 출력 재검증은 반복하지 않았다.
- 같은 포트/인증의 실행 서버0.10.0 반영 완료. 프로젝트2개 설정 해시와 키 메타데이터를 보존했다. 실제 프로젝트를 저장하지 않은 읽기 전용 브라우저에서 양 플랫폼 정상/JS오류0, 배치0/4와−20/−7의 본체182×47 불변과 프로젝트 파일 불변을 확인했다. 사용자 캡처를 저장하지 않았다. launch의 현재 서버 재사용도 정상이다. 새로고침 후 슬라이더를 사용할 수 있으며 기존 테마 파일은 재생성이 필요하다.
- 실제 카카오톡 적용 확인은 사용자 범위다. deviceVerified/actualAppVerified=false를 유지한다.

# 0.9.1 캐릭터 켬/끔 본체 높이 회귀 수정 (2026-10-26)

- 이전0.9.0 검증은 설정 변화와 캐릭터 크기를 확인했지만, 같은 설정의 캐릭터 켬/끔 본체 크기를 비교하지 않았다. 실제 이전 서버의 모서리18·좌우13·상하7·캐릭터32 조건에서 본체가 끔56px/켬92px였다. 이번 검증은 이 누락을 보완한다.
- `node --test test/*.test.mjs`:51개 통과. 색상 본체의 압축 기하·켜짐에 독립인 본체 높이/세로 여백, 이미지 본체 원본 기준, 모서리·꼬리의 픽셀 보존 승격을 포함한다. 합성8개 검증에서 좌우·캐릭터12/72의 색상 본체 승격도 전 픽셀 일치한다.
- `node test/bubble-body-size.mjs` 통과. 실제 preview API와 production renderPlatform에서 양 플랫폼·양 방향·색상/이미지·3가지 여백의 켬/끔 본체 region 및 색 픽셀 높이를 비교했다. 보고 조건은 켬/끔 모두47px, 실제 색 픽셀은43px다. 근거: test-results/bubble-body-size-report.json, 테스트 도형만 사용한 bubble-body-on-off.png를 육안 확인했다.
- `node test/bubble-fixed-size.mjs` 통과.32출력 조합의 최소1×16·한 글자·긴 문장에서 고정 캐릭터 픽셀 크기와 nineRect 투영을 유지한다. browser/state-geometry/screen-workflow/editor-upgrade/unified-design/common-policy-workflow 회귀도 통과했다.
- 실제 APK/ktheme integration 통과. 압축 본체와 새 여백, API37, resources.arsc STORE/4바이트 정렬·서명, 동일 키/ID versionCode1→2, 키 복원·다른 키 차단, 공통 배너의 CSS/APK 색 값을 확인했다. 근거: .test-data/integration-1792969156679/test-summary.json.
- audit-screens/audit-coverage/support-matrix/audit-common-colors 통과. iOS105/Android49/이미지82그룹146출력/공통51 및39색상 정책을 유지했다. git diff --check 통과.
- 같은 포트·인증으로 실행 서버를0.9.1로 갱신했다. 두 프로젝트 설정 해시와 키 파일 inode/size/mtime를 보존했다. 현재 서버의 읽기 전용 브라우저에서 프로젝트2개·양 미리보기·JS오류0, 보고된 실제 프로젝트의 양 플랫폼 켬/끔 본체47px를 확인했다. 설정 파일은 불변이며 사용자 캡처를 저장하지 않았다. launch의 현재 서버 재사용도 통과했다. 브라우저 새로고침 후 반영되며 기존 빌드는 재생성이 필요하다.
- 실제 카카오톡 적용은 사용자가 확인한다. 이번 결과는 생성 파일·미리보기 검증이며 deviceVerified/actualAppVerified=false를 유지한다.

# 0.9.0 공통 색상·첫 말풍선·선택 여유 (2026-10-26)

- `node --test test/*.test.mjs`:50개 통과. 공통39정책의 기본/지정값·플랫폼 예외 우선·검증/캐시/복제/이력/ZIP을 확인했다. 보낸/받은 첫 본체의 캐릭터 on/off 모서리·꼬리·padding 반영, 합성 본체 승격 후 원래 그림 전체 픽셀 보존을 포함한다.
- common-policy-workflow 통과. 실제 UI에서 개별/상속 모서리·캐릭터 off/on·글자 여백을 변경했고, 공통 배너 지정색의 두 Canvas 픽셀·직렬화 값, 플랫폼 예외/재연결/undo·팔레트 보존,39정책의 모든 화면 연결을 확인했다. 근거: test-results/common-policy-report.json. shared-banner/공통 입력 캡처를 육안 확인했다.
- preview-context 통과.5CSSpx 선택 여유를 고려해 양 플랫폼·1520/800/390px·소수점 프레임/scale.83에서 오차<0.12CSSpx를 확인하고, 설명용 backdrop 제외와 알림 글자색 실제 픽셀·탐색 불변을 검사했다.
- bubble-fixed-size의32출력 조합 통과. 변경된 합성 크기에서도 짧은/긴 메시지의 캐릭터 픽셀 크기와 선택 투영이 동일했다. unified-design/state-geometry/screen-workflow/editor-upgrade/browser/storage-workflow 모두 통과했다. 새 공통 우선 탐색에 맞춰 세부 설정 이동 검사를 갱신했다.
- 최종 integration 통과. 실제 APK/ktheme의 공통 배너 지정색을 ktheme CSS와 APK aapt resource dump에서 확인했다. 새 bodyHeight/내용 여백, Android API37, resources.arsc STORE/정렬·서명, 같은 ID/키 versionCode1→2, 키 복원·다른 키 차단을 유지했다. 근거: .test-data/integration-1792967309337/test-summary.json.
- audit-screens/audit-coverage/support-matrix/audit-common-colors 통과. 공통 원본51/이미지82그룹146출력/iOS105/Android49를 유지했다. 공통 색상은39정책→iOS48속성·Android39속성, 나머지는 모두 근거가 있는 예외로 분류했고 미분류는 없다. 메타데이터 수정 시 이미지 해시 보존과 git diff --check 통과.
- 같은 포트·인증값으로 실제 서버를0.9.0으로 갱신했다. 프로젝트2개의 설정 해시와 키 inode/size/mtime 보존 및 새 모듈4개200을 확인했다. 현재 서버의 읽기 전용 브라우저에서 프로젝트2개·공통 입력·첫 상태 상속값·장면 배경 제외·양 미리보기·JS오류없음과 설정 JSON 불변을 확인했다. 사용자 화면을 저장하지 않았다. 실제 기기/카카오톡 적용 검증은 추가하지 않았으며 deviceVerified/actualAppVerified=false다. 기존 빌드를 삭제하거나 다시 쓰지 않았다.

# 0.8.0 실행 서버 초기 화면 복구 (2026-10-26)

- 실서버 작업 폴더/포트 일치, compiler0.7.0과 새 모듈2개의404를 확인했다. src/server의 상태 API에 compilerVersion을 추가하고 scripts/launch의 재사용 판정에 버전을 포함했다.
- `node --test test/launcher.test.mjs`: 통과. 버전 없는 서버와0.7.0을 거부하고 현재버전만 재사용한다.
- 기존 서버 정상 종료 후 같은 인증값·4317로0.8.0 실행. 프로젝트2개 설정 해시, 키 파일 메타데이터 보존과 새 모듈200 확인. 실제 서버의 headless 브라우저에서 프로젝트2개/화면6개/양 플랫폼의 불투명 렌더링 픽셀/장면4개/브라우저 오류없음 확인. 사용자 캡처·디자인 수정 없음.
- `STUDIO_NO_OPEN=1 node scripts/launch.mjs`: 현재 호환 서버 재사용 정상. 사용자에게 기존 브라우저 새로고침을 안내했다. 실제 기기 검증은 추가하지 않았다.

# 0.8.0 Android 17·선택 정렬·적용 장면 (2026-10-26)

- `node --test test/*.test.mjs`: 45개 통과. android-policy는 SDK33 거부/설치 안내, preview·rc 제외, 안정37.2 및 빈 CodeName 수용, target37/min28과 기존 theme intent를 확인한다.
- 공식 sdkmanager로 Platform android-37.2 / Build Tools37.0.0을 추가 설치했다. `node src/cli.mjs doctor`는 ok=true, api/targetSdk37이다. JDK17로 실제 컴파일했다.
- `node test/integration.mjs`: 최종0.8.0의 실제 APK/ktheme 생성 성공. target37/compile37/Build Tools37.0.0/min28, APK badging·서명·4바이트 정렬·resources.arsc STORE, 동일 ID/키 versionCode1→2, 키 복원과 다른 키 차단 통과. 근거: .test-data/integration-1792950435628/test-summary.json. 개인키/비밀번호를 공개 보고서에 복사하지 않았다.
- `node test/preview-context.mjs`: 네 장면/정확한 속성 연결·색상 변경의 실제 글자 픽셀·공통 팔레트 보존/undo·상태 탐색 데이터 불변 통과. 알려진 실제 버튼 사각형을 기준으로 두 플랫폼·1520/800/390px·소수점 border/scale.83의 overlay 오차<0.12CSSpx. 6개 화면의 clip과 탭32×32/비밀번호28×28의 실제 이미지 영역도 확인했다. 근거: test-results/preview-context-report.json. context-notification/share/buttons/tab/selection/mobile.png를 육안 확인했다.
- `node test/bubble-fixed-size.mjs`: 32개 실제 생성 출력에서 짧은/긴 내용의 캐릭터 픽셀과 nineRect 선택 투영이 일치했다.
- unified-design/state-geometry/screen-workflow/editor-upgrade/browser/storage-workflow 통과. 알림 배너가 새 위치로 바뀌어 editor-upgrade의 색 픽셀 검사점을 배경 내부로 옮겼고, 상태 검사는 친구 추가 장면의 버튼/아이콘 실제 위치로 옮겼다. 기존 override·실행취소·일괄 등록·키 생성·두 플랫폼 다운로드·개인키 없는 백업 흐름을 유지했다.
- audit-screens/audit-coverage/support-matrix 통과: iOS105/Android49/이미지82그룹146출력/공통51, 누락 없음. 메타데이터 수정 시 이미지 해시 보존도 확인했다. `git diff --check` 통과.
- 사용자 .data/키/기존 결과·실행 서버는 변경하지 않았다. 기존 서버 재시작·새로고침 후 새로 생성해야 적용된다. 새 Android17 런타임 설치나 실제 카카오톡 적용은 검증하지 않았으며 deviceVerified/actualAppVerified=false다. 이전 Android13 설치 확인 이력과 구분한다.

# 0.7.1 짧은 메시지 캐릭터 크기 보정 (2026-10-26)

- `node --test test/*.test.mjs`: 44개 통과. 처음 제한 환경에서는 API 서버 listen 권한으로 1개가 실패했고, 실행 권한을 부여한 전체 재검증에서 모두 통과했다.
- `node test/bubble-fixed-size.mjs`: 32개 출력 조합 통과. 생성 iOS/Android의 출력 여백을 읽어 PNG 최소 크기 강제 없이 한 글자·긴 문장을 렌더링하고 캐릭터의 실제 픽셀 폭/높이를 대조했다. 크기12/72, 좌우, 보냄/받음, 첫/연속을 포함한다. 캡처 bubble-fixed-size.png를 육안 확인했다. 근거: test-results/bubble-fixed-size-report.json.
- unified-design, state-geometry, screen-workflow, editor-upgrade 모두 통과. unified-design-small.png의 화면 구성과 고정 크기 비교 캡처를 확인했다. audit-screens는 iOS105/Android49/이미지82그룹146출력/공통51, 누락 없음이다.
- integration 통과: 실제 APK·ktheme, 새 내용 여백의 AAPT2 컴파일, resources.arsc STORE/정렬·서명, 같은 키 업데이트, 키 복원·다른 키 차단. 근거: .test-data/integration-1792949211222/test-summary.json. 테스트는 격리 저장소를 사용했다.
- 앱/컴파일러0.7.1. 사용자 데이터·키·기존 빌드와 실행 서버는 변경하지 않았다. 기존 파일에는 소급 반영되지 않으므로 서버 재시작·새로고침 후 재생성이 필요하다. 사용자가 실제 기기 적용을 직접 확인하기로 했으며, 수정 후 카카오톡 렌더링은 미확인이다. deviceVerified/actualAppVerified=false를 유지한다.

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
