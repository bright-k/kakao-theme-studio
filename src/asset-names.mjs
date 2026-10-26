import {RESOURCE_FILES,RESOURCES} from './catalog.mjs';
import {resourceChain} from './source-rules.mjs';
export const legacyAssetRef=ref=>typeof ref==='string'&&/^assets\/[a-f0-9]{64}\.png$/.test(ref);
export const namedAssetRef=ref=>typeof ref==='string'&&/^assets\/(?:common|ios|android)\/(?:[a-z0-9][a-z0-9_-]*\/)*[a-z][a-z0-9_-]*-v[0-9]{4,9}(?:\.9)?\.png$/.test(ref);
export const validAssetRef=ref=>legacyAssetRef(ref)||namedAssetRef(ref);
export function commonRole(slot){
 const backgrounds={mainBackground:'main',chatBackground:'chat',lockBackground:'lock',tabBackground:'tab',splashBackground:'splash'};if(backgrounds[slot])return 'backgrounds/'+backgrounds[slot];if(slot==='themeIcon')return 'identity/theme-icon';
 const bubble=slot.match(/^(sent|received)Bubble(Group)?(Selected)?(Decoration)?$/);if(bubble)return `chat/${bubble[1]}/${bubble[2]?'continuous':'first'}/${bubble[3]?'selected/':''}${bubble[4]?'character':'body'}`;
 const icon=slot.match(/^(friends|chats|now|shopping|more|local|call|piccoma)Icon(Selected)?$/);if(icon)return `tabs/${icon[1]}-${icon[2]?'selected':'normal'}`;
 if(slot==='profile')return 'profiles/default-1';if(/^profile[23]$/.test(slot))return 'profiles/default-'+slot.slice(-1);if(/^profileFull[123]$/.test(slot))return 'profiles/full-'+slot.slice(-1);
 const passcode=slot.match(/^passcode([1-4])(Selected)?$/);if(passcode)return `passcode/${passcode[1]}/${passcode[2]?'entered':'empty'}`;if(slot==='keypadPressed')return 'passcode/keypad/pressed';if(slot==='friendAddButton'||slot==='friendAddButtonPressed')return 'components/friend-add/'+(slot.endsWith('Pressed')?'pressed':'normal');throw new Error('등록되지 않은 공통 원본입니다.');
}
export function commonTarget(slot){return {base:'assets/common/'+commonRole(slot),kind:'common',slot};}
export function outputTarget(file,{resourceId}={}){
 const f=RESOURCE_FILES.get(file);if(!f)throw new Error('등록되지 않은 출력 리소스입니다.');const slot=resourceChain(f).find(x=>!x.endsWith('Decoration'));if(!slot)throw new Error('원본 역할을 찾을 수 없습니다.');const role=commonRole(slot),parts=role.split('/'),name=parts.pop();
 let qualifier='';if(resourceId){const r=RESOURCES.find(r=>r.id===resourceId);if(!r?.variants.some(v=>v.path===file))throw new Error('리소스 그룹과 출력이 일치하지 않습니다.');}else qualifier=f.platform==='ios'?(f.fileName.match(/@([23])x/)?.[1]??'1')+'x':f.path.split('/')[2];
 return {base:['assets',f.platform,...parts,...(qualifier?[qualifier]:[]),name].join('/'),kind:resourceId?'resource':'file',...(resourceId?{resourceId}:{file})};
}
export function platformBubbleTarget(platform,who,group,kind){
 if(!['ios','android'].includes(platform)||!['sent','received'].includes(who)||typeof group!=='boolean'||!['body','character'].includes(kind))throw new Error('플랫폼 말풍선 원본 대상을 확인하세요.');
 const slot=who+'Bubble'+(group?'Group':'')+(kind==='character'?'Decoration':'');return {base:'assets/'+platform+'/'+commonRole(slot)+'-source',kind:'platform-bubble-'+kind,platform,who,group};
}
