# 현재 구현 구조

## 모듈

| 파일 | 책임 |
|---|---|
| `src/catalog.mjs` / `templates/profile-26.9.0.json` | 속성·파일·배율·문서 출처 카탈로그 |
| `src/styles.mjs` | 플랫폼별 기본값·재정의, CSS/XML 직렬화 |
| `src/resources.mjs` | 세부 설정 검증, 원본 9-patch, 전체 이미지 완성·지원 범위 |
| `src/editor-service.mjs` | 상세 편집 API, 템플릿·일괄 매칭, 미리보기 메타데이터 |
| `public/catalog-editor.js` / `public/history.js` / `public/preview-renderer.js` | 전체 항목·실행취소·실제 가이드 기반 미리보기 |
| `src/project-store.mjs` / `src/asset-store.mjs` / `src/project-archive.mjs` | 패키지별 저장·이관·잠금·독립 원본·버전별 백업/복원 |
| `src/core.mjs` | 프로젝트 기본값/검증, 이미지 변환, iOS CSS·Android XML 매핑, 9-patch, ktheme, 프로젝트 ZIP |
| `src/android.mjs` | 환경 탐색, keytool 키 관리, AAPT2/javac/D8/정렬/서명/검증, 버전·fingerprint 연결 |
| `src/server.mjs` | loopback HTTP API, 프로젝트/이미지 저장, 인증·Origin 검사, 미리보기 파일, 생성 큐·다운로드 |
| `src/cli.mjs` | doctor/new/validate/build |
| `public/screen-model.js` | 모든 속성·이미지·공통 원본의 화면 연결 및 지원 범위 감사 |
| `public/app.js` | 편집·자동 저장·키 관리·작업 진행·Canvas 미리보기 |
| `scripts/launch.mjs` | 기존 프로세스 탐색, 로컬 인증 세션, 브라우저 열기 |

웹 프레임워크·UI 번들러 없이 Node ESM과 브라우저 모듈을 사용한다. Sharp/JSZip/PNGJS가 실행 의존성이다. 브라우저는 외부 CDN·폰트·API를 사용하지 않는다.

## 입력과 저장

schemaVersion 1 프로젝트는 id/name/author/version/packageId/profile/mode/palette/bubble/assets/signingKeyId를 가진다. palette는 10개 #RRGGBB 값, bubble은 1배수 radius/paddingX/paddingY/stretchX/stretchY다. asset 값은 `assets/{common,ios,android}/<역할/상태/변형>-v0001.png` 및 원본 가이드용 `.9.png`를 허용한다. 구형 `assets/<sha256>.png`도 읽는다. 새 참조에는 assetHashes의 SHA-256이 필수이며 프로젝트 assets/index.json과 함께 검증한다. 추가 선택 필드 overrides는 플랫폼별 색·투명도·인셋·늘림을, resourceOverrides는 카탈로그 파일별 원본 참조를, nativeNinePatch는 원본 가이드 보존을, resourceOptions는 배경 사용 여부·변환 방식·크롭 초점을 나타낸다. 기존 schemaVersion 1 프로젝트의 새 필드는 생략 가능하다. 서버에서 원본 업로드를 검증·회전 보정한 PNG로 저장한다. 원본 포맷 자체를 보존하는 기능은 없다.

기본 데이터 위치는 프로젝트의 `.data/`이며 `THEME_STUDIO_DATA`로 변경할 수 있다.

```text
.data/
  projects/<packageId>/
    storage.json
    theme.json
    assets/index.json
    assets/common/<role>-v0001.png
    assets/ios/<role>-v0001.png
    assets/android/<role>-v0001.9.png
    previews/<revision>/
    builds/<build-id>/
    backups/<name>.zip
  keys/index.json
  keys/<id>.p12
  bindings/<project-id>.json
  .staging/
  .storage.lock
  session.json
```

프로젝트/인덱스는 임시 파일 후 rename으로 저장한다. 키 비밀번호는 KeyStore Map에만 보관하고 디스크에 저장하지 않는다. 키 파일은 암호화 PKCS12, 파일 모드 600, 기본 데이터 루트는 700이다. session.json은 로컬 브라우저 인증 토큰을 가지므로 .data 전체를 배포하지 않는다.

