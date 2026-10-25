# 26.9.0 지원 항목표

이 목록은 확보한 공식 샘플의 속성·파일 이름과 가이드의 명시된 추가 항목을 기준으로 한다. 실제 카카오톡에서의 적용 결과나 다른 버전 전체를 보증하는 목록은 아니다.

iOS 속성 105개, Android 색상 49개, 이미지 82개 그룹 / 배율·화면별 146개 출력 슬롯. 공식 샘플 이미지 127개, 문서상 추가 이미지 6개, 도구가 보완한 배율 13개.

## 편집 위치

- 공통 원본 51개는 역할별 등록·검색·썸네일·플랫폼/출력별 적용 목록에서 관리한다. 선택 출력만 공통 연결로 복귀할 수 있다.
- 미리보기의 부분을 누르면 관련 공통 설정 또는 정확한 세부 속성/출력으로 이동한다. 키보드 대상 목록도 제공한다.
- 첫/연속 말풍선은 각각 색상 또는 이미지 본체와 선택적 캐릭터를 지정한다. 연속은 본체 상속, 캐릭터 공유/전용/비활성화를 지원한다. 글자색은 첫/연속이 공유한다.
- 화면을 선택하면 미리보기와 오른쪽 설정이 함께 바뀐다. 공통 원본과 해당 화면의 모든 세부 색상·속성·이미지를 그 자리에서 조정한다.
- 비밀번호 표시 1~4번 입력 전·후 이미지, iOS 키패드 눌림 이미지는 잠금화면 디자인에서 바로 편집한다.
- iOS/Android 개별 색상·투명도·말풍선 여백/늘림은 화면별 옆 패널 또는 전체 구성·리소스에서 편집한다.
- 모든 이미지 그룹은 전체 이미지에서 상태별·배율별로 교체할 수 있다. PNG/JPEG/WebP와 유효한 원본 Android .9.png를 지원한다.
- 메타데이터 중 이름·제작자·버전·URL·모드는 테마 정보에서 관리하고 고유 ID는 자동 생성·유지한다. 새 ID는 테마 복제로 발급한다.

## 상태·원본·시각 편집

- 상태 미리보기: 비밀번호 0~4자리/누른 숫자, 8개 탭, 프로필 변형·전체 원본, 첫·연속·선택 말풍선, 기본·누름·선택 버튼, 배너 변형. 상태 전환은 프로젝트를 수정하지 않는다.
- 이미지의 실제 원본과 출력별 재정의 우선순위를 표시한다. iOS 말풍선 논리 좌표와 Android 원본/다중 9-patch의 늘림·내용 여백은 가이드 드래그·숫자로 조정한다.
- 146개 출력 슬롯과 기존 모든 typed 속성은 유지한다. 카탈로그 전체의 편집 위치는 아래와 같다.

## iOS 속성

