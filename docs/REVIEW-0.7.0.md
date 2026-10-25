# 0.7.0 역할별 원본 파일명과 플랫폼 경로

구현일: 2026-10-26. 앱/컴파일러 0.7.0, 저장 배치 storageVersion 2, assetNamingVersion 1, 백업 포맷 3이다. 테마 schemaVersion 1과 공식 출력 리소스 이름은 유지한다.

## 파일 배정

프로젝트 패키지명 폴더의 원본을 다음과 같이 관리한다. 사용자가 업로드를 시작한 편집 항목에 따라 앱이 경로와 버전을 배정한다. 업로드 파일의 원래 이름은 저장 경로로 사용하지 않는다.

```text
.data/projects/<packageId>/assets/
  index.json
  common/
    chat/sent/first/body-v0001.png
    chat/sent/first/character-v0001.png
    chat/sent/continuous/character-v0001.png
    backgrounds/chat-v0001.png
    tabs/friends-normal-v0001.png
  ios/
    chat/sent/first/body-v0001.png
    chat/sent/first/2x/body-v0001.png
  android/
    chat/sent/first/drawable-xxhdpi/body-v0001.9.png
```

common은 같은 항목의 Android/iOS가 함께 사용하는 원본이다. 서로 다른 항목에 같은 그림을 명시 등록하면 별도 파일을 만든다. 원래 있던 첫→연속, 기본→선택 등 대체 연결은 그대로 두므로 없는 슬롯을 독립 파일로 채우지는 않는다. 다른 프로젝트로 복제/복원할 때도 파일은 독립 복사한다.

플랫폼 논리 그룹을 교체하면 그 플랫폼의 여러 배율이 같은 전용 원본을 사용한다. 특정 출력만 교체하면 2x/3x 또는 Android drawable qualifier 경로에 등록한다. 한 플랫폼에만 있는 출력은 반대 플랫폼의 가짜 항목을 만들지 않는다. 원본 .9.png는 가이드가 있는 확장자로 보관하며 최종 APK/ktheme의 공식 이름·배율·가이드를 유지한다.

현재 적용은 theme.json의 assets/resourceOverrides와 기존 비활성화·대체·합성 정책으로 결정한다. 폴더에 파일이 남아 있거나 버전 번호가 높다고 적용하지 않는다. 앱에서 예외를 해제하면 공통 연결로 돌아가며, 필요한 파일이 누락/변조되면 오류로 알린다.

## 버전·검증·이력

재업로드 시 v0001 → v0002처럼 새 파일을 등록하고 과거 원본을 보존한다. 디스크·인덱스·설정 참조를 확인하고 프로젝트 루트별 큐로 동시 업로드 충돌과 덮어쓰기를 막는다. 실행취소/다시실행이 각 스냅샷의 원본 바이트를 다시 읽을 수 있다.

SHA-256은 파일명에서 assets/index.json의 경로별 메타데이터와 theme.json의 assetHashes로 옮겼다. 읽기·미리보기 캐시·복제·백업에서 실제 바이트를 검사한다. 스냅샷의 해시를 고정하므로 메타데이터만 바뀌어도 기존 그림을 다른 내용으로 채택하지 않는다. visualRevision에는 assetHashes를 포함하고 compilerVersion을 올려 이전 캐시와 분리한다.

외부 편집기에서 저장 원본을 덮어쓰는 동작은 자동 반영하지 않는다. 바꾼 이미지는 앱에서 다시 업로드해 새 버전으로 등록한다. 사용하지 않는 과거 이미지는 자동 삭제하지 않는다.

## 이관·백업

기존 패키지별 프로젝트는 backups/asset-names-<UUID>/에 theme/storage 사본을 먼저 보관한다. 구형 해시 원본을 검증 후 새 경로로 복사하고, 프로젝트 참조를 atomic rename으로 교체한다. 공통 슬롯별 독립 원본과 명시적 플랫폼/배율 예외를 유지하며 원본 .9.png 바이트를 그대로 복사한다. 기존 파일·프로젝트 ID·패키지명·서명키/bindings·기존 빌드/백업은 보존한다. 완료된 이관은 다시 실행하지 않는다. 중간 실패 시 기존 참조/원본에서 재시도할 수 있다.

구형 평면 저장소와 포맷 1·2 백업은 준비 폴더에서 변환 후 프로젝트로 등록한다. 새 포맷 3은 활성 참조의 깊은 경로와 해시를 포함하며 index.json은 복원 시 재구성한다. ZIP에 폴더 항목을 불필요하게 생성하지 않아 전체 146개 원본도 기존 한도 안에서 백업/복원한다. 새 프로젝트로 복원하면 별도 패키지 폴더이므로 같은 역할 파일명끼리 섞이지 않는다. 키·세션·캐시·미사용 과거 원본은 ZIP에 포함하지 않는다.

## 검증과 실제 반영

- 전체 단위/API 44개 통과. 51개 공통 역할/146개 출력의 고유 경로, 독립 파일, 버전/동시 업로드·실행취소/캐시, 플랫폼/배율 예외와 해제, 원본 9-patch, 변조/검증 정보 누락, 전체 템플릿 ZIP, 구형 백업과 이관 전후 출력 일치를 검사했다.
- storage-workflow, unified-design, state-geometry, screen-workflow, editor-upgrade, browser 모두 통과. 새 이름의 실제 업로드/조회·백업/복제·재연결·이력·가이드·키/두 플랫폼 생성/다운로드와 화면 캡처를 확인했다.
- integration은 이름이 변환된 프로젝트 원본에서 실제 APK/ktheme를 생성했다. 다중 가이드·합성 말풍선·resources.arsc STORE/정렬·서명·같은 키 업데이트·키 복원/다른 키 차단 통과. 근거: integration-0.7.0.json.
- audit-screens/audit-coverage/support-matrix 통과. 공통51, iOS 속성105, Android 색상49, 이미지82그룹/146출력 누락 없음.
- 현재 .data의 프로젝트 2개를 검증 후 이관하고 같은 포트/인증값으로 서버를 재시작했다. 그중 해시 참조가 있던 프로젝트 1개의 참조 1개를 변환했다. 프로젝트별 146개 PNG를 포함한 전체 생성 파일의 바이트 해시가 동일하며 기존 원본/키/빌드/백업 182개 파일의 내용 또는 키 메타데이터가 그대로다. 복구 기록은 .data/backups/asset-names-transition-2026-10-25T16-58-59-681Z에 있다. 개인키와 인증값을 보고서/캡처에 복사하지 않았다.

실제 카카오톡/실기기 적용은 추가 검증하지 않았으며 deviceVerified=false를 유지한다. 상세 재현 명령과 경계는 TESTING/VERIFICATION을 따른다.
