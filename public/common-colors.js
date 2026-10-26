const list=['friends','chats'];
const policy=(id,label,screens,ios,android,fallback,note='',alpha=[])=>({id,label,screens,ios:Array.isArray(ios)?ios:[ios],android:Array.isArray(android)?android:[android],fallback,note,alpha});
export const COMMON_COLORS=[
 policy('mainBackground','기본 화면 배경',list,'MainViewStyle-Primary/background-color','theme_background_color','main'),
 policy('headerText','화면 제목 글자',list,'HeaderStyle-Main/-ios-text-color','theme_header_color','text'),
 policy('headerTabText','상단 탭 글자',list,'HeaderStyle-Main/-ios-tab-text-color','theme_feature_browse_tab_color','secondary'),
 policy('headerTabSelectedText','상단 탭 선택 글자',list,'HeaderStyle-Main/-ios-tab-highlighted-text-color','theme_feature_browse_tab_focused_color','accent'),
 policy('listTitle','목록 이름 글자',list,'MainViewStyle-Primary/-ios-text-color','theme_title_color','text'),
 policy('listTitlePressed','누른 목록 이름 글자',list,'MainViewStyle-Primary/-ios-highlighted-text-color','theme_title_pressed_color','accent'),
 policy('listDescription','목록 설명 글자',list,'MainViewStyle-Primary/-ios-description-text-color','theme_description_color','secondary'),
 policy('listDescriptionPressed','누른 목록 설명 글자',list,'MainViewStyle-Primary/-ios-description-highlighted-text-color','theme_description_pressed_color','accent'),
 policy('listParagraph','목록 보조 글자',list,'MainViewStyle-Primary/-ios-paragraph-text-color','theme_paragraph_color','secondary'),
 policy('listParagraphPressed','누른 목록 보조 글자',list,'MainViewStyle-Primary/-ios-paragraph-highlighted-text-color','theme_paragraph_pressed_color','accent'),
 policy('listBackground','목록 항목 배경',list,'MainViewStyle-Primary/-ios-normal-background-color','theme_body_cell_color','main','공통색은 불투명 색상입니다. 투명도는 플랫폼별 세부 설정에서 조절합니다.',['MainViewStyle-Primary/-ios-normal-background-alpha']),
 policy('listPressedBackground','누른 목록 항목 배경',list,'MainViewStyle-Primary/-ios-selected-background-color','theme_body_cell_pressed_color','chat','',['MainViewStyle-Primary/-ios-selected-background-alpha']),
 policy('secondaryBackground','보조 목록 배경',list,'MainViewStyle-Secondary/background-color','theme_body_secondary_cell_color','main'),
 policy('sectionTitle','구역 제목 글자',list,'SectionTitleStyle-Main/-ios-text-color','theme_section_title_color','accent','',['SectionTitleStyle-Main/-ios-text-alpha']),
 policy('featureText','주요 기능 글자',list,'FeatureStyle-Primary/-ios-text-color','theme_feature_primary_color','accent'),
 policy('tabBackground','하단 탭 배경',list,'TabBarStyle-Main/background-color','theme_maintab_cell_color','main'),
 policy('sidebarBackground','태블릿 사이드바 배경',list,'TabBarStyle-Main/-background-sidebar-color','theme_navigationrail_background_color','main','태블릿·가로의 사이드바/내비게이션 레일에 사용합니다.'),
 policy('chatBackground','대화방 배경',['chat'],'BackgroundStyle-ChatRoom/background-color','theme_chatroom_background_color','chat'),
 policy('unreadText','읽지 않은 메시지 숫자',['chat'],['MessageCellStyle-Send/-ios-unread-text-color','MessageCellStyle-Receive/-ios-unread-text-color'],'theme_chatroom_unread_count_color','accent','Android는 보낸 쪽·받은 쪽이 한 색상을 공유합니다.'),
 policy('inputBackground','메시지 입력창 배경',['chat'],'InputBarStyle-Chat/background-color','theme_chatroom_input_bar_background_color','input'),
 policy('inputText','메시지 입력 글자',['chat'],'InputBarStyle-Chat/-ios-button-text-color','theme_chatroom_input_bar_color','text'),
 policy('inputMenuIcon','입력창 메뉴 아이콘',['chat'],['InputBarStyle-Chat/-ios-button-normal-foreground-color','InputBarStyle-Chat/-ios-button-highlighted-foreground-color'],'theme_chatroom_input_bar_menu_icon_color','accent','Android는 기본·누름 상태가 같은 색상을 사용합니다.'),
 policy('inputMenuBackground','입력창 메뉴 버튼 배경',['chat'],'InputBarStyle-Chat/-ios-button-normal-background-color','theme_chatroom_input_bar_menu_button_color','input','',['InputBarStyle-Chat/-ios-button-normal-background-alpha']),
 policy('sendBackground','보내기 버튼 배경',['chat'],['InputBarStyle-Chat/-ios-send-normal-background-color','InputBarStyle-Chat/-ios-send-highlighted-background-color'],'theme_chatroom_input_bar_send_button_color','sent','Android는 기본·누름 상태가 같은 색상을 사용합니다.'),
 policy('sendIcon','보내기 버튼 아이콘',['chat'],['InputBarStyle-Chat/-ios-send-normal-foreground-color','InputBarStyle-Chat/-ios-send-highlighted-foreground-color'],'theme_chatroom_input_bar_send_icon_color','sentText','Android는 기본·누름 상태가 같은 색상을 사용합니다.'),
 policy('passcodeBackground','잠금화면 배경',['passcode'],'BackgroundStyle-Passcode/background-color','theme_passcode_background_color','main'),
 policy('passcodeTitle','잠금 안내 글자',['passcode'],'LabelStyle-PasscodeTitle/-ios-text-color','theme_passcode_color','text'),
 policy('keypadBackground','키패드 배경',['passcode'],'PasscodeStyle/-ios-keypad-background-color','theme_passcode_keypad_background_color','main'),
 policy('keypadText','키패드 숫자',['passcode'],'PasscodeStyle/-ios-keypad-text-normal-color','theme_passcode_keypad_color','text'),
 policy('buttonBackground','공통 버튼 배경',['friends','components'],'ButtonStyle-Main/background-color','theme_button_background_color','chat'),
 policy('buttonPressedBackground','누른 공통 버튼 배경',['friends','components'],'ButtonStyle-Main/-ios-highlighted-background-color','theme_button_pressed_background_color','accent'),
 policy('buttonSelectedBackground','선택 공통 버튼 배경',['friends','components'],'ButtonStyle-Main/-ios-selected-background-color','theme_button_selected_background_color','accent'),
 policy('notificationBackground','앱 안 알림 배경',['components'],'BackgroundStyle-MessageNotificationBar/background-color','theme_notification_background_color','main'),
 policy('notificationText','앱 안 알림 글자',['components'],['LabelStyle-MessageNotificationBarName/-ios-text-color','LabelStyle-MessageNotificationBarMessage/-ios-text-color'],'theme_notification_color','text','Android는 이름·내용이 한 색상을 공유합니다. iOS에서만 나누려면 세부 설정을 사용하세요.'),
 policy('shareBackground','메시지 전달 안내 배경',['components'],'BackgroundStyle-DirectShareBar/background-color','theme_direct_share_background_color','input'),
 policy('shareText','메시지 전달 안내 글자',['components'],'LabelStyle-DirectShareBarName/-ios-text-color','theme_direct_share_color','text'),
 policy('shareAction','전달 후 대화방 이동 글자',['components'],'LabelStyle-DirectShareBarMessage/-ios-text-color','theme_direct_share_button_color','secondary'),
 policy('tabBannerBackground','하단 탭 위 안내 배너',['components','friends','chats'],'BottomBannerStyle/background-color','theme_tab_bannerbadge_background_color','accent'),
 policy('tabLightBannerBackground','하단 탭 위 라이트 안내 배너',['components','friends','chats'],'BottomBannerStyle-Light/background-color','theme_tab_lightbannerbadge_background_color','accent')
];
for(const s of COMMON_COLORS)s.opacity=({listBackground:0,listPressedBackground:.05,inputMenuBackground:.04})[s.id]??1;
export const commonColorFor=(platform,property)=>COMMON_COLORS.find(s=>s[platform]?.includes(property)||platform==='ios'&&s.alpha.includes(property));
export const COLOR_EXCEPTIONS={
 ios:{'SectionTitleStyle-Main/border-color':'구역 구분선 전용. Android 목록 항목 구분선과 적용 위치가 다릅니다.','SectionTitleStyle-Main/border-alpha':'iOS 구역 구분선 투명도. Android와 적용 위치가 다릅니다.','MessageCellStyle-Send/-ios-text-color':'기존 공통 말풍선의 보낸 글자색으로 관리합니다.','MessageCellStyle-Send/-ios-selected-text-color':'기존 공통 말풍선 글자색을 따르며 선택 상태를 개별 조정할 수 있습니다.','MessageCellStyle-Receive/-ios-text-color':'기존 공통 말풍선의 받은 글자색으로 관리합니다.','MessageCellStyle-Receive/-ios-selected-text-color':'기존 공통 말풍선 글자색을 따르며 선택 상태를 개별 조정할 수 있습니다.'},
 android:{theme_feature_primary_pressed_color:'iOS에 같은 주요 기능의 누름 색상 슬롯이 없습니다.',theme_header_cell_color:'Android 헤더 셀 배경 전용입니다.',theme_body_cell_border_color:'목록 항목 구분선 전용. iOS 구역 구분선과 적용 위치가 다릅니다.',theme_notification_background_pressed_color:'iOS에 같은 알림 누름 배경 슬롯이 없습니다.',theme_passcode_keypad_pressed_color:'Android 키패드 누름 숫자색 전용입니다.',theme_passcode_keypad_pressed_background_color:'Android 키패드 누름 배경색 전용입니다. iOS는 별도 이미지를 사용합니다.',theme_passcode_pattern_line_color:'Android 패턴 잠금 전용입니다.',theme_chatroom_bubble_me_color:'기존 공통 말풍선의 보낸 글자색으로 관리합니다.',theme_chatroom_bubble_you_color:'기존 공통 말풍선의 받은 글자색으로 관리합니다.',theme_navigationbar_background_color:'Android 시스템 내비게이션 영역 전용입니다.'}
};
export function auditCommonColors(catalog){
 const seen={ios:new Set(),android:new Set()};for(const s of COMMON_COLORS){if(!s.screens.length)throw new Error('공통 색상 화면 연결 누락: '+s.id);for(const platform of ['ios','android'])for(const id of [...s[platform],...(platform==='ios'?s.alpha:[])]){const spec=(platform==='ios'?catalog.iosProperties:catalog.androidColors).find(x=>x.id===id);if(!spec||platform==='ios'&&!['color','number'].includes(spec.kind)||seen[platform].has(id))throw new Error('공통 색상 매핑 오류: '+id);seen[platform].add(id);}}
 for(const platform of ['ios','android'])for(const spec of platform==='ios'?catalog.iosProperties.filter(x=>['color','number'].includes(x.kind)):catalog.androidColors)if(!seen[platform].has(spec.id)&&!COLOR_EXCEPTIONS[platform][spec.id])throw new Error('분류되지 않은 색상: '+spec.id);
 return {policies:COMMON_COLORS.length,ios:seen.ios.size,android:seen.android.size,exceptions:COLOR_EXCEPTIONS};
}
export function commonColorState(p,s,styles){
 const rgb=v=>v.length===9?'#'+v.slice(3):v;
 const overridden=[...s.ios,...s.alpha].filter(id=>p.overrides?.ios?.[id]!==undefined).map(id=>({platform:'ios',id})).concat(s.android.filter(id=>p.overrides?.android?.[id]!==undefined).map(id=>({platform:'android',id})));
 const comparable=[...s.ios.map(id=>{const v=styles?.ios?.[id];return v?`${v.toUpperCase()}@${Math.round((styles?.ios?.[s.alpha[0]]??1)*255)}`:null;}),...s.android.map(id=>{const v=styles?.android?.[id];return v?`${rgb(v).toUpperCase()}@${v.length===9?parseInt(v.slice(1,3),16):255}`:null;})].filter(Boolean);
 return {value:p.commonColors?.[s.id]??p.palette[s.fallback],explicit:p.commonColors?.[s.id]!==undefined,mixed:new Set(comparable).size>1,overridden};
}
export function linkCommonColor(p,s){for(const platform of ['ios','android'])for(const id of [...s[platform],...(platform==='ios'?s.alpha:[])])delete p.overrides?.[platform]?.[id];}
export function applyCommonColors(p,styles){
 for(const s of COMMON_COLORS){const color=p.commonColors?.[s.id]??p.palette[s.fallback],opacity=p.commonColors?.[s.id]===undefined?s.opacity:1;for(const platform of ['ios','android'])for(const id of s[platform])if(p.overrides?.[platform]?.[id]===undefined)styles[platform][id]=platform==='android'&&opacity<1?'#'+Math.round(opacity*255).toString(16).padStart(2,'0')+color.slice(1):color;for(const id of s.alpha)if(p.overrides?.ios?.[id]===undefined)styles.ios[id]=opacity;}
 return styles;
}
