import {bubbleConfig,bubbleGeometry,platformBubbleProject} from '../public/bubble-model.js';
import {BACKGROUNDS} from '../public/background-model.js';
import {COMMON_COLORS} from '../public/common-colors.js';
import {PNG} from 'pngjs';
const rgb=hex=>hex.slice(-6).match(/../g).map(n=>parseInt(n,16)/255);
export function contrastRatio(a,b){const lum=hex=>{const [r,g,b]=rgb(hex).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const opaque=value=>/^#[\da-f]{6}$/i.test(value)||/^#ff[\da-f]{6}$/i.test(value);
export function contrastDiagnostics(p,styles){
 const diagnostics=[],seen=new Set();
 const check=(platform,label,body,text,field,target)=>{if(!opaque(body)||!opaque(text))return;const ratio=contrastRatio(body,text);if(ratio>=4.5)return;const key=platform+label+body+text;if(seen.has(key))return;seen.add(key);diagnostics.push({severity:'warning',field,contrast:Number(ratio.toFixed(2)),target:{platform,...target},message:`${platform==='ios'?'iOS':'Android'} ${label}의 실제 적용색 대비 ${ratio.toFixed(2)}:1 · 글자를 읽기 어려울 수 있습니다. (도구 권장 4.5:1)`});};
 for(const platform of ['ios','android']){
  for(const who of ['sent','received'])for(const group of [false,true]){
   const view=platformBubbleProject(p,platform,who,group),cfg=bubbleConfig(view,who,group),g=bubbleGeometry(view,who,group),slot=who+'Bubble'+(group?'Group':''),hasImage=!!(view.assets?.[slot]||view.assets?.[who+'Bubble']),prefix='MessageCellStyle-'+(who==='sent'?'Send':'Receive'),property=platform==='ios'?prefix+'/-ios-text-color':who==='sent'?'theme_chatroom_bubble_me_color':'theme_chatroom_bubble_you_color';
   const pattern=platform==='ios'?new RegExp('chatroomBubble'+(who==='sent'?'Send':'Receive')+(group?'02':'01')+'@'):new RegExp('theme_chatroom_bubble_'+(who==='sent'?'me':'you')+'_'+(group?'02':'01')+'_');
   if(g.imageBody&&hasImage||Object.keys(p.resourceOverrides??{}).some(file=>file.startsWith(platform+'/')&&pattern.test(file))){diagnostics.push({severity:'info',field:'bubbleDesign.'+who,contrastKnown:false,target:{platform,screen:'chat',bubble:who,group,slot},message:`${platform==='ios'?'iOS':'Android'} ${who==='sent'?'보낸':'받은'} ${group?'연속':'첫'} 말풍선은 이미지 본체입니다. 그림 위 글자 대비는 자동 판정하지 않으므로 미리보기에서 확인하세요.`});continue;}
   const body=g.imageBody?view.palette[who]:cfg.color,field=p.overrides?.[platform]?.[property]!==undefined?'overrides.'+platform+'.'+property:p.bubbleDesign?.[who]?'bubbleDesign.'+who+'.textColor':'palette.'+who+'Text';
   check(platform,(who==='sent'?'보낸':'받은')+' '+(group?'연속':'첫')+' 말풍선',body,styles[platform][property],field,{screen:'chat',property,label:'말풍선 글자색',platformDetail:true});
  }
  const value=id=>{const s=COMMON_COLORS.find(x=>x.id===id);return styles[platform][s[platform][0]];};
  for(const [bodyId,textId,slot,label] of [['mainBackground','listTitle','mainBackground','목록 글자'],['inputBackground','inputText',null,'입력창 글자'],['sendBackground','sendIcon',null,'보내기 아이콘'],['passcodeBackground','passcodeTitle','lockBackground','잠금 안내'],['keypadBackground','keypadText',null,'키패드 숫자']]){
   const file=slot&&BACKGROUNDS[slot].resources[platform==='ios'?0:1];if(file&&p.resourceOptions?.[file]?.enabled!==false&&(p.assets?.[slot]||p.resourceOverrides?.[file]))continue;
   const spec=COMMON_COLORS.find(x=>x.id===textId),property=spec[platform][0];check(platform,label,value(bodyId),value(textId),'commonColors.'+textId,{screen:spec.screens[0],property,label:spec.label});
  }
 }
 return diagnostics;
}
// Selected bodies are brightness-adjusted by the image compiler. Inspect the
// generated pixels rather than guessing their color from a palette multiplier.
export function selectedContrastDiagnostics(p,styles,files){const diagnostics=[];for(const who of ['sent','received'])for(const group of [false,true]){
 const view=platformBubbleProject(p,'ios',who,group),cfg=bubbleConfig(view,who,group),g=bubbleGeometry(view,who,group),slot=who+'Bubble'+(group?'Group':''),name='chatroomBubble'+(who==='sent'?'Send':'Receive')+(group?'02':'01')+'Selected',file='ios/Images/'+name+'@2x.png',property='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-selected-text-color';
 if(!files[file]||p.resourceOverrides?.[file]||p.resourceOverrides?.['ios/Images/'+name+'@3x.png']||g.imageBody&&(view.assets?.[slot]||view.assets?.[who+'Bubble'])||g.decorated&&cfg.layer!=='back'&&g.header+g.bodyHeight/2<cfg.size)continue;
 const image=PNG.sync.read(files[file]),x=Math.floor((g.bodyRect.x+g.bodyWidth/2)*2),y=Math.floor((g.header+g.bodyHeight/2)*2),offset=(y*image.width+x)*4;if(image.data[offset+3]!==255)continue;const body='#'+[...image.data.subarray(offset,offset+3)].map(v=>v.toString(16).padStart(2,'0')).join(''),foreground=styles.ios[property];if(!opaque(foreground))continue;const ratio=contrastRatio(body,foreground);if(ratio<4.5)diagnostics.push({severity:'warning',field:'overrides.ios.'+property,contrast:Number(ratio.toFixed(2)),target:{platform:'ios',screen:'chat',property,label:'선택 말풍선 글자색',selected:true,platformDetail:true},message:`iOS ${who==='sent'?'보낸':'받은'} ${group?'연속':'첫'} 선택 말풍선의 생성 픽셀/글자 대비 ${ratio.toFixed(2)}:1 · 선택 상태 글자색을 확인하세요. (도구 권장 4.5:1)`});
 }return diagnostics;}
