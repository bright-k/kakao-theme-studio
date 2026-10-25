# 현재 구현 구조

## 모듈

| 파일 | 책임 |
|---|---|
| `src/catalog.mjs` / `templates/profile-26.9.0.json` | 속성·파일·배율·문서 출처 카탈로그 |
| `src/styles.mjs` | 플랫폼별 기본값·재정의, CSS/XML 직렬화 |
| `src/resources.mjs` | 세부 설정 검증, 원본 9-patch, 전체 이미지 완성·지원 범위 |
| `src/editor-service.mjs` | 상세 편집 API, 템플릿·일괄 매칭, 미리보기 메타데이터 |
| `public/catalog-editor.js` / `public/history.js` / `public/preview-renderer.js` | 전체 항목·실행취소·실제 가이드 기반 미리보기 |
| `src/core.mjs` | 프로젝트 기본값/검증, 이미지 변환, iOS CSS·Android XML 매핑, 9-patch, ktheme, 프로젝트 ZIP |
| `src/android.mjs` | 환경 탐색, keytool 키 관리, AAPT2/javac/D8/정렬/서명/검증, 버전·fingerprint 연결 |
| `src/server.mjs` | loopback HTTP API, 프로젝트/이미지 저장, 인증·Origin 검사, 미리보기 파일, 생성 큐·다운로드 |
| `src/cli.mjs` | doctor/new/validate/build |
| `public/screen-model.js` | 모든 속성·이미지·공통 원본의 화면 연결 및 지원 범위 감사 |
| `public/app.js` | 편집·자동 저장·키 관리·작업 진행·Canvas 미리보기 |
| `scripts/launch.mjs` | 기존 프로세스 탐색, 로컬 인증 세션, 브라우저 열기 |

웹 프레임워크·UI 번들러 없이 Node ESM과 브라우저 모듈을 사용한다. Sharp/JSZip/PNGJS가 실행 의존성이다. 브라우저는 외부 CDN·폰트·API를 사용하지 않는다.

## 입력과 저장

schemaVersion 1 프로젝트는 id/name/author/version/packageId/profile/mode/palette/bubble/assets/signingKeyId를 가진다. palette는 10개 #RRGGBB 값, bubble은 1배수 radius/paddingX/paddingY/stretchX/stretchY다. asset 값은 `assets/<sha256>.png`만 허용한다. 추가 선택 필드 overrides는 플랫폼별 색·투명도·인셋·늘림을, resourceOverrides는 카탈로그 파일별 원본 참조를, nativeNinePatch는 원본 가이드 보존을, resourceOptions는 배경 사용 여부·변환 방식·크롭 초점을 나타낸다. 기존 schemaVersion 1 프로젝트의 새 필드는 생략 가능하다. 서버에서 원본 업로드를 검증·회전 보정한 PNG로 저장한다. 원본 포맷 자체를 보존하는 기능은 없다.

기본 데이터 위치는 프로젝트의 `.data/`이며 `THEME_STUDIO_DATA`로 변경할 수 있다.

```text
.data/
  projects/<id>.json
  assets/<hash>.png
  keys/index.json
  keys/<id>.p12
  bindings/<project-id>.json
  previews/<revision>/
  builds/<build-id>/
  session.json
```

프로젝트/인덱스는 임시 파일 후 rename으로 저장한다. 키 비밀번호는 KeyStore Map에만 보관하고 디스크에 저장하지 않는다. 키 파일은 암호화 PKCS12, 파일 모드 600, 기본 데이터 루트는 700이다. session.json은 로컬 브라우저 인증 토큰을 가지므로 .data 전체를 배포하지 않는다.

POST projects는 선택 입력 packageId를 받으며 newProject(name,palette,packageId)에서 문자열 앞뒤 공백을 제거한다. 생략/빈 문자열이면 기존 UUID 기반 ID를 생성한다. 형식·길이·Java 예약어를 검증하고, 새 프로젝트 저장 시 같은 데이터 루트의 패키지명 중복을 거부한다. 서버 내부 저장 큐로 중복 확인과 저장을 직렬화해 동시 생성도 차단한다. PUT/ZIP 가져오기로 새 프로젝트를 저장할 때도 같은 검사를 거친다. 기존 프로젝트의 packageId 변경 금지와 package ID/fingerprint bindings는 유지한다. schemaVersion은 그대로다. 현재 iOS ManifestStyle/-kakaotalk-theme-id와 Android manifest package는 모두 packageId를 그대로 사용한다. 기존 프로젝트·복원·복제도 같은 규칙을 적용하며 별도 마이그레이션 필드를 저장하지 않는다. compilerVersion 0.4.1로 이전 접미사가 들어간 출력/미리보기 캐시를 분리한다. 기존 Android bindings와 서명키는 변경하지 않으며 이미 생성한 파일은 재작성하지 않는다.

프로젝트 ZIP은 공통/개별 이미지 참조와 플랫폼별 설정을 포함한 `theme.json`과 참조 자산을 포함하며 signingKeyId는 null로 만든다. 플랫폼 ID는 유지한다. 가져올 때 같은 ID가 이미 있으면 덮어쓰지 않는다. 외부 키는 theme alias를 사용한 PKCS12/JKS를 가져오는 범위다.

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