POST projects는 선택 입력 packageId를 받으며 newProject(name,palette,packageId)에서 문자열 앞뒤 공백을 제거한다. 생략/빈 문자열이면 기존 UUID 기반 ID를 생성한다. 형식·길이·Java 예약어를 검증하고, 새 프로젝트 저장 시 같은 데이터 루트의 패키지명 중복을 거부한다. 서버 내부 저장 큐로 중복 확인과 저장을 직렬화해 동시 생성도 차단한다. PUT/ZIP 가져오기로 새 프로젝트를 저장할 때도 같은 검사를 거친다. 기존 프로젝트의 packageId 변경 금지와 package ID/fingerprint bindings는 유지한다. schemaVersion은 그대로다. 현재 iOS ManifestStyle/-kakaotalk-theme-id와 Android manifest package는 모두 packageId를 그대로 사용한다. 기존 프로젝트·복원·복제도 같은 규칙을 적용하며 별도 마이그레이션 필드를 저장하지 않는다. compilerVersion 0.4.1로 이전 접미사가 들어간 출력/미리보기 캐시를 분리한다. 기존 Android bindings와 서명키는 변경하지 않으며 이미 생성한 파일은 재작성하지 않는다.

현재 프로젝트 ZIP은 패키지명·한국 시간·백업 UUID로 구분한 최상위 폴더 안에 backup.json manifest, `theme.json`과 참조 자산을 포함하며 signingKeyId는 null로 만든다. 구형 루트 theme.json ZIP도 읽는다. 플랫폼 ID는 유지한다. 가져올 때 같은 ID가 이미 있으면 덮어쓰지 않는다. 외부 키는 theme alias를 사용한 PKCS12/JKS를 가져오는 범위다.

## 생성 계약

`compile(project, assetRoot)`는 검증 후 `{profile,revision,project,files,diagnostics,preview,deviceVerified:false}`를 반환한다. files의 키는 `ios/...`, `android/res/...`다. iOS는 동일한 논리 이미지에서 @2x/@3x를 생성하고, Android는 필요한 이미지와 9-patch를 생성한다. 기본 도형은 자체 SVG를 내부적으로 래스터화한다. 외부 SVG 업로드는 거부한다.

현재 CSS/XML 매핑은 프로필 26.9.0 기반의 코드다. 현재 카탈로그가 105개 iOS 속성·49개 Android 색상·146개 이미지 출력 슬롯을 등록·검증한다. 다른 버전의 어댑터 프로필은 아직 추가하지 않았다. 미리보기 색상은 같은 공통 팔레트와 변환 설정, 이미지는 compile 결과를 사용한다. 상태·레이아웃의 완전한 실제 앱 재현을 의미하지 않는다.

Android는 Gradle 없이 공식 독립 도구를 사용한다. AAPT2 compile/link → javac --release 8 → D8 → classes.dex 삽입 → resources.arsc STORE → zipalign → apksigner sign/verify → aapt badging 검사 순서다. Java Activity는 자체 최소 적용 안내 화면이며 카카오톡 theme intent-filter와 theme_style metadata를 가진다.

같은 프로젝트의 bindings는 package ID/fingerprint/마지막 versionCode를 저장한다. 키가 달라지면 Android 생성을 중단한다. versionCode는 예약 후 실패해도 감소시키지 않으며 새 작업은 다음 번호를 쓴다. 재시도 전용 API는 아직 없어 재생성은 새 작업이다.

일반 사용은 서버 단일 프로세스로 한 번에 하나의 생성 작업을 실행한다. 별도 CLI와 서버에서 동일 dataRoot에 동시에 빌드를 실행하는 사용은 지원하지 않는다. 파일 잠금과 다중 프로세스 버전 예약은 후속 작업이다.

## API

모든 `/api/*` 요청은 Bearer 세션 토큰이 필요하다. Host는 127.0.0.1:port, Origin은 같은 origin만 허용한다. 브라우저는 fragment 토큰을 sessionStorage에 옮기고 URL에서 제거한다. 자산/결과 파일도 인증 API를 통해 받는다.

