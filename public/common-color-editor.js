import {COMMON_COLORS,commonColorState,linkCommonColor} from './common-colors.js';
export function renderCommonColors(host,{project,screen,styles,edit,details,toast}){
 host.replaceChildren();host.dataset.screen=screen;
 const specs=COMMON_COLORS.filter(s=>s.screens.includes(screen));host.hidden=!specs.length;
 const heading=document.createElement('h3');heading.textContent='공통 색상 · iOS와 Android';const note=document.createElement('p');note.className='muted';note.textContent='같은 역할의 색상을 함께 설정합니다. 기존 플랫폼별 예외는 유지됩니다. 공통 지정색은 불투명이며 투명도·세부 상태는 플랫폼별 설정에서 조절하세요.';host.append(heading,note);
 for(const spec of specs){
  const row=document.createElement('div');row.className='common-color-row';row.dataset.commonColor=spec.id;const label=document.createElement('label');label.textContent=spec.label;
  const controls=document.createElement('div');controls.className='common-color-controls';const color=document.createElement('input');color.type='color';color.setAttribute('aria-label','공통 '+spec.label+' 색상');const hex=document.createElement('input');hex.type='text';hex.maxLength=7;hex.setAttribute('aria-label','공통 '+spec.label+' HEX');
  const update=value=>{if(!/^#[\da-f]{6}$/i.test(value)){toast('#RRGGBB 색상을 입력하세요.');color.value=hex.value=commonColorState(project,spec,styles()).value;return;}edit(p=>{p.commonColors??={};p.commonColors[spec.id]=value;},'common-color:'+spec.id);color.value=value;hex.value=value;sync();};color.oninput=()=>update(color.value);hex.oninput=()=>{if(/^#[\da-f]{6}$/i.test(hex.value))update(hex.value);};hex.onchange=()=>update(hex.value);controls.append(color,hex);label.append(controls);
  const status=document.createElement('small');status.className='common-color-status';const actions=document.createElement('div');actions.className='common-color-actions';
  const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;actions.append(b);return b;};
  const reset=button('공통 자동값으로',()=>{edit(p=>{delete p.commonColors?.[spec.id];},'common-color-reset:'+spec.id);sync();});
  const reconnect=button('플랫폼 예외를 공통값으로 연결',()=>{edit(p=>linkCommonColor(p,spec),'common-color-link:'+spec.id);sync();});
  for(const platform of ['ios','android'])button(platform==='ios'?'iOS 세부 설정':'Android 세부 설정',()=>details(spec,platform));
  function sync(){const state=commonColorState(project,spec,styles());if(document.activeElement!==color)color.value=state.value;if(document.activeElement!==hex)hex.value=state.value;reset.disabled=!state.explicit;reconnect.hidden=!state.overridden.length;status.textContent=(state.explicit?'공통 지정값':'공통 자동값')+' · '+(state.overridden.length?`플랫폼별 예외 ${state.overridden.length}개 우선`:'양 플랫폼 연결')+(state.mixed?' · 현재 출력 차이 있음':'');}
  row.append(label,status,actions);if(spec.note){const help=document.createElement('p');help.className='muted';help.textContent=spec.note;row.append(help);}row.syncCommonColor=sync;host.append(row);sync();
 }
}
export function syncCommonColors(host){for(const row of host.querySelectorAll('[data-common-color]'))row.syncCommonColor?.();}
