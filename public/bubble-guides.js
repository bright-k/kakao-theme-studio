import {resizeGeometry} from './geometry-model.js';
import {MIN_BUBBLE_LINE_HEIGHT} from './bubble-model.js';
// Persisted guides may describe a legacy 64x56 body or an earlier composed
// canvas. Rebase on the body, never scale its header into the content area.
export function resolveComposedGuides(raw,g,scale){
 const width=g.width*scale,height=g.height*scale,b={x:g.bodyRect.x*scale,y:g.bodyRect.y*scale,width:g.bodyWidth*scale,height:g.bodyHeight*scale};
 const legacy=raw.width*56===raw.height*64;
 const frame=raw.bodyRect??(legacy?{x:0,y:0,width:raw.width,height:raw.height}:{x:b.x/width*raw.width,y:b.y/height*raw.height,width:b.width/width*raw.width,height:b.height/height*raw.height});
 const insets=[raw.insets[0]-frame.y,raw.insets[1]-frame.x,raw.insets[2]-(raw.height-frame.y-frame.height),raw.insets[3]-(raw.width-frame.x-frame.width)];
 const mapRuns=(runs,origin,from,to,offset)=>runs.map(([a,z])=>[Math.round((a-origin)/from*to+offset),Math.round((z-origin)/from*to+offset)]);
 const protect=(runs,lo,hi,fallback)=>{lo=Math.ceil(lo/scale)*scale;hi=Math.floor(hi/scale)*scale;if(hi<=lo)return [[fallback,fallback+scale]];const result=[];for(const [a,z] of runs){const start=Math.max(lo,Math.min(hi-scale,Math.round(a/scale)*scale)),end=Math.max(start+scale,Math.min(hi,Math.round(z/scale)*scale));const prev=result.at(-1);if(prev&&prev[1]>=start)prev[1]=Math.max(prev[1],end);else result.push([start,end]);}return result;};
 let minX=b.x+g.bodyCaps.left*scale,maxX=b.x+b.width-g.bodyCaps.right*scale;
 if(g.decoration){const d=g.decoration;if(d.x<g.stretch[0])minX=Math.max(minX,(d.x+d.width+1)*scale);else maxX=Math.min(maxX,(d.x-1)*scale);}
 const stretchX=protect(mapRuns(raw.stretchX,frame.x,frame.width,b.width,b.x),minX,maxX,g.stretch[0]*scale),stretchY=protect(mapRuns(raw.stretchY,frame.y,frame.height,b.height,b.y),Math.max(b.y+g.bodyCaps.top*scale,(g.decoration?.height??0)*scale+1),b.y+b.height-g.bodyCaps.bottom*scale,g.stretch[1]*scale);
 const i=insets.map((n,k)=>Math.max(0,Math.round(n/(k%2?frame.width:frame.height)*(k%2?b.width:b.height))));
 // At the minimum glyph size the drawable must still fit its fixed artwork.
 const pair=(a,z,size,minimum,minA=0)=>{i[a]=Math.max(minA,Math.min(size-1,i[a]));i[z]=Math.min(size-i[a]-1,i[z]);const extra=Math.max(0,minimum-i[a]-i[z]);i[a]+=Math.floor(extra/2);i[z]+=Math.ceil(extra/2);};
 pair(0,2,b.height,Math.max(0,b.height-(1+MIN_BUBBLE_LINE_HEIGHT)*scale),Math.max(0,(g.decoration?.height??0)*scale-b.y));pair(1,3,b.width,Math.max(0,b.width-2*scale));
 return {width,height,stretchX,stretchY,insets:[b.y+i[0],b.x+i[1],height-b.y-b.height+i[2],width-b.x-b.width+i[3]],bodyRect:b};
}
// Uncomposed resources, including explicit native NinePatch files, retain the
// existing per-file coordinate behavior.
export function resolveOutputGuides(raw,g,scale,width,height){return g?resolveComposedGuides(raw,g,scale):resizeGeometry(raw,width,height);}