주요 API: GET status/projects/builds, POST projects/assets/preview/keys/keys-unlock/build/project-import, PUT project, GET job/download/project-export/keys-backup. 실제 경로는 server.mjs를 확인한다. API는 외부 공개 서비스용으로 설계하지 않았다.

키 비밀번호는 서브프로세스 전용 환경변수로 전달한다. 비밀번호를 인자·파일·로그에 직접 넣지 않는다. 프로젝트 ZIP에는 경로 이탈·파일 수·총 압축 해제 크기 제한을 적용한다. 데이터 루트의 프리뷰 캐시·과거 빌드 자동 정리는 아직 없다.

컴파일러 버전을 revision에 포함한다. 메타데이터 변경 시 경로별 이미지 캐시를 재사용하고, 캐시 사용 전 사용자 자산 해시를 검사한다. 캐시 크기는 제한하며 브라우저도 동일 이미지 해시의 비트맵을 재사용한다. 전체 속성·이미지 목록은 SUPPORT-MATRIX.md를 따른다.

## 화면별 편집 계약 (0.3.0)

화면 선택이 미리보기와 inspector를 함께 제어한다. screen-model의 contextsFor는 iOS 속성/Android 색상/이미지 논리 그룹을 화면 또는 테마 정보에 연결한다. slotsForScreen은 공통 원본을 연결한다. 알 수 없는 영역은 감사에 실패한다. 같은 catalog-editor DOM을 inline-catalog와 catalog-dialog 사이에 이동하므로 모든 typed 필드·배율·원본 9-patch 제어를 공통으로 사용한다. 목록 배경·프로필·탭 같은 실제 공유 리소스를 화면별 독립 설정처럼 표시하지 않는다.

화면 전환은 프로젝트 데이터를 바꾸지 않는다. 전체 초기화 대신 현재 검색·화면에 표시된 플랫폼 항목만 자동값으로 복귀한다. 서버 생성/서명 규칙과 schema는 0.2.0과 같으며 compilerVersion도 유지한다. 아이콘·시작화면 미리보기는 기존 descriptor의 files에서 이미지를 선택한다.

## 0.4.0 기하와 원본 추적 계약

resourceGeometry는 카탈로그의 Android ninePatch 파일 경로를 키로 {width,height,stretchX:[[start,end],...],stretchY:[...],insets:[top,left,bottom,right]}를 저장한다. 좌표는 투명 가이드 테두리를 제외한 픽셀 단위이며 end는 미포함이다. 폭/높이는 저장 좌표계이고 새 출력 크기에 비례 변환한다. 유효 범위·정수·비교차·내용 영역을 검증한다. 파일별 가이드는 원본 9-patch 또는 공통 자동 가이드보다 우선한다. 원본 이미지는 참조 그대로 보존하고 출력 시 가이드 테두리만 재생성한다.

iOS는 같은 시각 UI에서 64×56 논리 좌표를 기존 overrides에 저장한다. 선택된 이미지와 기본 이미지는 상태/첫·연속에 대응하는 stretch 속성을 각각 사용하며 내용 여백은 동일 Send/Receive 그룹끼리 공유한다.

public/geometry-model.js는 검증·좌표 이동·비례 변환·iOS 속성 연결의 순수 함수다. 서버/브라우저가 함께 사용한다. public/visual-geometry.js는 핸들·숫자·구간 편집을 담당한다. src/provenance.mjs는 출력 파일별 실제 이미지 선택의 출처를 기록하며, 공통 원본 전체의 단색 픽셀 대조로 생성 규칙과 일치함을 확인한다. preview의 sources는 꺼진 출력까지 포함하고 files는 실제 생성된 이미지만 담는다.

미리보기 상태는 프로젝트 스키마에 저장하지 않고 DOM 상태로만 유지한다. 추가된 별칭은 전체 8개 탭, 프로필 변형/전체 이미지와 친구 추가 버튼을 실제 생성 파일에 연결한다. compilerVersion 0.4.0은 새 출력 기하 및 descriptor를 이전 캐시와 분리한다.


