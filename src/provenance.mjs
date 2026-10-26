// Mirrors the generator's fallback rules. Provenance is attached to each physical output.
import {bubbleConfig,bubbleGeometry,platformBubbleProject,platformBubbleAssets,platformBubbleState} from '../public/bubble-model.js';
import {resourceChain} from './source-rules.mjs';
import {logicalResource} from './catalog.mjs';
export function resourceSource(p,f){
 const id=logicalResource(f),name=f.fileName,chain=[];
 const disabled=p.resourceOptions?.[id]?.enabled===false;
 const override=p.resourceOverrides?.[f.path];
 const candidates=resourceChain(f);chain.push(...candidates);
 if(disabled)return {kind:'disabled',label:'이미지 사용 안 함 · 배경색 사용',chain:chain.map(s=>'assets.'+s),ref:null};
 if(override)return {kind:'override',label:'출력 파일별 재정의',ref:override,chain:['resourceOverrides.'+f.path,...chain.map(s=>'assets.'+s)],native:p.nativeNinePatch?.includes(f.path)??false};
 const bubble=/Bubble|bubble/.test(name),who=/Send|_me_/.test(name)?'sent':'received',view=platformBubbleProject(p,f.platform,who,/02/.test(name)),cfg=bubbleConfig(view,who,/02/.test(name)),g=bubbleGeometry(view,who,/02/.test(name));
 if(bubble&&view.bubbleDesign?.[who]){const bodySlot=cfg.body==='color'?null:chain.find(s=>!s.endsWith('Decoration')&&view.assets?.[s]),decoration=cfg.decorationSlot,entries=platformBubbleAssets(p).filter(e=>e.platform===f.platform&&e.who===who),platformBody=entries.find(e=>e.kind==='body'&&bodySlot===who+'Bubble'+(e.group?'Group':'')&&e.ref===view.assets[bodySlot]),platformCharacter=entries.find(e=>e.kind==='character'&&decoration===who+'Bubble'+(e.group?'Group':'')+'Decoration'&&e.ref===view.assets[decoration]),bodyRef=bodySlot?view.assets[bodySlot]:null;
  return {kind:g.decorated?'composite':platformBody?'platform-body':bodySlot?'common':'generated',label:g.decorated?(platformBody||platformCharacter?(platformBody?f.platform+' 개별 본체':'공통 본체')+' + '+(platformCharacter?f.platform+' 개별 캐릭터':'공통 캐릭터'):'말풍선 본체 + 캐릭터 합성'):platformBody?f.platform+' 개별 본체':bodySlot?'공통 원본 사용':'색상으로 말풍선 생성',slot:platformBody?null:bodySlot,ref:bodyRef,chain:[...chain.map(s=>'assets.'+s),'assets.'+decoration,...entries.map(e=>'bubblePlatforms.'+e.platform+'.'+e.who+(e.group?'.group':'')+(e.kind==='body'?'.body':'.character.image'))],components:{body:{kind:platformBody?'platform':bodySlot?'common':'generated',slot:bodySlot,ref:bodyRef,...(platformBody?{platform:f.platform}:{})},decoration:g.decorated?{slot:decoration,ref:view.assets[decoration],...(platformCharacter?{platform:f.platform}:{}),...((platformBubbleState(p,f.platform,who,/02/.test(name))?.character||/02/.test(name)&&platformBubbleState(p,f.platform,who,false)?.character)?{settingsPlatform:f.platform}:{})}:null}};
 }

 const slot=chain.find(s=>!s.endsWith('Decoration')&&p.assets?.[s]);return {kind:slot?'common':'generated',label:slot?'공통 원본 사용':'기본 도형·색상으로 자동 생성',slot:slot??null,ref:slot?p.assets[slot]:null,chain:chain.map(s=>'assets.'+s),...(slot&&/Selected/.test(name)&&/Bubble/.test(name)&&!p.assets[chain[0]]?{transform:'선택 상태 밝기 보정'}:{})};
}
