// One generation at a time. Keep only the newest waiting snapshot, and display
// completed frames during a continuous gesture instead of waiting for idle.
export function createPreviewQueue({capture,generate,apply}){
 let pending=null,running=false,idle=null,resolveIdle,rejectIdle;
 async function drain(){
  if(running)return;running=true;let error;
  while(pending){const snapshot=pending;pending=null;try{const frame=await generate(snapshot);await apply(frame,snapshot);error=null;}catch(e){error=e;}}
  running=false;const resolve=resolveIdle,reject=rejectIdle;idle=null;resolveIdle=rejectIdle=null;if(error)reject(error);else resolve();
 }
 return {request(){const snapshot=capture();pending=snapshot;if(!idle)idle=new Promise((resolve,reject)=>{resolveIdle=resolve;rejectIdle=reject;});const result=idle;void drain();return result;},get busy(){return running;}};
}

// A short trailing debounce with a deadline also refreshes during long gestures.
export function createPreviewSchedule(run,{delay=80,maxWait=160,now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
 let timer=null,started=null;
 const cancel=()=>{if(timer!==null)clearTimer(timer);timer=started=null;};
 const flush=()=>{cancel();return run();};
 return {schedule(){if(started===null)started=now();if(timer!==null)clearTimer(timer);timer=setTimer(flush,Math.min(delay,Math.max(0,maxWait-(now()-started))));},cancel,flush};
}