| 영역 | 식별자 | 제어 | 편집 화면 |
|---|---|---|---|
| 테마 정보 | ManifestStyle/-kakaotalk-theme-name | 테마 정보 / ID 자동 관리 | 테마 정보 |
| 테마 정보 | ManifestStyle/-kakaotalk-theme-version | 테마 정보 / ID 자동 관리 | 테마 정보 |
| 테마 정보 | ManifestStyle/-kakaotalk-theme-url | 테마 정보 / ID 자동 관리 | 테마 정보 |
| 테마 정보 | ManifestStyle/-kakaotalk-author-name | 테마 정보 / ID 자동 관리 | 테마 정보 |
| 테마 정보 | ManifestStyle/-kakaotalk-theme-id | 테마 정보 / ID 자동 관리 | 테마 정보 |
| 탭 | TabBarStyle-Main/background-color | 개별 색상 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-background-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-background-sidebar-color | 개별 색상 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-friends-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-friends-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-chats-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-chats-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-now-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-now-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-local-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-local-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-piccoma-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-piccoma-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-shopping-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-shopping-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-call-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-call-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-more-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-more-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-openchats-normal-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 탭 | TabBarStyle-Main/-ios-openchats-selected-icon-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 목록·버튼 | HeaderStyle-Main/-ios-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | HeaderStyle-Main/-ios-tab-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | HeaderStyle-Main/-ios-tab-highlighted-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/background-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-background-image | 이미지 그룹에서 교체 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-highlighted-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-description-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-description-highlighted-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-paragraph-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-paragraph-highlighted-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-normal-background-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-normal-background-alpha | 투명도 0~1 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-selected-background-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Primary/-ios-selected-background-alpha | 투명도 0~1 | 친구·채팅 목록 |
| 목록·버튼 | MainViewStyle-Secondary/background-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | SectionTitleStyle-Main/border-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | SectionTitleStyle-Main/border-alpha | 투명도 0~1 | 친구·채팅 목록 |
| 목록·버튼 | SectionTitleStyle-Main/-ios-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | SectionTitleStyle-Main/-ios-text-alpha | 투명도 0~1 | 친구·채팅 목록 |
| 목록·버튼 | FeatureStyle-Primary/-ios-text-color | 개별 색상 | 친구·채팅 목록 |
| 목록·버튼 | ButtonStyle-Main/background-color | 개별 색상 | 친구·배너·버튼 |
| 목록·버튼 | ButtonStyle-Main/-ios-highlighted-background-color | 개별 색상 | 친구·배너·버튼 |
| 목록·버튼 | ButtonStyle-Main/-ios-selected-background-color | 개별 색상 | 친구·배너·버튼 |
| 목록·버튼 | ButtonStyle-AddFriend/-ios-image | 이미지 그룹에서 교체 | 친구·배너·버튼 |
| 프로필 | DefaultProfileStyle/-ios-profile-images | 이미지 그룹에서 교체 | 친구·채팅 목록·채팅방 |
| 목록·버튼 | BackgroundStyle-ChatRoom/background-color | 개별 색상 | 채팅방 |
| 목록·버튼 | BackgroundStyle-ChatRoom/-ios-background-image | 이미지 그룹에서 교체 | 채팅방 |
| 입력창 | InputBarStyle-Chat/background-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-send-normal-background-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-send-normal-foreground-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-send-highlighted-background-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-send-highlighted-foreground-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-button-normal-foreground-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-button-highlighted-foreground-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-button-text-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-button-normal-background-color | 개별 색상 | 채팅방·배너·버튼 |
| 입력창 | InputBarStyle-Chat/-ios-button-normal-background-alpha | 투명도 0~1 | 채팅방·배너·버튼 |
| 말풍선 | MessageCellStyle-Send/-ios-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-selected-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-group-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-group-selected-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-title-edgeinsets | top/left/bottom/right | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-group-title-edgeinsets | top/left/bottom/right | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-text-color | 개별 색상 | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-selected-text-color | 개별 색상 | 채팅방 |
| 말풍선 | MessageCellStyle-Send/-ios-unread-text-color | 개별 색상 | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-selected-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-group-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-group-selected-background-image | 늘림 지점 두 값 | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-title-edgeinsets | top/left/bottom/right | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-group-title-edgeinsets | top/left/bottom/right | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-text-color | 개별 색상 | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-selected-text-color | 개별 색상 | 채팅방 |
| 말풍선 | MessageCellStyle-Receive/-ios-unread-text-color | 개별 색상 | 채팅방 |
| 잠금화면 | BackgroundStyle-Passcode/background-color | 개별 색상 | 잠금화면 |
| 잠금화면 | BackgroundStyle-Passcode/-ios-background-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | LabelStyle-PasscodeTitle/-ios-text-color | 개별 색상 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-first-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-second-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-third-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-fourth-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-selected-first-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-selected-second-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-selected-third-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-bullet-selected-fourth-image | 이미지 그룹에서 교체 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-keypad-background-color | 개별 색상 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-keypad-text-normal-color | 개별 색상 | 잠금화면 |
| 잠금화면 | PasscodeStyle/-ios-keypad-number-highlighted-image | 이미지 그룹에서 교체 | 잠금화면 |
| 배너 | BackgroundStyle-MessageNotificationBar/background-color | 개별 색상 | 배너·버튼 |
| 배너 | LabelStyle-MessageNotificationBarName/-ios-text-color | 개별 색상 | 배너·버튼 |
| 배너 | LabelStyle-MessageNotificationBarMessage/-ios-text-color | 개별 색상 | 배너·버튼 |
| 배너 | BackgroundStyle-DirectShareBar/background-color | 개별 색상 | 배너·버튼 |
| 배너 | LabelStyle-DirectShareBarName/-ios-text-color | 개별 색상 | 배너·버튼 |
| 배너 | LabelStyle-DirectShareBarMessage/-ios-text-color | 개별 색상 | 배너·버튼 |
| 탭 | BottomBannerStyle/background-color | 개별 색상 | 친구·채팅 목록·배너·버튼 |
| 탭 | BottomBannerStyle-Light/background-color | 개별 색상 | 친구·채팅 목록·배너·버튼 |
| 테마 정보 | ManifestStyle/-kakaotalk-theme-style | 테마 정보 / ID 자동 관리 | 테마 정보 |

## Android 색상