## 0.5.0 공통 편집·선택·합성 계약

public/bubble-model.js는 bubbleDesign.sent/received 및 각 group 상태의 설정과 논리 기하를 서버·브라우저에서 공유한다. body는 auto/color/image이며 group의 inherit은 첫 번째 본체 설정을 따른다. 연속 장식은 decorationMode none/shared/separate로 선택하며 같은 원본을 써도 크기/좌표는 독립 지정할 수 있다. 기존 applyTo first/all 입력은 읽기 호환을 유지한다. 글자색은 Send/Receive 속성의 첫/연속 공유 계약을 따른다.

네 장식 원본은 기존 assets 참조로 보존한다. src/bubble-composition.mjs는 64×56 본체를 생성/읽고 고정 구간을 보존하며 가로 본체를 확장한 뒤, 비율을 유지한 캐릭터를 상단에 합성한다. public/bubble-model.js의 크기·늘림·내용 여백을 iOS CSS와 Android 가이드에 사용한다. 기존 resourceOverrides/nativeNinePatch/resourceGeometry와 typed overrides의 우선순위는 유지한다. source-rules.mjs는 물리 출력의 원본 후보 연결을, provenance.mjs는 실제 본체/장식 기여를 담당한다. publicCatalog.commonSources는 51개 공통 슬롯의 파일/플랫폼 연결을 제공한다. 출력은 기존 146개이며 새 공통 원본은 별도의 카카오톡 출력 슬롯을 가정하지 않는다.

preview 파일 메타데이터의 logical/composition은 실제 출력 그림의 논리 크기와 합성 영역을 담는다. preview-renderer.js는 그리기와 함께 영역/역할/상태/원본/속성 대상을 반환한다. 앱은 CSS 좌표를 Canvas 논리 좌표로 변환해 기존 공통 입력 또는 catalog-editor.jump로 이동한다. 별도 DOM 오버레이는 Canvas 내보내기와 분리한다. 탐색/선택은 프로젝트를 변경하지 않는다. design-editor.js는 같은 assetControl을 사용하며 별도 플랫폼별 catalog-editor를 복제하지 않는다.

GET asset-file은 인증과 검증된 프로젝트·원본 상대 경로를 거쳐 원본 썸네일을 제공한다. POST resource-promote는 허용된 출력/공통 후보 연결만 수용하고 Android 가이드 또는 합성 상단을 제외한 그림을 공통 자산으로 등록한다. 기존 재정의는 유지한다. 선택 출력의 공통 연결은 브라우저에서 재정의를 해제하며 원본 가이드가 있으면 resourceGeometry에 보존한다. body/decoration 원본과 bubbleDesign은 기존 ZIP·복제 계약에 포함된다. visualRevision에 bubbleDesign을 포함하고 compilerVersion 0.5.0으로 기존 캐시와 분리한다.

## 이전 공유 자산과 백업 충돌 검토 (2026-10-26)

0.5.0 당시 .data/assets는 내용 해시 기반 공용 저장소였으며 프로젝트의 assets/resourceOverrides는 각각 독립된 참조 목록이다. 업로드 파일의 원래 이름으로 저장하지 않는다. 같은 정규화 PNG 바이트는 같은 SHA-256 경로를 재사용하고, 교체한 그림의 바이트가 달라지면 새 경로를 사용하므로 다른 프로젝트의 기존 참조가 바뀌지 않는다. 프로젝트를 생성해도 다른 프로젝트의 전체 자산 목록을 상속하지 않는다. 복제는 의도적으로 디자인과 자산 참조를 복사한다.

프로젝트 ZIP에는 해당 프로젝트가 참조하는 그림만 들어간다. 앱의 importProject는 필요한 이미지 전부의 존재·파일명 해시/실제 바이트 일치·형식과 경로를 확인한 뒤 자산을 쓴다. 같은 경로에 다른 내용이 들어 있는 ZIP은 저장 전에 거부한다. 같은 프로젝트 ID는 서버에서 덮어쓰지 않는다. 해시 검증은 파일명/내용 일관성 검사이며 ZIP 제작자의 신원을 인증하는 기능은 아니다.

