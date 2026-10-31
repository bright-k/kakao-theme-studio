import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
import {ROOT,newProject,atomic,sha} from '../src/core.mjs';
import {createStudio} from '../src/server.mjs';
const root=await fs.mkdtemp(path.join(ROOT,'.test-data/conversation-')),out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
const p=newProject('딱 하나만 더 바꾸고','dusk');
const marker=await sharp(Buffer.from('<svg width="32" height="32"><path d="m16 1 4 10 11 1-8 8 2 11-9-6-9 6 2-11-8-8 11-1Z" fill="#ED3154"/></svg>')).png().toBuffer(),ref='assets/'+sha(marker)+'.png';await atomic(path.join(root,ref),marker);
for(const who of ['sent','received']){p.assets[who+'BubbleDecoration']=ref;p.bubbleDesign??={};p.bubbleDesign[who]={body:'color',tail:false,size:32,color:who==='sent'?'#D9E7FF':'#FFF7EB',textColor:'#263D52',group:{decorationMode:'none'}};const body=await sharp({create:{width:64,height:56,channels:4,background:who==='sent'?'#D9E7FF':'#FFF7EB'}}).png().toBuffer(),bodyRef='assets/'+sha(body)+'.png';await atomic(path.join(root,bodyRef),body);p.assets[who+'Bubble']=bodyRef;}
await atomic(path.join(root,'projects',p.id+'.json'),JSON.stringify(p));const studio=await createStudio({dataRoot:root});await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+studio.server.address().port;
const json=async(url,body)=>{const r=await fetch(base+'/api/'+url,{headers:{Authorization:'Bearer '+studio.token,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});assert.ok(r.ok,await r.clone().text());return r.json();};let browser;
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1520,height:1100}}),errors=[],evidence=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/#'+studio.token);await page.getByText('예상 화면 · 실제 카카오톡의 글꼴·배치와 차이가 있을 수 있습니다.').waitFor();const initial=(await json('projects'))[0];
 const options=await page.locator('#preview-target option').allTextContents();for(const platform of ['IOS','ANDROID'])for(const side of ['보낸','받은'])for(const flow of ['첫 번째','연속'])assert.ok(options.some(s=>s===`${platform} · ${side} 말풍선 · ${flow}`));
 for(const body of ['color','image'])for(const size of [32,72]){const copy=structuredClone(initial);for(const who of ['sent','received'])Object.assign(copy.bubbleDesign[who],{body,size});const preview=await json('preview',{project:copy});
  const rows=await page.evaluate(async({preview,token})=>{
   const {renderPlatform}=await import('/preview-renderer.js'),images={},rows=[];for(const platform of ['ios','android'])for(const [name,file] of Object.entries(preview[platform])){const r=await fetch('/api/preview-file?projectId='+preview.projectId+'&revision='+preview.revision+'&name='+encodeURIComponent(file),{headers:{Authorization:'Bearer '+token}});images[platform+'.'+name]=await createImageBitmap(await r.blob());}
   for(const platform of ['ios','android'])for(const longMessage of [false,true])for(const selected of [false,true]){
    const canvas=document.createElement('canvas');canvas.width=390;canvas.height=780;const ctx=canvas.getContext('2d'),texts=[],draws=[],fill=ctx.fillText.bind(ctx),draw=ctx.drawImage.bind(ctx);ctx.fillText=(...args)=>{texts.push({text:args[0],x:args[1],y:args[2],font:ctx.font});fill(...args);};ctx.drawImage=(...args)=>{if(args[0] instanceof OffscreenCanvas&&args.length===9)draws.push({x:args[5],y:args[6],width:args[7],height:args[8]});draw(...args);};
    const regions=renderPlatform(canvas,platform,preview,images,{screen:'chat',longMessage,selected,bubbleFlow:'mixed'}),bubbles=regions.filter(r=>r.bubble&&!r.decoration);rows.push({platform,longMessage,selected,bubbles:bubbles.map(r=>({side:r.bubble,group:r.group,y:r.y,height:r.height})),draws,texts});
   }for(const image of Object.values(images))image.close();return rows;
  },{preview,token:studio.token});
  for(const row of rows){assert.deepEqual(row.bubbles.map(r=>[r.side,r.group]),[['received',false],['received',true],['sent',false],['sent',true]],JSON.stringify({body,size,row}));assert.equal(row.draws.length,4);for(const d of row.draws){assert.ok(d.x>=0&&d.x+d.width<=390);assert.ok(d.y>=140&&d.y+d.height<=706,JSON.stringify({body,size,row}));}assert.ok(row.texts.some(t=>t.text==='딱 하나만 더 바꾸고'));assert.equal(row.texts.filter(t=>t.text==='오전 9:41').length,2);for(const str of ['왜 새벽이야?','진짜 마지막.'])assert.ok(row.texts.some(t=>t.text===str&&t.y<706));if(!row.longMessage)for(const str of ['배경색만 바꾼다며?','말풍선이 아직 덜 귀여워.'])assert.ok(row.texts.some(t=>t.text===str));}
  evidence.push({body,size,cases:rows.length,allFourMessagesVisible:true});
 }
 await page.locator('#phones').screenshot({path:path.join(out,'preview-conversation-short.png')});await page.locator('#long-message').check();await page.locator('#selected-message').check();await page.locator('#phones').screenshot({path:path.join(out,'preview-conversation-long.png')});await page.setViewportSize({width:390,height:900});await page.locator('#preview-platform').selectOption('android');await page.locator('#phones').screenshot({path:path.join(out,'preview-conversation-mobile.png')});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual((await json('projects'))[0],initial);assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'preview-conversation-report.json'),JSON.stringify({passed:true,title:'딱 하나만 더 바꾸고',evidence,projectUnchanged:true,pageErrors:errors},null,2));console.log('PASS: both directions show first and continuous messages in short/long and selected states; all four full drawable bounds fit the conversation, including 72px characters and image bodies; mobile and project state unchanged.');
}finally{await browser?.close();studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));}
