import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewQueue,createPreviewSchedule} from '../public/preview-queue.js';
const turn=()=>new Promise(r=>setImmediate(r));
test('continuous preview shows completed frames, coalesces waiting edits and settles on the latest value',async()=>{
 let value=1,active=0,maxActive=0;const pending=[],generated=[],applied=[];const queue=createPreviewQueue({capture:()=>({value}),generate:s=>{generated.push(s.value);maxActive=Math.max(maxActive,++active);return new Promise(resolve=>pending.push(()=>{active--;resolve(s.value);}));},apply:v=>applied.push(v)});
 const first=queue.request();value=2;queue.request();value=3;const last=queue.request();assert.equal(first,last);pending.shift()();await turn();assert.deepEqual(applied,[1]);assert.deepEqual(generated,[1,3]);assert.equal(queue.busy,true);pending.shift()();await last;assert.deepEqual(applied,[1,3]);assert.equal(maxActive,1);assert.equal(queue.busy,false);
});
test('failed generations recover on the newest waiting edit and later requests remain usable',async()=>{
 let value=1,reject;const applied=[];const queue=createPreviewQueue({capture:()=>({value}),generate:s=>s.value===1?new Promise((_,r)=>reject=r):Promise.resolve(s.value),apply:v=>applied.push(v)});const p=queue.request();value=2;queue.request();reject(new Error('old invalid frame'));await p;assert.deepEqual(applied,[2]);value=3;await queue.request();assert.deepEqual(applied,[2,3]);
});

test('short debounce groups nearby edits, enforces a continuous-input deadline and cancels stale timers',()=>{
 let clock=0,id=0,value=1;const timers=new Map(),frames=[];
 const tick=ms=>{const end=clock+ms;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;clock=next[1].at;timers.delete(next[0]);next[1].fn();}clock=end;};
 const schedule=createPreviewSchedule(()=>frames.push({at:clock,value}),{now:()=>clock,setTimer:(fn,ms)=>{timers.set(++id,{fn,at:clock+ms});return id;},clearTimer:id=>timers.delete(id)});
 schedule.schedule();tick(50);value=2;schedule.schedule();tick(50);value=3;schedule.schedule();tick(59);assert.deepEqual(frames,[]);tick(1);assert.deepEqual(frames,[{at:160,value:3}]);value=4;schedule.schedule();tick(80);assert.deepEqual(frames.at(-1),{at:240,value:4});schedule.schedule();schedule.cancel();tick(200);assert.equal(frames.length,2);
});