| 영역 | 식별자 | 형식 | 편집 화면 |
|---|---|---|---|
| 목록·버튼 | theme_header_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_section_title_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_title_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_title_pressed_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_paragraph_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_paragraph_pressed_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_description_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_description_pressed_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_feature_primary_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_feature_primary_pressed_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_feature_browse_tab_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_feature_browse_tab_focused_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_background_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 채팅방 | theme_chatroom_background_color | #RRGGBB / #AARRGGBB | 채팅방 |
| 잠금화면 | theme_passcode_background_color | #RRGGBB / #AARRGGBB | 잠금화면 |
| 목록·버튼 | theme_header_cell_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_body_cell_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_body_cell_pressed_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_body_cell_border_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 목록·버튼 | theme_body_secondary_cell_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록 |
| 탭 | theme_maintab_cell_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록·배너·버튼 |
| 탭 | theme_tab_lightbannerbadge_background_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록·배너·버튼 |
| 탭 | theme_tab_bannerbadge_background_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록·배너·버튼 |
| 배너 | theme_direct_share_color | #RRGGBB / #AARRGGBB | 배너·버튼 |
| 배너 | theme_direct_share_button_color | #RRGGBB / #AARRGGBB | 배너·버튼 |
| 배너 | theme_direct_share_background_color | #RRGGBB / #AARRGGBB | 배너·버튼 |
| 배너 | theme_notification_color | #RRGGBB / #AARRGGBB | 배너·버튼 |
| 배너 | theme_notification_background_color | #RRGGBB / #AARRGGBB | 배너·버튼 |
| 배너 | theme_notification_background_pressed_color | #RRGGBB / #AARRGGBB | 배너·버튼 |
| 잠금화면 | theme_passcode_color | #RRGGBB / #AARRGGBB | 잠금화면 |
| 잠금화면 | theme_passcode_keypad_color | #RRGGBB / #AARRGGBB | 잠금화면 |
| 잠금화면 | theme_passcode_keypad_pressed_color | #RRGGBB / #AARRGGBB | 잠금화면 |
| 잠금화면 | theme_passcode_keypad_background_color | #RRGGBB / #AARRGGBB | 잠금화면 |
| 잠금화면 | theme_passcode_keypad_pressed_background_color | #RRGGBB / #AARRGGBB | 잠금화면 |
| 잠금화면 | theme_passcode_pattern_line_color | #RRGGBB / #AARRGGBB | 잠금화면 |
| 채팅방 | theme_chatroom_bubble_me_color | #RRGGBB / #AARRGGBB | 채팅방 |
| 채팅방 | theme_chatroom_bubble_you_color | #RRGGBB / #AARRGGBB | 채팅방 |
| 채팅방 | theme_chatroom_unread_count_color | #RRGGBB / #AARRGGBB | 채팅방 |
| 채팅방 | theme_chatroom_input_bar_color | #RRGGBB / #AARRGGBB | 채팅방·배너·버튼 |
| 채팅방 | theme_chatroom_input_bar_background_color | #RRGGBB / #AARRGGBB | 채팅방·배너·버튼 |
| 채팅방 | theme_chatroom_input_bar_menu_icon_color | #RRGGBB / #AARRGGBB | 채팅방·배너·버튼 |
| 채팅방 | theme_chatroom_input_bar_menu_button_color | #RRGGBB / #AARRGGBB | 채팅방·배너·버튼 |
| 채팅방 | theme_chatroom_input_bar_send_icon_color | #RRGGBB / #AARRGGBB | 채팅방·배너·버튼 |
| 채팅방 | theme_chatroom_input_bar_send_button_color | #RRGGBB / #AARRGGBB | 채팅방·배너·버튼 |
| 목록·버튼 | theme_button_background_color | #RRGGBB / #AARRGGBB | 친구·배너·버튼 |
| 목록·버튼 | theme_button_pressed_background_color | #RRGGBB / #AARRGGBB | 친구·배너·버튼 |
| 목록·버튼 | theme_button_selected_background_color | #RRGGBB / #AARRGGBB | 친구·배너·버튼 |
| 탭 | theme_navigationbar_background_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록·배너·버튼 |
| 탭 | theme_navigationrail_background_color | #RRGGBB / #AARRGGBB | 친구·채팅 목록·배너·버튼 |

## 이미지 그룹

