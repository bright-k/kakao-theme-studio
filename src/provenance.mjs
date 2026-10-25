// Mirrors the generator's fallback rules. Provenance is attached to each physical output.
import {logicalResource} from './catalog.mjs';
export function resourceSource(p,f){
 const id=logicalResource(f),name=f.fileName,chain=[];
 const disabled=p.resourceOptions?.[id]?.enabled===false;
 const override=p.resourceOverrides?.[f.path];
 const add=slot=>{if(!chain.includes(slot))chain.push(slot);};
 if(/Bubble|bubble/.test(name)){
  const base=/Send|_me_/.test(name)?'sentBubble':'receivedBubble',group=/02/.test(name),selected=/Selected/.test(name);add(base+(group?'Group':'')+(selected?'Selected':''));if(group)add(base+'Group');add(base);
 }else if(/BgImage|background_image|splash_image|maintab_cell_image/.test(name)){
  add(/chatroom/.test(name)?'chatBackground':/passcode/.test(name)?'lockBackground':/splash/.test(name)?'splashBackground':/maintab/.test(name)?'tabBackground':'mainBackground');if(/splash|maintab/.test(name))add('mainBackground');
 }else if(/maintabIco|maintab_ico/.test(name)){
  const kind=f.platform==='ios'?name.replace('maintabIco','').replace(/Selected|@[23]x|\.png/g,'').toLowerCase():name.match(/maintab_ico_([a-z]+)/)[1];if(/Selected|focused/.test(name))add(kind+'IconSelected');add(kind+'Icon');
 }else if(/profile/i.test(name)||/commonIcoTheme|^icon\.png$/.test(name)){
  const n=Number(name.match(/0([123])/)?.[1]??1);if(/IcoTheme|^icon\.png$/.test(name))add('themeIcon');else if(/_full/.test(name))add('profileFull'+n);if(n>1)add('profile'+n);add('profile');
 }else if(/findBtn|find_add/.test(name)){const pressed=/pressed/.test(name);add('friendAddButton'+(pressed?'Pressed':''));if(pressed)add('friendsIconSelected');add('friendsIcon');
 }else if(/KeypadPressed/.test(name))add('keypadPressed');
 else {const n=Number(name.match(/(?:Code|passcode_)0([1-4])/)?.[1]);if(n)add('passcode'+n+(/Selected|checked/.test(name)?'Selected':''));}
 if(disabled)return {kind:'disabled',label:'이미지 사용 안 함 · 배경색 사용',chain:chain.map(s=>'assets.'+s),ref:null};
 if(override)return {kind:'override',label:'출력 파일별 재정의',ref:override,chain:['resourceOverrides.'+f.path,...chain.map(s=>'assets.'+s)],native:p.nativeNinePatch?.includes(f.path)??false};
 const slot=chain.find(s=>p.assets?.[s]);return {kind:slot?'common':'generated',label:slot?'공통 원본 사용':'기본 도형·색상으로 자동 생성',slot:slot??null,ref:slot?p.assets[slot]:null,chain:chain.map(s=>'assets.'+s),...(slot&&/Selected/.test(name)&&/Bubble/.test(name)&&!p.assets[chain[0]]?{transform:'선택 상태 밝기 보정'}:{})};
}
