import {BACKGROUNDS,backgroundMode,setBackgroundMode} from './background-model.js';
import {COMMON_COLORS,commonColorState,linkCommonColor} from './common-colors.js';
import {colorWithHex} from './hex-color.js';
export function backgroundControl({project,slot,edit,styles,details,fileDetails,preview}){
 const spec=BACKGROUNDS[slot];if(!spec)return null;const policy=COMMON_COLORS.find(s=>s.id===spec.color),box=document.createElement('section');box.className='background-control';box.dataset.background=slot;
 const label=document.createElement('label');label.textContent='배경 방식';const mode=document.createElement('select');mode.setAttribute('aria-label',slot+' 배경 방식');for(const [v,l] of [['image','이미지 사용'],['color','색상만 사용'],['mixed','플랫폼별 설정 사용']])mode.add(new Option(l,v));mode.lastChild.disabled=true;mode.onchange=()=>{edit(p=>setBackgroundMode(p,slot,mode.value));sync();};label.append(mode);
 const row=document.createElement('label');row.textContent='단색 배경 HEX';const color=document.createElement('input');color.type='color';color.setAttribute('aria-label',slot+' 단색 배경');color.value=commonColorState(project,policy,styles()).value;color.oninput=()=>{edit(p=>{p.commonColors??={};p.commonColors[spec.color]=color.value;setBackgroundMode(p,slot,'color');},'background-color:'+slot);sync();};row.append(colorWithHex(color));
 const note=document.createElement('small'),applied=document.createElement('div');applied.className='background-applied';box.append(label,row,note,applied);
 function sync(){mode.value=backgroundMode(project,slot);const state=commonColorState(project,policy,styles());if(document.activeElement!==color)color.value=state.value;color.syncHex?.();note.textContent=(mode.value==='color'?'이미지 없이 배경색을 사용합니다. 등록 이미지는 보존됩니다.':mode.value==='mixed'?'iOS와 Android의 이미지 사용 여부가 다릅니다.':'등록 이미지가 없으면 현재 배경색의 PNG를 자동 생성합니다.')+(state.overridden.length?' 플랫폼 색상 예외 '+state.overridden.length+'개가 우선합니다. 공통 색상에서 연결을 확인하세요.':'');}
 const originalSync=sync;
 function syncApplied(){originalSync();applied.replaceChildren();for(const [index,platform] of ['ios','android'].entries()){
  const id=policy[platform][0],file=spec.resources[index],override=project.overrides?.[platform]?.[id],value=override??styles()?.[platform]?.[id]??color.value,resource=project.resourceOverrides?.[file],enabled=project.resourceOptions?.[file]?.enabled!==false;
  const status=document.createElement('small');status.textContent=(platform==='ios'?'iOS':'Android')+' 현재 적용: '+(enabled?(resource?'개별 이미지':project.assets[slot]?'공통 이미지':'자동 생성 배경'):'단색 '+value.toUpperCase());applied.append(status);
  const action=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;applied.append(b);};
  if(override!==undefined)action((platform==='ios'?'iOS':'Android')+' 색상 예외 보기',()=>details?.(platform,id));
  if(resource){action((platform==='ios'?'iOS':'Android')+' 이미지 예외 보기',()=>fileDetails?.(file));action((platform==='ios'?'iOS':'Android')+' 공통 이미지로 연결',()=>{edit(p=>{if(p.nativeNinePatch?.includes(file)&&!p.resourceGeometry?.[file]&&preview?.()?.files?.[file]?.patch){p.resourceGeometry??={};p.resourceGeometry[file]=structuredClone(preview().files[file].patch);}delete p.resourceOverrides?.[file];p.nativeNinePatch=(p.nativeNinePatch??[]).filter(f=>f!==file);});syncApplied();});}
 }
 if(commonColorState(project,policy,styles()).overridden.length){const reconnect=document.createElement('button');reconnect.type='button';reconnect.textContent='플랫폼 색상 예외를 공통 배경색으로 연결';reconnect.onclick=()=>{edit(p=>linkCommonColor(p,policy));syncApplied();};applied.append(reconnect);}}
 box.syncBackground=syncApplied;mode.addEventListener('change',syncApplied);color.addEventListener('input',syncApplied);syncApplied();return box;
}