| 플랫폼 | 영역 | 이름 | 배율·화면 수 | 편집 화면 |
|---|---|---|---|---|
| android | 시작화면 | theme_splash_image.png | 6 | 아이콘·시작화면 |
| android | 프로필 | theme_profile_01_image_full.png | 1 | 친구·채팅 목록·채팅방 |
| android | 프로필 | theme_profile_02_image_full.png | 1 | 친구·채팅 목록·채팅방 |
| android | 프로필 | theme_profile_03_image_full.png | 1 | 친구·채팅 목록·채팅방 |
| android | 배경 | theme_background_image.png | 2 | 친구·채팅 목록 |
| android | 배경 | theme_chatroom_background_image.png | 2 | 채팅방 |
| android | 탭 | theme_maintab_cell_image.9.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 잠금화면 | theme_passcode_background_image.png | 2 | 잠금화면 |
| android | 탭 | theme_maintab_ico_call_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_call_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_chats_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_chats_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_friends_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_friends_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_local_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_local_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_more_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_more_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_now_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_now_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_piccoma_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_piccoma_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_shopping_focused_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 탭 | theme_maintab_ico_shopping_image.png | 2 | 친구·채팅 목록·배너·버튼 |
| android | 말풍선 | theme_chatroom_bubble_me_01_image.9.png | 1 | 채팅방 |
| android | 말풍선 | theme_chatroom_bubble_me_02_image.9.png | 1 | 채팅방 |
| android | 말풍선 | theme_chatroom_bubble_you_01_image.9.png | 1 | 채팅방 |
| android | 말풍선 | theme_chatroom_bubble_you_02_image.9.png | 1 | 채팅방 |
| android | 버튼 | theme_find_add_friend_button_image.png | 1 | 친구·배너·버튼 |
| android | 버튼 | theme_find_add_friend_button_pressed_image.png | 1 | 친구·배너·버튼 |
| android | 잠금화면 | theme_passcode_01_checked_image.png | 1 | 잠금화면 |
| android | 잠금화면 | theme_passcode_01_image.png | 1 | 잠금화면 |
| android | 잠금화면 | theme_passcode_02_checked_image.png | 1 | 잠금화면 |
| android | 잠금화면 | theme_passcode_02_image.png | 1 | 잠금화면 |
| android | 잠금화면 | theme_passcode_03_checked_image.png | 1 | 잠금화면 |
| android | 잠금화면 | theme_passcode_03_image.png | 1 | 잠금화면 |
| android | 잠금화면 | theme_passcode_04_checked_image.png | 1 | 잠금화면 |
| android | 잠금화면 | theme_passcode_04_image.png | 1 | 잠금화면 |
| android | 프로필 | theme_profile_01_image.png | 1 | 친구·채팅 목록·채팅방 |
| android | 프로필 | theme_profile_02_image.png | 1 | 친구·채팅 목록·채팅방 |
| android | 프로필 | theme_profile_03_image.png | 1 | 친구·채팅 목록·채팅방 |
| android | 테마 아이콘 | icon.png | 1 | 아이콘·시작화면 |
| ios | 배경 | chatroomBgImage.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleReceive01.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleReceive01Selected.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleReceive02.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleReceive02Selected.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleSend01.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleSend01Selected.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleSend02.png | 2 | 채팅방 |
| ios | 말풍선 | chatroomBubbleSend02Selected.png | 2 | 채팅방 |
| ios | 테마 아이콘 | commonIcoTheme.png | 1 | 아이콘·시작화면 |
| ios | 버튼 | findBtnAddFriend.png | 2 | 친구·배너·버튼 |
| ios | 배경 | mainBgImage.png | 2 | 친구·채팅 목록 |
| ios | 탭 | maintabBgImage.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoCall.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoCallSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoChats.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoChatsSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoFriends.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoFriendsSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoLocal.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoLocalSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoMore.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoMoreSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoNow.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoNowSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoPiccoma.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoPiccomaSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoShopping.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 탭 | maintabIcoShoppingSelected.png | 2 | 친구·채팅 목록·배너·버튼 |
| ios | 잠금화면 | passcodeBgImage.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode01.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode01Selected.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode02.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode02Selected.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode03.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode03Selected.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode04.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeImgCode04Selected.png | 2 | 잠금화면 |
| ios | 잠금화면 | passcodeKeypadPressed.png | 2 | 잠금화면 |
| ios | 프로필 | profileImg01.png | 2 | 친구·채팅 목록·채팅방 |

## 제한

- 레이아웃·폰트 파일 교체는 공식 가이드의 수정 가능 범위에 포함되지 않는다.
- 스플래시 이미지는 공식 가이드상 Android 12 미만 대상이다. 생성 가능과 현재 OS에서의 표시 가능은 다르다.
- 배경 이미지를 끄면 해당 배경색을 사용한다. 임의의 필수 이미지 슬롯은 끌 수 없다.
- iOS는 RGB 색상과 별도 투명도 속성, Android는 ARGB를 사용한다.
- iOS 비밀번호 숫자 눌림은 이미지, Android는 키패드 누름 색상으로 제공된 범위를 편집한다.
- iOS 오픈채팅 아이콘은 공식 샘플에서 지금(Now) 탭 이미지와 연결되어 있다. 해당 이미지 교체는 두 사용처에 함께 반영된다.
- 데이터에 없는 새 속성을 임의로 CSS/XML에 삽입하는 기능은 제공하지 않는다.
