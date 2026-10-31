# 최초 설치와 실행 환경

설치 상태를 먼저 확인하고 부족한 구성만 준비한다. 이 문서는 Codex와 Claude Code가 공유한다. 현재 실행·검증 기준은 macOS이며 다른 OS의 런처/전체 제작 흐름을 지원 확인된 것으로 안내하지 않는다. 개인 컴퓨터의 경로를 새 코드에 하드코딩하지 않는다.

실제 환경 준비를 수행할 때는 패키지 다운로드 네트워크, 설치 위치의 쓰기 권한, 로컬 명령·브라우저와 `127.0.0.1` 접속 가능 여부를 확인한다. 기존 권한과 요청 범위 안에서 진행하고 권한이 부족한 단계만 구체적으로 알린다. lockfile대로 실행 패키지를 설치하는 것과 앱의 의존성 선언·버전을 수정하는 것은 구분한다.

## 작업별 필수 구성

| 구성 | 편집·미리보기 / iOS ktheme | Android APK | 설치·개발 검증 |
|---|---|---|---|
| Node.js | 필수, 현재 `package.json` 기준 22 이상 | 필수 | 필수 |
| 프로젝트 실행 의존성 | 필수, 고정 lockfile 사용 | 필수 | 필수 |
| 로컬 브라우저와 loopback 접근 | UI 사용 시 필수 | UI 사용 시 필수 | 브라우저 테스트와 구분 |
| Git | 원격 최신화할 때 필요 | 동일 | Git 없는 배포도 사용 가능 |
| JDK 17 이상 | 불필요 | 필수, `javac`·`java`·`keytool` 포함 | SDK 관리 도구도 별도 Java 요구가 있을 수 있음 |
| 안정 SDK Platform 37 이상 | 불필요 | 필수, `android.jar` 포함 | 현재 소스의 SDK 정책 확인 |
| 안정 SDK Build Tools 37 이상 | 불필요 | 필수, 아래 5개 실행 도구 포함 | preview/rc로 우회하지 않음 |
| 제작자 서명키 | 불필요 | 생성·선택·잠금 해제 필요 | 기존 키 연결 유지 |
| SDK 관리 도구 | 불필요 | SDK 설치/변경 시 필요 | Android Studio SDK Manager 또는 CLI |
| Platform Tools(`adb`)·에뮬레이터·시스템 이미지 | 불필요 | 파일 생성에는 불필요 | 설치/기기 검증할 때만 |
| Playwright·Chromium | 일반 사용에는 불필요 | 동일 | 자동 브라우저 테스트할 때만 |

현재 SDK 정책은 `src/android.mjs`의 상수와 `doctor()`를 기준으로 한다. 현재 `targetSdk=37`, `minSdk=28`이며 README에 기록된 검증 패키지는 `platforms;android-37.2`와 `build-tools;37.0.0`이다. 저장소 갱신 후 요구 조건이 바뀌면 그 버전에 맞춘다. iOS ktheme는 Xcode 프로젝트나 IPA가 아니며 생성에 Xcode·Apple 개발자 계정·iOS 코드 서명 인증서가 필요하지 않다.

## 1. Node.js·의존성·브라우저