이와 별도로 ZIP을 같은 폴더에 수동으로 병합해 풀면 루트의 theme.json을 덮어쓸 수 있다. 앱의 프로젝트 열기를 통한 복원과 수동 압축 해제는 구분한다. .data/assets의 공유 파일을 직접 수정/삭제하면 이를 참조하는 여러 프로젝트에 영향을 줄 수 있으며, 앱의 자산 읽기/컴파일은 해시 불일치를 거부한다. exportProject는 현재 참조 파일을 그대로 읽으므로 백업 생성 시에도 해시 검증을 추가하는 것은 보강 후보다.

격리한 .test-data에서 동일 자산 공유 → B 프로젝트만 다른 이미지로 교체 → A 백업/동일 저장소 복원 → 같은 자산 경로에 다른 바이트를 넣은 ZIP 복원 거부를 실행해 A/B 이미지 보존과 참조 자산만의 백업을 확인했다. 확인용 임시 폴더만 제거했으며 사용자 .data는 읽거나 변경하지 않았다.

후속 권장안은 해시 저장소를 유지하면서 프로젝트별 사용 자산/용량/참조 관계를 표시하고, 정리는 모든 프로젝트·보관 백업의 참조를 확인해 사용자 요청 시 수행하는 것이다. 수동 파일 관리가 주목적이라면 프로젝트별 물리 폴더도 선택할 수 있지만 데이터 마이그레이션과 복제/백업/컴파일 경로를 함께 바꿔야 한다. 백업 ZIP의 프로젝트 ID별 최상위 폴더와 구형 루트 구조 호환, 복원 임시 영역에서 중복 ID까지 검사한 뒤 최종 등록하는 흐름은 별도 구현 후보다. 이번 검토로 저장 구조나 백업 포맷을 변경하지 않았다.


## 0.6.0 프로젝트 저장소 계약

project-store.mjs는 앱 저장소를 시작할 때 실행 잠금을 얻고 완료된 패키지명 폴더의 UUID 매핑을 읽은 뒤 구형 JSON 프로젝트를 복사·검증해 이관한다. 구형 원본과 공유 파일/키/bindings/빌드/백업은 유지한다. 불완전/충돌 이관은 시작 오류로 알리고, 이미 완료한 ID는 구형 JSON을 중복 노출하지 않는다. 미완료 과거 준비 폴더를 임의 삭제하지 않는다. 파일 접근은 등록된 UUID와 packageId/marker의 일치를 확인하며 symlink 폴더·자산·메타데이터를 거부한다.

core.compile의 root는 해당 프로젝트 폴더이며 원본 참조는 0.7.0에서 역할별 이름으로 전환되며 구형 assets/<hash>.png도 읽는다. editor-service는 resolveRoot(project)로 프로젝트 루트를 얻는다. asset-store의 모든 읽기와 백업 생성은 실제 바이트 해시를 확인하며 프로젝트 누락 파일을 전역 저장소에서 보충하지 않는다. 미리보기 descriptor에 projectId를 포함하고 asset-file/preview-file은 projectId를 필수로 받는다. 프런트 썸네일 캐시는 projectId+ref로 분리한다. compilerVersion 0.6.0으로 이전 descriptor 캐시를 분리했다.

buildBoth(compiled, workspaceRoot, keys, onStep, {projectRoot})는 projectRoot/builds에 새 결과를 쓰고 workspaceRoot/bindings와 KeyStore는 유지한다. 목록/다운로드는 신규 프로젝트 builds와 기존 전역 builds의 보고서 ID/소유를 확인해 제공한다. 서버 종료는 진행 중 빌드/저장 큐 완료 후 저장소 잠금을 해제한다. CLI도 같은 잠금을 사용한다.

