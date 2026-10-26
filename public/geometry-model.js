export function iosGeometryBinding(name){
 if(!/chatroomBubble(?:Send|Receive)0[12](?:Selected)?\.png$/.test(name))return null;
 const prefix='MessageCellStyle-'+(name.includes('Send')?'Send':'Receive'),group=name.includes('02'),selected=name.includes('Selected');
 return {stretch:prefix+'/-ios-'+(group?'group-':'')+(selected?'selected-':'')+'background-image',insets:prefix+'/-ios-'+(group?'group-':'')+'title-edgeinsets'};
}
export function validGeometry(g){
 if(!g||!Number.isInteger(g.width)||!Number.isInteger(g.height)||g.width<1||g.height<1||g.width>4096||g.height>4096)return false;
 if(g.bodyRect!==undefined){const b=g.bodyRect;if(!b||Object.keys(b).some(k=>!['x','y','width','height'].includes(k))||![b.x,b.y,b.width,b.height].every(Number.isInteger)||b.x<0||b.y<0||b.width<1||b.height<1||b.x+b.width>g.width||b.y+b.height>g.height)return false;}
 for(const [axis,size] of [['stretchX',g.width],['stretchY',g.height]]){const runs=g[axis];if(!Array.isArray(runs)||!runs.length||runs.length>size)return false;let end=0;for(const r of runs){if(!Array.isArray(r)||r.length!==2||!r.every(Number.isInteger)||r[0]<end||r[0]<0||r[1]>size||r[0]>=r[1])return false;end=r[1];}}
 return Array.isArray(g.insets)&&g.insets.length===4&&g.insets.every(n=>Number.isInteger(n)&&n>=0)&&g.insets[0]+g.insets[2]<g.height&&g.insets[1]+g.insets[3]<g.width;
}
export function resizeGeometry(g,width,height){
 const runs=(list,old,size)=>{const result=[];for(const [a,b] of list){const start=Math.max(0,Math.min(size-1,Math.round(a/old*size))),end=Math.max(start+1,Math.min(size,Math.round(b/old*size)));const last=result.at(-1);if(last&&last[1]>=start)last[1]=Math.max(last[1],end);else result.push([start,end]);}return result;};
 const i=g.insets.map((n,k)=>Math.round(n/(k%2?g.width:g.height)*(k%2?width:height)));i[0]=Math.min(i[0],height-1);i[2]=Math.min(i[2],height-i[0]-1);i[1]=Math.min(i[1],width-1);i[3]=Math.min(i[3],width-i[1]-1);
 return {width,height,stretchX:runs(g.stretchX,g.width,width),stretchY:runs(g.stretchY,g.height,height),insets:i};
}
export function moveGuide(g,target,value){
 const next=structuredClone(g);if(target.axis==='insets'){const k=target.index,limit=k%2?g.width:g.height;next.insets[k]=Math.max(0,Math.min(limit-1-g.insets[(k+2)%4],Math.round(value)));}
 else{const {axis,index,edge}=target,r=next[axis][index],size=axis==='stretchX'?g.width:g.height;const lower=edge===0?(next[axis][index-1]?.[1]??0):r[0]+1,upper=edge===0?r[1]-1:(next[axis][index+1]?.[0]??size);r[edge]=Math.max(lower,Math.min(upper,Math.round(value)));}return next;
}
