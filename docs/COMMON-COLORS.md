# 공통 정책 연결 검토 (0.12.0)

동일 역할의 색상 39개를 공통 정책으로 관리한다. 공통 자동값은 팔레트의 의미에 따라 양 플랫폼에 같은 색을 매핑하며, 공통 지정값은 commonColors에 보관한다. 기존 팔레트를 화면별 편집 때문에 변경하지 않는다. 플랫폼별 overrides가 가장 우선이고, 예외를 공통값으로 연결할 때만 해당 속성을 해제한다.

명시적인 공통색은 #RRGGBB 불투명 색상이다. 투명도가 있는 자동 목록/입력 메뉴 배경은 공통 기본 투명도(0/.05/.04)를 두 플랫폼에 매핑한다. 자세한 투명도와 Android ARGB는 플랫폼별 재정의를 유지한다. Android가 이름·내용 또는 여러 상태에 하나의 슬롯을 제공하는 경우 공통으로 묶되 iOS만 세분화할 수 있다.

공통 이미지51개와 출력별/플랫폼별/배율별 이미지 예외, 공통 말풍선 본체·캐릭터 및 글자색, 테마 정보·ID·모드는 기존 공통 정책을 유지한다. 9-patch 물리 좌표와 iOS 논리 좌표의 직접 병합은 하지 않으며, 공통 말풍선 기하에서 각 플랫폼 가이드를 생성한다.

## 공통 색상

