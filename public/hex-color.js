// Keep Android's leading alpha byte when changing only the RGB swatch.
export const replaceRGB=(current,rgb)=>/^#[\da-f]{8}$/i.test(current)?current.slice(0,3)+rgb.slice(1):rgb;
export function hexToHSV(hex){const [r,g,b]=hex.slice(-6).match(/../g).map(n=>parseInt(n,16)/255),v=Math.max(r,g,b),d=v-Math.min(r,g,b);let h=!d?0:v===r?((g-b)/d+6)%6:v===g?(b-r)/d+2:(r-g)/d+4;return [h*60,v?d/v:0,v];}
export function hsvToHex(h,s,v){const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c,rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();}

// A reusable inline HEX field for places that previously exposed only a swatch.
export function colorWithHex(color){
 const box=document.createElement('span');box.className='hex-color-control';const hex=document.createElement('input');hex.type='text';hex.maxLength=7;hex.value=color.value.toUpperCase();hex.setAttribute('aria-label',color.getAttribute('aria-label')+' HEX');hex.spellcheck=false;
 const sync=()=>{hex.disabled=color.disabled;if(document.activeElement!==hex)hex.value=color.value.toUpperCase();};color.syncHex=sync;color.addEventListener('input',sync);
 hex.oninput=()=>{if(/^#[\da-f]{6}$/i.test(hex.value)){color.value=hex.value;color.dispatchEvent(new Event('input',{bubbles:true}));}};hex.onchange=()=>{hex.value=color.value.toUpperCase();};box.append(color,hex);return box;
}

// Native color dialogs choose RGB/HSL/HEX depending on browser preferences.
// Intercept their activation so every visible color editor uses the same HEX UI.
export function installHexPicker({getProject=()=>null}={}){
 let panel=null,source=null,recent=[];try{recent=JSON.parse(localStorage.getItem('studio-recent-colors')??'[]').filter(v=>/^#[\da-f]{6}$/i.test(v)).slice(0,12);}catch{}
 document.addEventListener('input',event=>{const value=event.target.value;if(!/^#(?:[\da-f]{6}|[\da-f]{8})$/i.test(value??''))return;const hex=('#'+value.slice(-6)).toUpperCase();recent=[hex,...recent.filter(v=>v!==hex)].slice(0,12);try{localStorage.setItem('studio-recent-colors',JSON.stringify(recent));}catch{}});
 const close=()=>{const previous=source;panel?.remove();panel=null;source=null;if(previous?.isConnected)previous.focus({preventScroll:true});};
 document.addEventListener('click',event=>{
  const color=event.target.closest?.('input[type=color]');if(!color||color.disabled)return;event.preventDefault();panel?.remove();source=color;
  panel=document.createElement('div');panel.className='hex-picker';panel.popover='auto';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','HEX 색상 선택');
  const title=document.createElement('strong');title.textContent='HEX 색상 선택';const caption=document.createElement('small');caption.textContent=color.getAttribute('aria-label')??'색상';const field=document.createElement('input');field.type='text';field.maxLength=7;field.spellcheck=false;field.setAttribute('aria-label','선택 색상 HEX');const sample=document.createElement('div');sample.className='hex-picker-sample';
  const sliders=[];let hsv=hexToHSV(color.value),last=color.value;
  const gradients=()=>{if(sliders.length!==3)return;sliders[0].style.background='linear-gradient(to right,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)';sliders[1].style.background=`linear-gradient(to right,${hsvToHex(hsv[0],0,hsv[2])},${hsvToHex(hsv[0],1,hsv[2])})`;sliders[2].style.background=`linear-gradient(to right,#000000,${hsvToHex(hsv[0],hsv[1],1)})`;};
  const paint=()=>{last=color.value;field.value=last.toUpperCase();sample.style.background=last;sliders.forEach((slider,i)=>slider.value=Math.round(hsv[i]*(i?100:1)));gradients();};
  const commit=hex=>{if(!source?.isConnected){close();return;}color.value=hex;color.dispatchEvent(new Event('input',{bubbles:true}));last=color.value;sample.style.background=last;gradients();};
  field.oninput=()=>{if(/^#[\da-f]{6}$/i.test(field.value)){hsv=hexToHSV(field.value);commit(field.value);sliders.forEach((slider,i)=>slider.value=Math.round(hsv[i]*(i?100:1)));}};field.onchange=()=>{field.value=last.toUpperCase();};panel.append(title,caption,sample,field);
  for(const [i,label,max] of [[0,'색조',359],[1,'채도',100],[2,'밝기',100]]){const row=document.createElement('label');row.textContent=label;const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=max;slider.step=1;slider.setAttribute('aria-label','색상 선택 '+label);slider.oninput=()=>{hsv[i]=Number(slider.value)/(i?100:1);commit(hsvToHex(...hsv));field.value=last.toUpperCase();};sliders.push(slider);row.append(slider);panel.append(row);}
  const project=getProject(),colors=new Set();const collect=value=>{if(typeof value==='string'&&/^#(?:[\da-f]{6}|[\da-f]{8})$/i.test(value))colors.add(('#'+value.slice(-6)).toUpperCase());else if(value&&typeof value==='object')Object.values(value).forEach(collect);};for(const values of [project?.palette,project?.commonColors,project?.bubbleDesign,project?.overrides])collect(values);
  for(const [label,values] of [['최근 사용 색상',recent],['프로젝트 색상',[...colors]]]){if(!values.length)continue;const swatches=document.createElement('div');swatches.className='color-swatches';const heading=document.createElement('strong');heading.textContent=label;swatches.append(heading);for(const hex of values.slice(0,30)){const swatch=document.createElement('button');swatch.type='button';swatch.style.background=hex;swatch.title=hex;swatch.setAttribute('aria-label',label+' '+hex);swatch.onclick=()=>{hsv=hexToHSV(hex);commit(hex);paint();};swatches.append(swatch);}panel.append(swatches);}
  const done=document.createElement('button');done.type='button';done.textContent='닫기';done.onclick=close;panel.append(done);(color.closest('dialog')??document.body).append(panel);paint();panel.showPopover();panel.addEventListener('toggle',e=>{if(e.newState==='closed'&&panel===e.target){panel.remove();panel=null;source=null;}});field.focus();field.select();
 },true);
 document.addEventListener('keydown',e=>{if(e.target.matches?.('input[type=color]')&&['Enter',' '].includes(e.key)){e.preventDefault();e.target.click();return;}if(panel&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
}
