export const COMPONENT_SCENES={
 notification:{label:'앱 안 새 메시지 알림',note:'채팅 목록을 보는 중 나타나는 카카오톡 내부 알림입니다. 휴대폰 잠금화면의 시스템 알림은 테마 적용 대상이 아닙니다.'},
 share:{label:'메시지 전달 안내',note:'다른 대화방에 메시지를 전달했을 때의 안내 배너와 대화방 이동 글자색을 확인합니다.'},
 buttons:{label:'친구 추가 · 공통 버튼',note:'친구 추가 흐름을 예로 공통 버튼의 기본·누름·선택 색과 친구 추가 아이콘을 확인합니다. 공통 버튼은 여러 화면에서 함께 쓰입니다.'},
 tab:{label:'탭 위 안내 배너',note:'하단 탭 위에 표시되는 안내 배너의 배경입니다. 기본·라이트 상태를 비교할 수 있으며, 광고 이미지 자체를 바꾸는 설정은 아닙니다.'}
};
export function componentSceneForProperty(id){return /Notification|theme_notification/.test(id)?'notification':/DirectShare|theme_direct_share/.test(id)?'share':/BottomBanner|bannerbadge/.test(id)?'tab':/ButtonStyle|theme_button|friend_add/.test(id)?'buttons':null;}
export function renderComponents({ctx,platform,c,value,values,img,file,drawNine,hit,prop,rr,text,cover,scene='notification',buttonState='normal',bannerState='normal'}){
 const box=(label,x,y,w,h,r,color,target)=>{rr(ctx,x,y,w,h,r,color);if(target)hit(label,x,y,w,h,target);};
 const label=(name,str,x,y,size,color,target,weight=400)=>{text(ctx,str,x,y,size,color,weight);if(target){const m=ctx.measureText(str);hit(name,x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,m.actualBoundingBoxLeft+m.actualBoundingBoxRight,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,target);}};
 const inkFor=color=>{const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722<145?'#FFFFFF':c.text;};
 const line=(y)=>{ctx.fillStyle='#8B95851A';ctx.fillRect(20,y,350,1);};
 const header=(title)=>{text(ctx,'‹',20,83,30,c.text);text(ctx,title,55,78,21,c.text,650);line(104);};
 const tabs=()=>{ctx.fillStyle=value('TabBarStyle-Main/background-color','theme_maintab_cell_color',c.main);ctx.fillRect(0,704,390,76);if(platform==='android'&&img('tab'))drawNine(ctx,img('tab'),0,704,390,76,{patch:file('tab')?.patch,scale:3});else cover(ctx,img('tab'),0,704,390,76);for(const [i,key] of ['friends','chats','now','shopping','more'].entries()){const image=img(key+'Icon'+(key===(scene==='buttons'?'friends':'chats')?'Selected':''));if(image)ctx.drawImage(image,25+i*76,715,30,30);text(ctx,['친구','채팅','지금','쇼핑','더보기'][i],27+i*76,763,10,c.secondary);}};
 const list=()=>{text(ctx,'채팅',22,84,27,c.text,700);text(ctx,'⌕  ＋  ⚙',276,80,20,c.text);for(const [i,name] of ['숲속의 대화','주말 산책','우리의 작은 모임','메모하는 하루','초록빛 친구'].entries()){const y=135+i*100;cover(ctx,img('profile'),22,y,52,52);text(ctx,name,90,y+18,15,c.text,550);text(ctx,i===0?'오늘도 좋은 하루 보내요 🌿':'나중에 함께 이야기해요.',90,y+43,12,c.secondary);text(ctx,'오전 9:41',308,y+17,9,c.secondary);line(y+78);}tabs();};
 if(scene==='buttons'){
  header('친구 추가');text(ctx,'전화번호로 친구 추가',24,147,19,c.text,600);text(ctx,'이름과 전화번호를 입력해 주세요.',24,180,13,c.secondary);
  box('',24,207,342,44,8,c.input);text(ctx,'나무  ·  010 1234 5678',39,235,14,c.text);
  const state=buttonState==='normal'?'':buttonState==='selected'?'selected':'highlighted',ios='ButtonStyle-Main/'+(state?'-ios-'+state+'-':'')+'background-color',android='theme_button_'+(buttonState==='normal'?'':buttonState+'_')+'background_color';
  const buttonColor=value(ios,android,c.chat);box('친구 추가 · 공통 버튼',24,270,342,48,10,buttonColor,prop(ios,android));text(ctx,'친구 추가',160,300,15,inkFor(buttonColor),600);
  text(ctx,'추천 친구',24,400,16,c.text,600);line(424);cover(ctx,img('profile'),24,461,58,58);text(ctx,'나무',98,483,17,c.text,550);text(ctx,'함께 아는 친구 2명',98,508,12,c.secondary);
  const image=img('friendButton'+(buttonState==='pressed'&&platform==='android'?'Pressed':''));if(image)ctx.drawImage(image,318,471,40,40);hit('추천 친구 · 친구 추가 아이콘',318,471,40,40,{slot:buttonState==='pressed'&&platform==='android'?'friendAddButtonPressed':'friendAddButton'});
  text(ctx,'친구 요청을 보내고 대화를 시작해 보세요.',24,590,13,c.secondary);tabs();
 }else if(scene==='share'){
  cover(ctx,img('background'),0,40,390,666);ctx.fillStyle=c.main;ctx.fillRect(0,40,390,65);header('숲속의 대화');
  const bubble=(str,out,y)=>{const name=out?'sent':'received',image=img(name),meta=file(name),scale=platform==='ios'?2:3,prefix='MessageCellStyle-'+(out?'Send':'Receive')+'/-ios-',insets=platform==='ios'?values[prefix+'title-edgeinsets']??[10,14,10,14]:meta?.patch?.insets.map(n=>n/scale)??[10,14,10,14], [top,left,bottom,right]=insets;ctx.font='14px -apple-system,BlinkMacSystemFont,sans-serif';const w=Math.ceil(Math.max(meta?.logical?.width??64,ctx.measureText(str).width+left+right)-1e-9),h=Math.ceil(Math.max(meta?.logical?.height??56,23+top+bottom)-1e-9),g=meta?.composition,x=out?365-w+(g?g.width-g.bodyRect.x-g.bodyWidth:0):73-(g?.bodyRect.x??0);y+=(g?.layoutHeader??0)-(g?.header??0);drawNine(ctx,image,x,y,w,h,{scale,patch:meta?.patch,stretch:values[prefix+'background-image']});text(ctx,str,x+left,y+top+17,14,out?c.sentText:c.receivedText);return h+(g?.layoutHeader??0)-(g?.header??0);};
  cover(ctx,img('profile'),20,260,40,40);text(ctx,'나무',73,255,12,c.secondary);const height=bubble('주말 산책 사진이에요.',false,268);bubble('친구에게도 전달했어요.',true,268+height+24);
  box('메시지 전달 안내 배경',12,119,366,86,12,value('BackgroundStyle-DirectShareBar/background-color','theme_direct_share_background_color',c.input),prop('BackgroundStyle-DirectShareBar/background-color','theme_direct_share_background_color'));
  label('전달 안내 이름 글자','나무에게 메시지를 전달했습니다.',28,151,14,value('LabelStyle-DirectShareBarName/-ios-text-color','theme_direct_share_color',c.text),prop('LabelStyle-DirectShareBarName/-ios-text-color','theme_direct_share_color'),550);
  label('전달 안내 · 대화방으로 이동','대화방으로 이동  ›',28,182,13,value('LabelStyle-DirectShareBarMessage/-ios-text-color','theme_direct_share_button_color',c.accent),prop('LabelStyle-DirectShareBarMessage/-ios-text-color','theme_direct_share_button_color'),600);
  ctx.fillStyle=value('InputBarStyle-Chat/background-color','theme_chatroom_input_bar_background_color',c.input);ctx.fillRect(0,706,390,74);box('',47,721,282,37,18,c.main);text(ctx,'＋',15,748,25,c.secondary);text(ctx,'메시지 입력',62,745,13,value('InputBarStyle-Chat/-ios-button-text-color','theme_chatroom_input_bar_color',c.secondary));text(ctx,'↑',346,748,23,c.accent);
 }else{
  list();
  if(scene==='tab'){
   const ios=(bannerState==='light'?'BottomBannerStyle-Light':'BottomBannerStyle')+'/background-color',android=bannerState==='light'?'theme_tab_lightbannerbadge_background_color':'theme_tab_bannerbadge_background_color';
   const background=value(ios,android,c.accent),ink=inkFor(background);box('하단 탭 위 안내 배너',12,640,366,58,10,background,prop(ios,android));text(ctx,'새로운 소식을 확인해 보세요',28,675,14,ink,550);text(ctx,'›',349,677,22,ink);
  }else{
   ctx.save();ctx.shadowColor='#20302526';ctx.shadowBlur=16;ctx.shadowOffsetY=4;box('앱 안 새 메시지 알림 배경',12,117,366,92,15,value('BackgroundStyle-MessageNotificationBar/background-color','theme_notification_background_color',c.main),prop('BackgroundStyle-MessageNotificationBar/background-color','theme_notification_background_color'));ctx.restore();cover(ctx,img('profile'),26,136,42,42);
   label('새 메시지 알림 · 이름','나무',82,145,15,value('LabelStyle-MessageNotificationBarName/-ios-text-color','theme_notification_color',c.text),prop('LabelStyle-MessageNotificationBarName/-ios-text-color','theme_notification_color'),650);
   label('새 메시지 알림 · 내용','오늘도 좋은 하루 보내요 🌿',82,174,13,value('LabelStyle-MessageNotificationBarMessage/-ios-text-color','theme_notification_color',c.secondary),prop('LabelStyle-MessageNotificationBarMessage/-ios-text-color','theme_notification_color'));
   text(ctx,'지금',325,143,10,c.secondary);text(ctx,'×',350,192,16,c.secondary);
  }
 }
}