| 역할 | iOS | Android | 범위·차이 |
|---|---|---|---|
| 기본 화면 배경 | `MainViewStyle-Primary/background-color` | `theme_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 화면 제목 글자 | `HeaderStyle-Main/-ios-text-color` | `theme_header_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 상단 탭 글자 | `HeaderStyle-Main/-ios-tab-text-color` | `theme_feature_browse_tab_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 상단 탭 선택 글자 | `HeaderStyle-Main/-ios-tab-highlighted-text-color` | `theme_feature_browse_tab_focused_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 목록 이름 글자 | `MainViewStyle-Primary/-ios-text-color` | `theme_title_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 누른 목록 이름 글자 | `MainViewStyle-Primary/-ios-highlighted-text-color` | `theme_title_pressed_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 목록 설명 글자 | `MainViewStyle-Primary/-ios-description-text-color` | `theme_description_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 누른 목록 설명 글자 | `MainViewStyle-Primary/-ios-description-highlighted-text-color` | `theme_description_pressed_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 목록 보조 글자 | `MainViewStyle-Primary/-ios-paragraph-text-color` | `theme_paragraph_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 누른 목록 보조 글자 | `MainViewStyle-Primary/-ios-paragraph-highlighted-text-color` | `theme_paragraph_pressed_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 목록 항목 배경 | `MainViewStyle-Primary/-ios-normal-background-color`<br>`MainViewStyle-Primary/-ios-normal-background-alpha` | `theme_body_cell_color` | 공통색은 불투명 색상입니다. 투명도는 플랫폼별 세부 설정에서 조절합니다. |
| 누른 목록 항목 배경 | `MainViewStyle-Primary/-ios-selected-background-color`<br>`MainViewStyle-Primary/-ios-selected-background-alpha` | `theme_body_cell_pressed_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 보조 목록 배경 | `MainViewStyle-Secondary/background-color` | `theme_body_secondary_cell_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 구역 제목 글자 | `SectionTitleStyle-Main/-ios-text-color`<br>`SectionTitleStyle-Main/-ios-text-alpha` | `theme_section_title_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 주요 기능 글자 | `FeatureStyle-Primary/-ios-text-color` | `theme_feature_primary_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 하단 탭 배경 | `TabBarStyle-Main/background-color` | `theme_maintab_cell_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 태블릿 사이드바 배경 | `TabBarStyle-Main/-background-sidebar-color` | `theme_navigationrail_background_color` | 태블릿·가로의 사이드바/내비게이션 레일에 사용합니다. |
| 대화방 배경 | `BackgroundStyle-ChatRoom/background-color` | `theme_chatroom_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 읽지 않은 메시지 숫자 | `MessageCellStyle-Send/-ios-unread-text-color`<br>`MessageCellStyle-Receive/-ios-unread-text-color` | `theme_chatroom_unread_count_color` | Android는 보낸 쪽·받은 쪽이 한 색상을 공유합니다. |
| 메시지 입력창 배경 | `InputBarStyle-Chat/background-color` | `theme_chatroom_input_bar_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 메시지 입력 글자 | `InputBarStyle-Chat/-ios-button-text-color` | `theme_chatroom_input_bar_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 입력창 메뉴 아이콘 | `InputBarStyle-Chat/-ios-button-normal-foreground-color`<br>`InputBarStyle-Chat/-ios-button-highlighted-foreground-color` | `theme_chatroom_input_bar_menu_icon_color` | Android는 기본·누름 상태가 같은 색상을 사용합니다. |
| 입력창 메뉴 버튼 배경 | `InputBarStyle-Chat/-ios-button-normal-background-color`<br>`InputBarStyle-Chat/-ios-button-normal-background-alpha` | `theme_chatroom_input_bar_menu_button_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 보내기 버튼 배경 | `InputBarStyle-Chat/-ios-send-normal-background-color`<br>`InputBarStyle-Chat/-ios-send-highlighted-background-color` | `theme_chatroom_input_bar_send_button_color` | Android는 기본·누름 상태가 같은 색상을 사용합니다. |
| 보내기 버튼 아이콘 | `InputBarStyle-Chat/-ios-send-normal-foreground-color`<br>`InputBarStyle-Chat/-ios-send-highlighted-foreground-color` | `theme_chatroom_input_bar_send_icon_color` | Android는 기본·누름 상태가 같은 색상을 사용합니다. |
| 잠금화면 배경 | `BackgroundStyle-Passcode/background-color` | `theme_passcode_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 잠금 안내 글자 | `LabelStyle-PasscodeTitle/-ios-text-color` | `theme_passcode_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 키패드 배경 | `PasscodeStyle/-ios-keypad-background-color` | `theme_passcode_keypad_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 키패드 숫자 | `PasscodeStyle/-ios-keypad-text-normal-color` | `theme_passcode_keypad_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 공통 버튼 배경 | `ButtonStyle-Main/background-color` | `theme_button_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 누른 공통 버튼 배경 | `ButtonStyle-Main/-ios-highlighted-background-color` | `theme_button_pressed_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 선택 공통 버튼 배경 | `ButtonStyle-Main/-ios-selected-background-color` | `theme_button_selected_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 앱 안 알림 배경 | `BackgroundStyle-MessageNotificationBar/background-color` | `theme_notification_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 앱 안 알림 글자 | `LabelStyle-MessageNotificationBarName/-ios-text-color`<br>`LabelStyle-MessageNotificationBarMessage/-ios-text-color` | `theme_notification_color` | Android는 이름·내용이 한 색상을 공유합니다. iOS에서만 나누려면 세부 설정을 사용하세요. |
| 메시지 전달 안내 배경 | `BackgroundStyle-DirectShareBar/background-color` | `theme_direct_share_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 메시지 전달 안내 글자 | `LabelStyle-DirectShareBarName/-ios-text-color` | `theme_direct_share_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 전달 후 대화방 이동 글자 | `LabelStyle-DirectShareBarMessage/-ios-text-color` | `theme_direct_share_button_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 하단 탭 위 안내 배너 | `BottomBannerStyle/background-color` | `theme_tab_bannerbadge_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |
| 하단 탭 위 라이트 안내 배너 | `BottomBannerStyle-Light/background-color` | `theme_tab_lightbannerbadge_background_color` | 공통값 적용 후 플랫폼별 재정의 가능 |

## 기존 공통 정책 또는 플랫폼 전용

같은 위치/역할로 볼 수 없는 항목을 이름만 비슷하다는 이유로 합치지 않는다. 아래 예외와 공통 매핑으로 모든 카탈로그 색상·투명도를 전수 분류한다. 새 속성이 누락되면 감사가 실패한다.

| 플랫폼 | 속성 | 분류 근거 |
|---|---|---|
| ios | `SectionTitleStyle-Main/border-color` | 구역 구분선 전용. Android 목록 항목 구분선과 적용 위치가 다릅니다. |
| ios | `SectionTitleStyle-Main/border-alpha` | iOS 구역 구분선 투명도. Android와 적용 위치가 다릅니다. |
| ios | `MessageCellStyle-Send/-ios-text-color` | 기존 공통 말풍선의 보낸 글자색으로 관리합니다. |
| ios | `MessageCellStyle-Send/-ios-selected-text-color` | 기존 공통 말풍선 글자색을 따르며 선택 상태를 개별 조정할 수 있습니다. |
| ios | `MessageCellStyle-Receive/-ios-text-color` | 기존 공통 말풍선의 받은 글자색으로 관리합니다. |
| ios | `MessageCellStyle-Receive/-ios-selected-text-color` | 기존 공통 말풍선 글자색을 따르며 선택 상태를 개별 조정할 수 있습니다. |
| android | `theme_feature_primary_pressed_color` | iOS에 같은 주요 기능의 누름 색상 슬롯이 없습니다. |
| android | `theme_header_cell_color` | Android 헤더 셀 배경 전용입니다. |
| android | `theme_body_cell_border_color` | 목록 항목 구분선 전용. iOS 구역 구분선과 적용 위치가 다릅니다. |
| android | `theme_notification_background_pressed_color` | iOS에 같은 알림 누름 배경 슬롯이 없습니다. |
| android | `theme_passcode_keypad_pressed_color` | Android 키패드 누름 숫자색 전용입니다. |
| android | `theme_passcode_keypad_pressed_background_color` | Android 키패드 누름 배경색 전용입니다. iOS는 별도 이미지를 사용합니다. |
| android | `theme_passcode_pattern_line_color` | Android 패턴 잠금 전용입니다. |
| android | `theme_chatroom_bubble_me_color` | 기존 공통 말풍선의 보낸 글자색으로 관리합니다. |
| android | `theme_chatroom_bubble_you_color` | 기존 공통 말풍선의 받은 글자색으로 관리합니다. |
| android | `theme_navigationbar_background_color` | Android 시스템 내비게이션 영역 전용입니다. |

재현: node scripts/audit-common-colors.mjs. 상세 기계 판독 결과는 common-color-coverage.json이다. 실제 카카오톡 렌더링 검증은 별도다.