project-archive는 central directory의 중복/잘못된 경로 검사, ZIP CRC/한도, 자산 해시/형식과 신규 manifest 검증을 마친 뒤 메모리 원본을 제공한다. store.import는 큐 안에서 ID/패키지 중복을 확인하고 .staging에 현재 참조 파일만 쓰고 최종 rename한다. 복제는 같은 등록 경로에서 파일을 독립 복사한다. 백업 내보내기는 검증된 프로젝트 참조만 포함하고 같은 ZIP을 해당 프로젝트 backups에도 보관한다. 키/비밀번호/세션/바인딩/빌드/캐시/과거 백업은 포함하지 않는다. 현재 백업 포맷 3은 theme schemaVersion 1과 별개이며 포맷 1·2도 읽는다.

GET project-storage는 경로·이미지 수/용량·사용처를 제공하고 POST project-folder는 검증된 루트를 OS 폴더 열기로 전달한다. POST project-import-check는 파일을 쓰지 않고 식별 충돌을 알려 UI가 기존 프로젝트 열기/새 복사/취소를 제공한다. 구체적인 디렉터리·이관/복구 규칙과 실제 이관 근거는 REVIEW-0.6.0.md를 따른다. 앞의 0.5.0 공유 저장소 검토는 이전 구현의 검토 기록이다.


## 0.7.0 원본 이름·버전 계약

asset-names.mjs는 51개 공통 슬롯과 146개 카탈로그 출력의 역할·상태·배율을 명시적으로 해석한다. 공통 역할은 common에, 플랫폼별 논리 그룹 원본은 ios/android에, 특정 출력은 추가 배율/qualifier 경로에 둔다. filename은 사용자 입력에서 가져오지 않는다. 원본 .9.png 확장자는 보존하고 최종 APK/ktheme 이름·가이드는 유지한다.

registerAsset은 프로젝트 루트별 큐 안에서 디스크·인덱스·설정의 기존 참조를 확인해 새 버전을 배정한다. 같은 그림도 다른 명시적 슬롯에는 독립 파일로 등록한다. 같은 항목의 플랫폼/배율은 기존 공통 연결을 유지하며 없는 슬롯의 대체 관계를 독립 파일로 만들지 않는다. 같은 플랫폼 논리 그룹을 한 번 교체하면 해당 배율들은 하나의 전용 원본을 공유한다. 최종 우선순위는 이미지 비활성화 → resourceOverrides → 기존 공통/대체/합성 정책이며 폴더 파일 존재나 최신 번호로 설정을 추정하지 않는다.

assets/index.json(version=1)은 원본 경로별 SHA-256·크기·업로드 대상을 기록한다. theme.json의 assetHashes가 스냅샷의 해시를 고정한다. 읽기·캐시 사용·복제·백업은 두 정보를 실제 바이트와 비교한다. visualRevision에 assetHashes를 포함하고 compilerVersion 0.7.0으로 캐시를 분리한다. 불변 원본을 다시 덮어쓰지 않고 실행취소/다시실행·모드 변경 뒤에도 이전 버전을 보존한다. 외부 편집을 자동 반영하는 기능은 없다.

ProjectStore는 기존 패키지별 theme/storage 사본을 backups/asset-names-<UUID>/에 먼저 저장하고, 새 원본 등록·검증 후 theme 참조를 atomic rename으로 바꾼다. 구형 평면 저장소·백업 가져오기·복제는 준비 폴더에서 변환 후 등록한다. 기존 해시 파일·사용자 키·bindings·빌드는 삭제하거나 수정하지 않는다. storageVersion=2, assetNamingVersion=1이며 완료 프로젝트 재시작 시 재변환하지 않는다. 중간 실패 시 기존 참조와 원본이 남아 재시도할 수 있다.

백업 포맷 3은 활성 참조의 깊은 경로를 폴더 항목 생성 없이 ZIP에 넣어 146개 전체 원본도 기존 파일 수 한도로 복원한다. 해시는 theme.json과 manifest에 포함하며 index.json은 복원 시 재구성한다. 비활성 과거 원본과 키·세션은 포함하지 않는다. ZIP 포맷 1·2의 해시 이름 원본은 검증 후 이름을 변환한다. 같은 경로가 다른 프로젝트에 있어도 별도 루트/독립 파일이므로 충돌하지 않는다. 상세 근거는 REVIEW-0.7.0.md를 따른다.
