const clone=p=>structuredClone(p),serial=p=>JSON.stringify(p),prefix='studio-edit:';
export function createSaveController({getProject,json,onRecover,onStatus,focusField}){
 const button=document.querySelector('#save-project'),label=document.querySelector('#save-status'),message=document.querySelector('#save-message'),errors=document.querySelector('#save-errors'),recovery=document.querySelector('#draft-recovery');
 let client=sessionStorage.getItem('studio-edit-client');if(!client){client=crypto.randomUUID();sessionStorage.setItem('studio-edit-client',client);}
 let sequence=Date.now()*1000,timer,queue=Promise.resolve(),base='',owner=null,blocked=false,state='loading',remotePending=Promise.resolve();const recovered=[];
 const key=id=>prefix+id+':'+client;
 function status(next,text){document.querySelector('.workspace').inert=blocked;document.querySelector('#theme-name').readOnly=blocked;state=next;button.dataset.state=next;button.disabled=!getProject()||next==='saving';label.textContent=text;button.title=text+' · 클릭하여 저장 · ⌘/Ctrl+S';button.setAttribute('aria-label',text+' · 지금 저장');onStatus?.(next);}
 function send(data){remotePending=json('draft','POST',data,{keepalive:JSON.stringify(data).length<60000}).catch(()=>null);return remotePending;}
 function write(){const p=getProject();if(!p||blocked)return;const draft={projectId:p.id,clientId:client,sequence:++sequence,project:clone(p),base,updatedAt:new Date().toISOString()};try{localStorage.setItem(key(p.id),JSON.stringify(draft));}catch{message.textContent='브라우저 임시 저장 공간이 부족합니다. 서버에 저장하거나 프로젝트를 백업하세요.';message.hidden=false;}send(draft);}
 function clear(id){try{localStorage.removeItem(key(id));}catch{}send({projectId:id,clientId:client,sequence:++sequence,clear:true});for(const entry of recovered.splice(0)){send({projectId:id,clientId:entry.clientId,requesterClientId:client,sequence:++sequence,clear:true}).then(result=>{if(result?.stored)try{localStorage.removeItem(entry.key);}catch{}});}}
 function showErrors(diagnostics=[]){errors.replaceChildren();for(const el of document.querySelectorAll('[data-save-invalid]')){el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby');delete el.dataset.saveInvalid;}for(const el of document.querySelectorAll('.field-error'))el.remove();
  for(const [i,d] of diagnostics.filter(d=>d.severity==='error').entries()){const target=field(d.field),id='save-field-error-'+i,button=document.createElement('button');button.type='button';button.textContent=d.message+' →';button.onclick=()=>focusField(d.field,target);errors.append(button);if(target){target.setAttribute('aria-invalid','true');target.dataset.saveInvalid='true';const note=document.createElement('small');note.className='field-error';note.id=id;note.textContent=d.message;target.setAttribute('aria-describedby',id);target.after(note);}}
  errors.hidden=!errors.childElementCount;
 }
 function field(name){const ids={name:'theme-name',author:'author',version:'version',url:'theme-url',mode:'mode',signingKeyId:'signing-key'};return ids[name]?document.getElementById(ids[name]):document.querySelector('[data-field="'+CSS.escape(name??'')+'"]');}
 async function save({manual=false}={}){clearTimeout(timer);const p=getProject();if(!p)return;if(blocked){recovery.scrollIntoView({block:'center'});throw new Error('복구할 편집과 현재 저장본 중 사용할 내용을 선택하세요.');}const snapshot=clone(p),text=serial(snapshot);if(owner===p.id&&text===base){status('saved','자동 저장됨');if(manual){message.textContent='현재 편집 내용이 저장되어 있습니다.';message.hidden=false;}return;}
  write();status('saving','저장 중…');const task=queue.catch(()=>{}).then(()=>json('project','PUT',{project:snapshot}));queue=task;
  try{await task;if(getProject()?.id!==snapshot.id)return;base=text;showErrors();message.hidden=true;const option=[...document.querySelector('#projects').options].find(o=>o.value===snapshot.id);if(option)option.textContent=snapshot.name;
   if(serial(getProject())===text){clear(snapshot.id);status('saved','자동 저장됨');recovery.hidden=true;}else{write();status('dirty','변경됨 · 저장 대기');}
  }catch(e){if(getProject()?.id===snapshot.id){const invalid=e.diagnostics?.some(d=>d.severity==='error');showErrors(e.diagnostics);status(invalid?'invalid':'error',invalid?'저장 실패 · 입력 확인':'저장 실패 · 다시 시도');message.textContent=invalid?'표시한 입력값을 수정하면 자동으로 다시 저장합니다.':e.status===403?'실행 링크로 다시 인증하세요. 편집은 임시 보관 중입니다.':e.status?'저장하지 못했습니다: '+e.message+' 편집은 임시 보관 중입니다.':navigator.onLine?'서버에 연결하지 못했습니다. 편집은 임시 보관 중입니다. 상단 저장 버튼으로 다시 시도하세요.':'오프라인입니다. 편집은 임시 보관 중이며 연결되면 다시 저장합니다.';message.hidden=false;if(manual&&invalid)errors.querySelector('button')?.click();}throw e;}
 }
 function changed(){if(blocked)return;if(state==='saved')message.hidden=true;write();status('dirty','변경됨 · 저장 대기');clearTimeout(timer);timer=setTimeout(()=>save().catch(()=>{}),350);}
 function prepare(project){clearTimeout(timer);owner=project.id;base=serial(project);blocked=false;recovered.length=0;showErrors();message.hidden=true;recovery.hidden=true;status('loading','불러오는 중…');}
 async function open(project){if(owner!==project.id)prepare(project);if(serial(getProject())!==base)return;status('loading','복구할 편집 확인 중…');
  const drafts=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(prefix+project.id+':')){try{drafts.push({...JSON.parse(localStorage.getItem(k)),key:k});}catch{}}}}catch{}
  try{for(const [clientId,d] of Object.entries(await json('drafts?id='+project.id))){const local=drafts.find(x=>x.clientId===clientId);if(local)local.active=d.active;else if(d.project)drafts.push({...d,clientId,projectId:project.id});}}catch{}
  if(getProject()?.id!==project.id||owner!==project.id||serial(getProject())!==base)return;const draft=drafts.filter(d=>!(d.active&&d.clientId!==client)&&d.project?.id===project.id&&d.project.packageId===project.packageId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];if(!draft){status('saved','자동 저장됨');return;}
  sequence=Math.max(sequence,draft.sequence+1);if(serial(draft.project)===base){recovered.push(draft);clear(project.id);status('saved','자동 저장됨');return;}
  const apply=()=>{blocked=false;recovered.push(draft);const next=clone(draft.project);next.signingKeyId=getProject().signingKeyId;onRecover(next);recovery.textContent='저장 전 편집을 복구했습니다.';recovery.hidden=false;changed();};
  if(draft.base===base&&draft.clientId===client){apply();return;}
  blocked=true;status('conflict','복구할 편집 있음');recovery.replaceChildren(document.createTextNode('저장본과 다른 임시 편집이 있습니다. 다른 탭에서 저장했을 수 있습니다. '));recovery.hidden=false;
  for(const [text,action] of [['임시 편집 복구',apply],['현재 저장본 사용',()=>{recovered.push(draft);blocked=false;clear(project.id);recovery.hidden=true;status('saved','자동 저장됨');}]]){const b=document.createElement('button');b.textContent=text;b.onclick=action;recovery.append(b);}
 }
 window.addEventListener('online',()=>{if(getProject()&&!blocked&&serial(getProject())!==base)save().catch(()=>{});});
 window.addEventListener('pagehide',()=>{clearTimeout(timer);if(getProject()&&!blocked&&serial(getProject())!==base)write();});
 button.onclick=()=>save({manual:true}).catch(()=>{});
 window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save({manual:true}).catch(()=>{});}});
 return {clientId:client,changed,save,open,prepare,get blocked(){return blocked;},get state(){return state;},get dirty(){return !!getProject()&&serial(getProject())!==base;}};
}
