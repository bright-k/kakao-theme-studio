export function createBuildProgress({json,getProject,renderReport,toast}){
 const box=document.querySelector('#build-progress'),button=document.querySelector('#build'),title=box.querySelector('strong'),step=box.querySelector('[data-build-step]'),time=box.querySelector('[data-build-time]'),bar=box.querySelector('progress'),list=box.querySelector('ol'),close=box.querySelector('button');let active=null,busy=false,lastJob=null;
 const results=document.createElement('button');results.type='button';results.textContent='생성 결과 보기';results.hidden=true;results.onclick=()=>{box.hidden=true;document.querySelector('#build-results').scrollIntoView({block:'center',behavior:'smooth'});};box.append(results);close.onclick=()=>{box.hidden=true;};
 function paint(job){lastJob=job;results.hidden=!job.report||getProject()?.id!==job.projectId;const running=['queued','running'].includes(job.status);box.hidden=false;box.dataset.state=job.status;button.disabled=running;button.textContent=running?'생성 중…':'두 플랫폼 생성 ↗';title.textContent=(job.projectName??'테마')+' · '+(running?'테마 생성 중':job.status==='success'?'생성 완료':job.status==='partial'?'일부 생성 완료':'생성 실패');step.textContent=job.step;close.hidden=running;bar.hidden=!running;box.setAttribute('aria-busy',String(running));list.replaceChildren();for(const event of job.steps??[]){const li=document.createElement('li');li.textContent=event.step;list.append(li);}tick();}
 function tick(){if(!lastJob)return;const elapsed=Math.max(0,Math.floor(((lastJob.finishedAt?Date.parse(lastJob.finishedAt):Date.now())-Date.parse(lastJob.createdAt??new Date().toISOString()))/1000));time.textContent=(lastJob.status==='queued'?'순서 대기 · ':'경과 ')+Math.floor(elapsed/60)+'분 '+elapsed%60+'초'+(busy?' · 이 창을 유지해 주세요':'');}
 setInterval(()=>{if(busy)tick();},1000);
 async function watch(job){active=job.id;busy=true;sessionStorage.setItem('studio-build-job',job.id);paint(job);let failures=0;
  try{while(active===job.id&&['queued','running'].includes(job.status)){await new Promise(r=>setTimeout(r,650));try{job=await json('job?id='+job.id);failures=0;paint(job);}catch(error){failures++;step.textContent='진행 상태 연결 재시도 중 · 생성 작업은 서버에서 계속됩니다.';if(failures>=15)throw error;}}
   if(job.report){if(getProject()?.id===job.projectId)renderReport(job.report);else toast('다른 프로젝트의 테마 생성이 완료되었습니다. 해당 프로젝트에서 결과를 확인하세요.');}else if(job.status==='failed')toast(job.step);
   if(!['queued','running'].includes(job.status))sessionStorage.removeItem('studio-build-job');
  }catch(error){box.dataset.state='failed';title.textContent='생성 상태를 확인할 수 없습니다.';step.textContent=error.message+' · 서버 연결 후 생성 버튼을 누르면 진행 상태를 다시 확인합니다.';close.hidden=false;bar.hidden=true;box.setAttribute('aria-busy','false');}
  finally{busy=false;active=null;button.disabled=false;button.textContent='두 플랫폼 생성 ↗';tick();}
 }
 async function start(project){if(busy)return;const pending=sessionStorage.getItem('studio-build-job');if(pending){try{const job=await json('job?id='+pending);await watch(job);return;}catch{sessionStorage.removeItem('studio-build-job');}}
  busy=true;results.hidden=true;button.disabled=true;box.hidden=false;title.textContent='생성 작업을 등록하고 있습니다…';step.textContent=project.name;bar.hidden=false;close.hidden=true;
  try{await watch(await json('build','POST',{project:structuredClone(project)}));}catch(e){busy=false;button.disabled=false;bar.hidden=true;close.hidden=false;title.textContent='생성을 시작하지 못했습니다.';step.textContent=e.message;throw e;}
 }
 async function resume(){const id=sessionStorage.getItem('studio-build-job');if(!id||busy)return;try{await watch(await json('job?id='+id));}catch{sessionStorage.removeItem('studio-build-job');box.hidden=false;title.textContent='이전 생성 작업을 확인할 수 없습니다.';step.textContent='서버가 재시작되었을 수 있습니다. 최근 생성 결과를 확인하거나 다시 생성하세요.';close.hidden=false;bar.hidden=true;}}
 return {start,resume,get busy(){return busy;}};
}
