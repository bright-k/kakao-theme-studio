import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
import {ROOT,newProject,compile,atomic,sha} from '../src/core.mjs';
import {readNinePatch} from '../src/resources.mjs';
import {bubbleGeometry} from '../public/bubble-model.js';

// Size from text + exported padding, with no preview-only minimum PNG size.
// Scan rendered character pixels rather than trusting composition metadata.
const root=await fs.mkdtemp(path.join(ROOT,'.test-data/bubble-fixed-'));
const out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
let browser;
try{
 const p=newProject(),bytes=await sharp({create:{width:32,height:16,channels:4,background:'#EC1234'}}).png().toBuffer(),ref='assets/'+sha(bytes)+'.png';await atomic(path.join(root,ref),bytes);
 for(const side of ['sent','received'])for(const suffix of ['Bubble','BubbleDecoration','BubbleGroupDecoration'])p.assets[side+suffix]=ref;
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1000,height:900}});
 const componentUrl='data:text/javascript;base64,'+(await fs.readFile(path.join(ROOT,'public/component-preview.js'))).toString('base64');const source=(await fs.readFile(path.join(ROOT,'public/preview-renderer.js'),'utf8')).replace("'./component-preview.js'",JSON.stringify(componentUrl));const moduleUrl='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
 const evidence=[];
 for(const size of [12,72])for(const anchor of ['left','right']){
  p.bubbleDesign=Object.fromEntries(['sent','received'].map(side=>[side,{size,anchor,body:anchor==='left'?'color':'image',color:'#228844',group:{decorationMode:'separate',size:24,anchor:anchor==='left'?'right':'left',body:'color'}}]));
  // Keep the image body distinct from the character for pixel scans.
  const body=await sharp({create:{width:64,height:56,channels:4,background:'#1255AA'}}).png().toBuffer(),bodyRef='assets/'+sha(body)+'.png';await atomic(path.join(root,bodyRef),body);p.assets.sentBubble=bodyRef;p.assets.receivedBubble=bodyRef;
  const c=await compile(p,root),cases=[];
  for(const side of ['sent','received'])for(const group of [false,true])for(const scale of [2,3]){
   const g=bubbleGeometry(p,side,group),prefix='MessageCellStyle-'+(side==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':'');
   const file=scale===2?`ios/Images/chatroomBubble${side==='sent'?'Send':'Receive'}0${group?2:1}@2x.png`:`android/res/drawable-xxhdpi/theme_chatroom_bubble_${side==='sent'?'me':'you'}_0${group?2:1}_image.9.png`;
   const patch=scale===3?readNinePatch(c.files[file]):null,insets=patch?patch.insets.map(n=>n/scale):c.styles.ios[prefix+'title-edgeinsets'];
   assert.deepEqual(insets,g.insets);assert.ok(insets[1]+insets[3]+1>=g.width-1);assert.ok(insets[0]+insets[2]+16>=g.height-1);
   cases.push({side,group,scale,g,patch,insets,stretch:c.styles.ios[prefix+'background-image'],url:'data:image/png;base64,'+c.files[file].toString('base64')});
  }
  const result=await page.evaluate(async({moduleUrl,cases})=>{
   const {drawNine,nineRect}=await import(moduleUrl);document.body.replaceChildren();document.body.style.cssText='margin:16px;background:#f5f5f5;font:14px sans-serif';const results=[];
   for(const c of cases){
    const bitmap=await createImageBitmap(await(await fetch(c.url)).blob()),[top,left,bottom,right]=c.insets,dimensions=[];
    for(const content of [{label:'한 글자',width:12,height:23},{label:'긴 문장',width:160,height:69},{label:'최소 글자',width:1,height:16}]){
     const width=left+right+content.width,height=top+bottom+content.height,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');drawNine(ctx,bitmap,0,0,width,height,{scale:c.scale,patch:c.patch,stretch:c.stretch});const pixels=ctx.getImageData(0,0,width,height).data;let minX=width,minY=height,maxX=-1,maxY=-1;
     for(let y=0;y<c.g.header;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(pixels[i]===236&&pixels[i+1]===18&&pixels[i+2]===52&&pixels[i+3]>200){minX=Math.min(x,minX);minY=Math.min(y,minY);maxX=Math.max(x,maxX);maxY=Math.max(y,maxY);}}
     const d=c.g.decoration,projected=nineRect(bitmap,{x:d.x,y:d.y+d.height/4,width:d.width,height:d.height/2},width,height,{scale:c.scale,patch:c.patch,stretch:c.stretch});if(Math.abs(projected.x-minX)>.01||Math.abs(projected.y-minY)>.01||Math.abs(projected.width-(maxX-minX+1))>.01||Math.abs(projected.height-(maxY-minY+1))>.01)throw new Error('Character hit bounds differ from rendered pixels: '+JSON.stringify({projected,minX,minY,maxX,maxY}));dimensions.push({width:maxX-minX+1,height:maxY-minY+1});
     if(c.side==='sent'&&!c.group){const row=document.createElement('div');row.style.cssText='display:inline-block;vertical-align:top;margin:8px';row.append(`${c.scale===2?'iOS':'Android'} · ${content.label}`,document.createElement('br'),canvas);document.body.append(row);}
    }
    results.push({side:c.side,group:c.group,scale:c.scale,size:c.g.decoration.width,dimensions});
   }return results;
  },{moduleUrl,cases});
  for(const r of result)for(const dimensions of r.dimensions)assert.deepEqual(dimensions,{width:r.size,height:r.size/2},JSON.stringify(r));
  evidence.push({size,anchor,cases:result});
  if(size===72&&anchor==='right')await page.screenshot({path:path.join(out,'bubble-fixed-size.png'),fullPage:true});
 }
 await fs.writeFile(path.join(out,'bubble-fixed-size-report.json'),JSON.stringify({passed:true,evidence,deviceVerified:false},null,2));
 console.log('PASS: 32 exported iOS/Android, first/continuous, left/right and 12/72 size cases retain identical character pixels for one-character and long messages.');
}finally{if(browser)await browser.close();await fs.rm(root,{recursive:true,force:true});}
