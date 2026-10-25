// Mirrors the generator's fallback rules. Provenance is attached to each physical output.
import {bubbleConfig,bubbleGeometry} from '../public/bubble-model.js';
import {resourceChain} from './source-rules.mjs';
import {logicalResource} from './catalog.mjs';
export function resourceSource(p,f){
 const id=logicalResource(f),name=f.fileName,chain=[];
 const disabled=p.resourceOptions?.[id]?.enabled===false;
 const override=p.resourceOverrides?.[f.path];
 const candidates=resourceChain(f);chain.push(...candidates);
 if(disabled)return {kind:'disabled',label:'이미지 사용 안 함 · 배경색 사용',chain:chain.map(s=>'assets.'+s),ref:null};
 if(override)return {kind:'override',label:'출력 파일별 재정의',ref:override,chain:['resourceOverrides.'+f.path,...chain.map(s=>'assets.'+s)],native:p.nativeNinePatch?.includes(f.path)??false};
 const bubble=/Bubble|bubble/.test(name),who=/Send|_me_/.test(name)?'sent':'received',cfg=bubbleConfig(p,who,/02/.test(name)),g=bubbleGeometry(p,who,/02/.test(name));
 if(bubble&&p.bubbleDesign?.[who]){const bodySlot=cfg.body==='color'?null:chain.find(s=>!s.endsWith('Decoration')&&p.assets?.[s]),decoration=cfg.decorationSlot;return {kind:g.decorated?'composite':bodySlot?'common':'generated',label:g.decorated?'말풍선 본체 + 캐릭터 합성':bodySlot?'공통 원본 사용':'색상으로 말풍선 생성',slot:bodySlot??null,ref:bodySlot?p.assets[bodySlot]:null,chain:[...chain.map(s=>'assets.'+s),'assets.'+decoration],components:{body:{kind:bodySlot?'common':'generated',slot:bodySlot??null,ref:bodySlot?p.assets[bodySlot]:null},decoration:g.decorated?{slot:decoration,ref:p.assets[decoration]}:null}};}
 const slot=chain.find(s=>!s.endsWith('Decoration')&&p.assets?.[s]);return {kind:slot?'common':'generated',label:slot?'공통 원본 사용':'기본 도형·색상으로 자동 생성',slot:slot??null,ref:slot?p.assets[slot]:null,chain:chain.map(s=>'assets.'+s),...(slot&&/Selected/.test(name)&&/Bubble/.test(name)&&!p.assets[chain[0]]?{transform:'선택 상태 밝기 보정'}:{})};
}