확인한 스튜디오 루트를 cwd로 사용한다. Node가 없으면 준비 스크립트도 실행할 수 없으므로 [공식 Node 배포](https://nodejs.org/en/download)에서 호스트 CPU/OS와 `engines.node`에 맞는 지원 LTS를 먼저 설치한다. 기존 정상 환경을 최신 버전으로 일괄 업그레이드하지 않는다. Codex 번들 Node 경로가 Claude에도 있다고 가정하지 않는다.

```sh
node --version
npm --version
pnpm --version
```

이미 설치된 호환 pnpm을 우선 사용한다. 없으면 [pnpm 공식 설치 안내](https://pnpm.io/installation)에 따라 호스트에서 사용 가능한 버전을 준비한다. `packageManager` 필드가 있으면 그 버전을 따른다. 현재 저장소는 pnpm lockfile v9이며 이 문서 작성 환경의 pnpm은11.25.0이다. 전역 설치 대신 다음처럼 버전을 정해 일회 실행할 수도 있다(네트워크 필요).

```sh
npm exec --yes --package=pnpm@11.25.0 -- pnpm install --frozen-lockfile
```

호환 pnpm이 있으면 다음 명령을 사용한다.

```sh
pnpm install --frozen-lockfile
```

`sharp`, `jszip`, `pngjs` 등은 package.json/lockfile로 설치하고 임의 최신 버전으로 추가하지 않는다. 설치 실패 시 lockfile 재생성이나 네이티브 패키지 버전 변경으로 우회하지 않는다. 모듈 누락으로 doctor가 실행되지 않으면 의존성 설치부터 해결한다. 호스트 아키텍처가 다른 `node_modules`를 복사해 재사용하지 않는다.

브라우저 테스트를 요청받은 경우에만 로컬 Playwright 버전의 Chromium을 `pnpm exec playwright install chromium`으로 설치한다. 일반 편집은 기존 로컬 브라우저를 사용한다. 셸 PATH가 없는 Finder 실행은 Node를 못 찾을 수 있으므로 같은 환경의 터미널에서 런처를 실행한다.

## 2. Android용 JDK

JRE만으로는 부족하다. 기존 JDK의 실제 `javac` 버전과 도구를 확인한다. 없으면 [Eclipse Temurin 공식 설치 안내](https://adoptium.net/installation/) 등 JDK 배포자의 macOS 설치 패키지에서 CPU에 맞는 JDK 17 이상을 설치한다. Apple Silicon은 arm64, Intel Mac은 x64를 고른다. 이미 정상인 JDK를 교체하거나 다른 프로젝트의 Java 기본값을 바꾸지 않는다.

macOS에서 설치된 JDK를 확인하고, 예를 들어 설치한 JDK 17을 현재 셸에 선택한다.

```sh
/usr/libexec/java_home -V
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export PATH="$JAVA_HOME/bin:$PATH"
"$JAVA_HOME/bin/java" -version
"$JAVA_HOME/bin/javac" -version
test -x "$JAVA_HOME/bin/keytool"
```

17 이외의 호환 JDK를 사용한다면 설치된 버전을 선택한다. `JAVA_HOME`은 `bin`이 아닌 JDK 홈이다. 현재 앱의 탐색 순서는 `JAVA_HOME`, `STUDIO_JAVA_HOME`, 설치 목록 등이며 기존 우선 경로가 올바른지 확인한다. doctor는 `javac` 파일 존재를 확인하지만 실제 Java 메이저 버전까지 검증하지 않으므로 `javac -version`을 별도로 본다. SDK 관리 도구가 더 높은 Java 버전을 요구하면 그 도구의 요구를 확인하고 호환 JDK로 실행한다. 이를 이유로 앱 소스를 수정하지 않는다.

## 3. Android SDK 설치

이미 있는 SDK와 설정을 먼저 확인한다. [Android Studio의 SDK Manager](https://developer.android.com/studio)에서 안정 SDK Platform과 Build Tools를 설치할 수 있다. Android Studio·Gradle·NDK를 매번 실행하거나 추가 설치할 필요는 없다. SDK 경로는 Studio의 SDK Location 또는 실제 설치 위치로 정한다.

새 macOS 기본 경로를 사용하는 예시는 다음과 같다. 기존 경로가 있으면 그 경로를 재사용한다.

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
```

[공식 환경변수 문서](https://developer.android.com/tools/variables)는 `ANDROID_HOME`을 사용하고 `ANDROID_SDK_ROOT`를 deprecated로 표시한다. 현재 앱은 `ANDROID_SDK_ROOT`를 먼저 읽으므로 기존 값도 설정되어 있다면 같은 SDK 루트를 가리키게 해야 한다. `ANDROID_HOME`은 `platforms`나 `cmdline-tools` 폴더가 아닌 SDK 루트다.

CLI만 쓰려면 공식 [Android CLI](https://developer.android.com/tools/agents/android-cli/commands/sdk) 또는 [Command-Line Tools](https://developer.android.com/tools/sdkmanager)를 설치한다. 공식 문서는 현재 `android sdk`를 권장하며 `sdkmanager`는 deprecated다. 앱의 doctor는 기존 `sdkmanager` 설치 명령을 출력하므로 이미 있는 호환 도구로 같은 패키지를 설치해도 된다. Android CLI를 사용할 때는 공식 명령 도움말로 패키지·SDK 경로 옵션을 확인한다. 패키지 설치 도구 변경을 이유로 스튜디오를 패치하지 않는다.

기존 `sdkmanager`를 사용하는 경우 Command-Line Tools의 실행 파일 위치는 아래 구조여야 한다. 공식 배포 압축을 해제해 `latest` 아래에 `bin`·`lib`·`source.properties`를 둔다. 이중 `cmdline-tools/cmdline-tools` 구조가 되지 않게 한다.

```text
<SDK>/cmdline-tools/latest/bin/sdkmanager
<SDK>/cmdline-tools/latest/lib/
<SDK>/platforms/android-37.2/android.jar
<SDK>/build-tools/37.0.0/{aapt,aapt2,d8,zipalign,apksigner}
```

```sh
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
sdkmanager --sdk_root="$ANDROID_HOME" --list --channel=0
sdkmanager --sdk_root="$ANDROID_HOME" "platforms;android-37.2" "build-tools;37.0.0"
sdkmanager --sdk_root="$ANDROID_HOME" --licenses
```

패키지명은 현재 README/doctor 결과와 설치 목록을 대조해 사용한다. 목록에 없으면 네트워크·SDK 도구 버전·안정 채널·사용 플랫폼을 확인한다. 요구 버전보다 낮은 SDK나 preview로 대체하지 않는다. 표시되는 라이선스는 사용자가 확인하고 수락한다. Platform Tools/에뮬레이터/시스템 이미지는 설치 검증을 요청받았을 때만 추가한다.

## 4. 설치 후 점검과 실행

선택한 JDK/SDK 환경을 같은 셸의 스튜디오 서버에 전달한다. 현재 셸에만 설정하는 것을 기본으로 하고, 셸 초기화 파일의 영구 수정은 요청된 설정 범위에 맞춰 수행한다. 기존 의존성 버전·lockfile·소스·템플릿은 환경 준비를 이유로 바꾸지 않는다. 사용자가 이 문서 보강만 요청했다면 실제 도구 설치나 호스트 설정 변경은 수행하지 않는다.

```sh
node skills/kakao-theme-studio/scripts/prepare.mjs --repo . --doctor
node scripts/launch.mjs
```

`doctor.status=checked`는 실행됐다는 의미다. Android 준비 완료는 안쪽 `doctor.environment.ok=true`와 `missing=[]`, 선택된 SDK/JDK 경로 및 실제 `javac` 버전을 함께 확인한다. exit 0만으로 정상이라고 판단하지 않는다. doctor는 SDK 관리 CLI·라이선스·실제 컴파일·기기 적용까지 보증하지 않는다. 준비 완료와 실제 APK 생성 검증을 구분한다.

SDK/JDK가 없더라도 편집·미리보기와 iOS 생성은 가능하다. 현재 UI의 두 플랫폼 생성은 iOS를 먼저 만들고 Android 실패를 부분 성공으로 기록할 수 있다. 반면 CLI `build`는 먼저 키 잠금 해제를 요구하므로 SDK 없는 iOS 전용 명령처럼 안내하지 않는다. 부분 결과가 괜찮은지 사용자 목표에 맞춰 처리하고 Android 전체 성공으로 보고하지 않는다.

런처가 제공하는 로컬 인증 링크를 브라우저로 열고 토큰을 출력·공유하지 않는다. 선택한 데이터 루트와 실제 프로젝트 위치를 확인한다. 설치 후에도 이전 서버는 이전 환경변수를 사용하므로 저장/생성 상태를 확인한 뒤 정상 재시작해야 한다. 현재 실행 환경·부족분·설치한 구성·남은 단계만 간단히 보고한다.
