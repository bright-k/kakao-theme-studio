// Screen associations are shared by navigation, contextual editors and coverage tests.
// Unknown catalog entries fail the audit instead of silently disappearing.
export const SCREENS = [
 {id:'friends',label:'친구',title:'친구 화면',note:'목록 배경·글자·기본 프로필·탭은 채팅 목록과 함께 사용됩니다.'},
 {id:'chats',label:'채팅 목록',title:'채팅 목록 화면',note:'목록 배경·글자·프로필·탭 변경은 친구 화면에도 반영됩니다.'},
 {id:'chat',label:'채팅방',title:'채팅방 디자인',note:'말풍선의 첫 번째·연속·선택 상태와 입력창을 함께 확인하세요. 선택 이미지는 iOS에 적용됩니다. 프로필은 목록과 공통입니다.'},
 {id:'passcode',label:'잠금화면',title:'잠금화면 디자인',note:'비밀번호 1~4번의 입력 전·후, 키패드 눌림 이미지와 Android 패턴 색상을 지원합니다.'},
 {id:'components',label:'배너·버튼',title:'배너·버튼 디자인',note:'알림·전달 배너와 공통 버튼을 검토합니다. 입력창 설정은 채팅방에서도 편집할 수 있습니다.'},
 {id:'identity',label:'아이콘·시작화면',title:'아이콘·시작화면',note:'테마 아이콘과 Android 12 미만용 시작 이미지입니다. 가로·태블릿 변형은 이미지 탭의 출력 대상에서 확인하세요.'}
];
const list=['friends','chats'];
export function contextsFor(item,kind){
 if(kind==='resources'){
  switch(item.group){
   case '말풍선':return ['chat'];
   case '탭':return [...list,'components'];
   case '잠금화면':return ['passcode'];
   case '프로필':return [...list,'chat'];
   case '시작화면':case '테마 아이콘':return ['identity'];
   case '버튼':return ['friends','components'];
   case '배경':if(/chatroom/i.test(item.name))return ['chat'];if(/mainBgImage|theme_background_image/.test(item.name))return list;break;
  }
 }else if(kind==='ios'){
  const s=item.selector;
  if(s==='ManifestStyle')return ['settings'];
  if(/Passcode/.test(s))return ['passcode'];
  if(/MessageCell|BackgroundStyle-ChatRoom/.test(s))return ['chat'];
  if(/InputBar/.test(s))return ['chat','components'];
  if(/Notification|DirectShare/.test(s))return ['components'];
  if(/TabBar/.test(s))return list;
  if(/BottomBanner/.test(s))return [...list,'components'];
  if(/DefaultProfile/.test(s))return [...list,'chat'];
  if(/ButtonStyle/.test(s))return ['friends','components'];
  if(/^(HeaderStyle-Main|MainViewStyle-Primary|MainViewStyle-Secondary|SectionTitleStyle-Main|FeatureStyle-Primary)$/.test(s))return list;
 }else if(kind==='android'){
  switch(item.group){
   case '채팅방':return /input_bar/.test(item.id)?['chat','components']:['chat'];
   case '잠금화면':return ['passcode'];
   case '배너':return ['components'];
   case '탭':return [...list,'components'];
   case '목록·버튼':return /theme_button_/.test(item.id)?['friends','components']:list;
  }
 }
 throw new Error(`화면 연결이 없는 구성: ${kind}/${item.id}`);
}
export function inScreen(item,kind,screen){return !screen||contextsFor(item,kind).includes(screen);}
export function slotsForScreen(screen){
 const icons=['friends','chats','now','shopping','more','local','call','piccoma'].flatMap(x=>[x+'Icon',x+'IconSelected']);
 const profiles=['profile','profile2','profile3','profileFull1','profileFull2','profileFull3'];
 switch(screen){
  case 'friends':return ['mainBackground',...profiles,'tabBackground',...icons,'friendAddButton','friendAddButtonPressed'];
  case 'chats':return ['mainBackground',...profiles,'tabBackground',...icons];
  case 'chat':return ['chatBackground',...profiles,...['sent','received'].flatMap(x=>['Bubble','BubbleGroup','BubbleSelected','BubbleGroupSelected'].map(y=>x+y))];
  case 'passcode':return ['lockBackground','keypadPressed',...[1,2,3,4].flatMap(n=>['passcode'+n,'passcode'+n+'Selected'])];
  case 'components':return ['friendAddButton','friendAddButtonPressed','tabBackground'];
  case 'identity':return ['themeIcon','splashBackground'];
  default:throw new Error('알 수 없는 화면: '+screen);
 }
}
export function auditScreenCoverage(catalog){
 const counts={};
 for(const [kind,items] of [['ios',catalog.iosProperties],['android',catalog.androidColors],['resources',catalog.resources]]){
  for(const item of items){const contexts=contextsFor(item,kind);if(!contexts.length||contexts.some(s=>s!=='settings'&&!SCREENS.some(x=>x.id===s)))throw new Error('잘못된 화면 연결: '+item.id);}
  counts[kind]=items.length;
 }
 return {...counts,files:catalog.resources.reduce((n,r)=>n+r.variants.length,0)};
}
