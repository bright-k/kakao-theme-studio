import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
import {ROOT,newProject,atomic,sha} from '../src/core.mjs';
import {createStudio} from '../src/server.mjs';
const root=await fs.mkdtemp(path.join(ROOT,'.test-data/body-size-')),out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
const p=newProject('본체 크기 회귀','dusk');p.bubble={radius:18,paddingX:13,paddingY:7,stretchX:23,stretchY:22};
const marker=await sharp(Buffer.from('<svg width="32" height="32"><circle cx="16" cy="16" r="14" fill="#ED3154"/><circle cx="11" cy="13" r="2" fill="white"/><circle cx="21" cy="13" r="2" fill="white"/></svg>')).png().toBuffer(),ref='assets/'+sha(marker)+'.png';await atomic(path.join(root,ref),marker);for(const side of ['sent','received'])p.assets[side+'BubbleDecoration']=ref;p.bubbleDesign={sent:{body:'color',color:'#558264',radius:18,size:32},received:{body:'color',color:'#334455',radius:18,size:32}};await atomic(path.join(root,'projects',p.id+'.json'),JSON.stringify(p));
const studio=await createStudio({dataRoot:root});await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+studio.server.address().port;let browser;
const request=async(url,method='GET',body)=>{const r=await fetch(base+'/api/'+url,{method,headers:{Authorization:'Bearer '+studio.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert.ok(r.ok,await r.clone().text());return r.json();};
try{
 const initial=(await request('projects'))[0];browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1000,height:600}});await page.goto(base+'/style.css');const evidence=[];
 for(const body of ['color','image'])for(const padding of [[13,7],[4,4],[24,18]]){
  const images={};let config=structuredClone(initial);config.bubble.paddingX=padding[0];config.bubble.paddingY=padding[1];if(body==='image'){// Register a generated fixture via the normal asset endpoint.
   const bytes=await sharp({create:{width:64,height:56,channels:4,background:'#558264'}}).png().toBuffer();for(const side of ['sent','received']){const result=await request('assets','POST',{project:config,slot:side+'Bubble',base64:bytes.toString('base64')});config=result;}}
  for(const side of ['sent','received'])config.bubbleDesign[side].body=body;
  const variants=[];for(const enabled of [false,true]){const copy=structuredClone(config);for(const side of ['sent','received'])copy.bubbleDesign[side].decorationEnabled=enabled;variants.push({enabled,preview:await request('preview','POST',{project:copy})});}
  const rows=await page.evaluate(async({variants,token,body,padding})=>{
   const {renderPlatform}=await import('/preview-renderer.js');document.body.replaceChildren();document.body.style.cssText='margin:20px;background:#f5f5f5;font:14px sans-serif';const results=[];
   for(const variant of variants)for(const platform of ['ios','android']){const preview=variant.preview,images={};for(const [name,file] of Object.entries(preview[platform])){const r=await fetch('/api/preview-file?projectId='+preview.projectId+'&revision='+preview.revision+'&name='+encodeURIComponent(file),{headers:{Authorization:'Bearer '+token}});images[platform+'.'+name]=await createImageBitmap(await r.blob());}const canvas=document.createElement('canvas');canvas.width=390;canvas.height=780;const regions=renderPlatform(canvas,platform,preview,images,{screen:'chat',longMessage:false,selected:false});const bubbles=regions.filter(r=>r.bubble&&!r.decoration&&!r.group),ctx=canvas.getContext('2d');
    const dimensions=bubbles.slice(0,2).map(r=>{const g=preview.files[r.file].composition,top=Math.ceil(r.y),bottom=Math.min(706,Math.floor(r.y+r.height)),data=ctx.getImageData(0,0,390,780).data;let minY=780,maxY=-1;const color=r.bubble==='sent'||body==='image'?[85,130,100]:[51,68,85];for(let y=top;y<bottom;y++)for(let x=Math.max(0,Math.ceil(r.x));x<Math.min(390,Math.floor(r.x+r.width));x++){const i=(y*390+x)*4;if(data[i]===color[0]&&data[i+1]===color[1]&&data[i+2]===color[2]){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}return {side:r.bubble,width:r.width,height:r.height,paintedHeight:maxY-minY+1,sourceWidth:g.width,sourceBodyHeight:g.bodyHeight};});
    results.push({platform,enabled:variant.enabled,dimensions});if(body==='color'&&padding[0]===13){const row=document.createElement('div');row.style.cssText='display:inline-block;vertical-align:top;margin:5px';row.append(platform.toUpperCase()+' · 캐릭터 '+(variant.enabled?'켬':'끔'),document.createElement('br'));const crop=document.createElement('canvas');crop.width=390;crop.height=245;crop.getContext('2d').drawImage(canvas,0,230,390,245,0,0,390,245);row.append(crop);document.body.append(row);}
   }return results;
  },{variants,token:studio.token,body,padding});
  for(const platform of ['ios','android']){const off=rows.find(r=>r.platform===platform&&!r.enabled),on=rows.find(r=>r.platform===platform&&r.enabled);assert.equal(off.dimensions.length,2);assert.equal(on.dimensions.length,2);for(const a of off.dimensions){const b=on.dimensions.find(x=>x.side===a.side);assert.ok(Math.abs(a.height-b.height)<.01,JSON.stringify({body,padding,platform,a,b}));assert.ok(Math.abs(a.paintedHeight-b.paintedHeight)<=1,JSON.stringify({body,padding,platform,a,b}));assert.ok(b.width-a.width<=b.sourceWidth-a.sourceWidth+1);if(body==='color'&&padding[0]===13)assert.equal(b.height,47);}}
  evidence.push({body,padding,rows});if(body==='color'&&padding[0]===13)await page.screenshot({path:path.join(out,'bubble-body-on-off.png'),fullPage:true});
 }
 await fs.writeFile(path.join(out,'bubble-body-size-report.json'),JSON.stringify({passed:true,evidence,deviceVerified:false},null,2));console.log('PASS: identical visible body height with character off/on for both platforms and directions, color/image bodies and three padding profiles; the reported 13/7/r18 case is 47px in both states.');
}finally{if(browser)await browser.close();studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));}
