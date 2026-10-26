import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {ROOT} from '../src/core.mjs';
import {createStudio} from '../src/server.mjs';
const root=await fs.mkdtemp(path.join(ROOT,'.test-data/preview-context-')),out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
const studio=await createStudio({dataRoot:root});await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+studio.server.address().port;let browser;
const req=async(url,method='GET',body)=>{const r=await fetch(base+'/api/'+url,{method,headers:{Authorization:'Bearer '+studio.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert.ok(r.ok,await r.clone().text());return r.json();};
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1520,height:1100}}),errors=[],evidence=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/#'+studio.token);await page.getByText('예상 화면 · 실제 카카오톡의 글꼴·배치와 차이가 있을 수 있습니다.').waitFor().catch(async e=>{console.log(JSON.stringify({errors,toast:await page.locator('#toast').textContent()}));throw e;});const initial=(await req('projects'))[0];
 await page.locator('[data-edit-screen=components]').click();await page.waitForFunction(()=>document.querySelector('#catalog-content').dataset.screen==='components');
 for(const scene of ['notification','share','buttons','tab']){
  await page.locator('#component-scene').selectOption(scene);assert.ok((await page.locator('#component-context').textContent()).length>30);const options=await page.locator('#preview-target option').allTextContents();
  const terms={notification:['알림 배경','이름','내용'],share:['전달 안내 배경','이름 글자','대화방으로 이동'],buttons:['공통 버튼','친구 추가 아이콘'],tab:['탭 위 안내 배너']}[scene];for(const term of terms)assert.ok(options.some(x=>x.includes(term)),scene+':'+term);
  await page.locator('#phones').screenshot({path:path.join(out,'context-'+scene+'.png')});
 }
 evidence.push('Four mobile contexts explain and expose the real notification, share, common-button, friend-icon and tab-banner properties');
 // A known drawn button rectangle is the independent reference for overlays.
 await page.locator('#component-scene').selectOption('buttons');await page.locator('#button-state').selectOption('pressed');
 for(const width of [1520,800,390])for(const platform of ['ios','android']){
  await page.setViewportSize({width,height:1100});await page.locator('#preview-platform').selectOption(platform);const canvas=page.locator('#'+platform+'-preview');await canvas.scrollIntoViewIfNeeded();
  for(const transformed of [false,true]){
   await canvas.locator('..').evaluate((p,t)=>{p.style.borderWidth=t?'9.5px':'';p.style.transform=t?'scale(.83)':'';},transformed);await canvas.scrollIntoViewIfNeeded();const rect=await canvas.boundingBox();await page.mouse.move(rect.x+195/390*rect.width,rect.y+285/780*rect.height);const overlay=page.locator('#'+platform+'-preview + .preview-highlight');assert.equal(await overlay.isVisible(),true);assert.equal(await overlay.locator('span').textContent(),'친구 추가 · 공통 버튼');const box=await overlay.boundingBox();if(width===1520&&platform==='ios'&&!transformed)await page.locator('#phones').screenshot({path:path.join(out,'context-selection.png')});
   for(const [actual,expected] of [[box.x,rect.x+24/390*rect.width-5*(transformed ? .83 : 1)],[box.y,rect.y+270/780*rect.height-5*(transformed ? .83 : 1)],[box.width,342/390*rect.width+10*(transformed ? .83 : 1)],[box.height,48/780*rect.height+10*(transformed ? .83 : 1)]])assert.ok(Math.abs(actual-expected)<.12,JSON.stringify({width,platform,transformed,actual,expected}));
  }
  await canvas.locator('..').evaluate(p=>{p.style.borderWidth='';p.style.transform='';});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' overflow');
 }
 evidence.push('Both platforms keep the intended 5px selection padding within 0.12 CSS pixels at desktop, 800px and 390px widths, fractional borders and transformed scaling');
 await page.setViewportSize({width:1520,height:1100});await page.locator('#preview-platform').selectOption('both');await page.locator('#component-scene').selectOption('notification');
 // Picker navigation selects the exact shared catalog editor and keeps state UI-only.
 let option=await page.locator('#preview-target option').evaluateAll(xs=>xs.find(x=>x.textContent.includes('ANDROID · 새 메시지 알림 · 내용')).value);await page.locator('#preview-target').selectOption(option);await page.locator('#go-preview-target').click();await page.locator('[data-common-color=notificationText].setting-target').waitFor();await page.locator('#selection-tools').getByRole('button',{name:'Android 세부 설정',exact:true}).click();await page.locator('.property-row.setting-target[data-property=theme_notification_color]').waitFor();assert.deepEqual((await req('projects'))[0],initial);
 // Use the existing catalog's value control so the same override drives output and preview.
 const row=page.locator('.property-row[data-property=theme_notification_color]');const color=row.locator('input[type=color]');await color.fill('#bb2255');await color.dispatchEvent('input');await page.waitForFunction(()=>document.querySelector('#save-status').textContent==='자동 저장됨');
 await page.waitForFunction(()=>{const c=document.querySelector('#android-preview'),ctx=c.getContext('2d'),data=ctx.getImageData(80,126,250,54).data;for(let i=0;i<data.length;i+=4)if(data[i]===187&&data[i+1]===34&&data[i+2]===85&&data[i+3]===255)return true;return false;});const changed=(await req('projects'))[0];assert.equal(changed.overrides.android.theme_notification_color,'#bb2255');assert.deepEqual(changed.palette,initial.palette);
 await page.locator('#undo').click();await page.waitForFunction(()=>document.querySelector('#save-status').textContent==='자동 저장됨');assert.deepEqual((await req('projects'))[0],initial);evidence.push('Context navigation and platform view leave project data unchanged; exact property edits and undo preserve the shared palette');
 // Inspect all screen regions against actual image draws and clipping.
 const preview=await req('preview','POST',{project:initial});const geometry=await page.evaluate(async({preview,token})=>{
  const {renderPlatform}=await import('/preview-renderer.js'),images={};for(const platform of ['ios','android'])for(const [name,file] of Object.entries(preview[platform])){const r=await fetch('/api/preview-file?projectId='+preview.projectId+'&revision='+preview.revision+'&name='+encodeURIComponent(file),{headers:{Authorization:'Bearer '+token}});images[platform+'.'+name]=await createImageBitmap(await r.blob());}
  const results=[];for(const platform of ['ios','android'])for(const screen of ['friends','chats','chat','passcode','components','identity']){const canvas=document.createElement('canvas');canvas.width=390;canvas.height=780;const regions=renderPlatform(canvas,platform,preview,images,{screen,longMessage:true,selected:true});for(const r of regions)if(r.x<0||r.y<40||r.x+r.width>390.01||r.y+r.height>780.01)throw new Error('outside canvas: '+JSON.stringify(r));if(screen==='components'&&regions.some(x=>x.label==='화면 배경'))throw new Error('Decorative backdrop is selectable');if(screen==='passcode'){const r=regions.find(x=>x.label==='비밀번호 1 입력 후');if(JSON.stringify([r.x,r.y,r.width,r.height])!==JSON.stringify([130,225,28,28]))throw new Error('passcode draw mismatch');}if(screen==='friends'){const r=regions.find(x=>x.label==='친구 탭 · 선택');if(JSON.stringify([r.x,r.y,r.width,r.height])!==JSON.stringify([25,710,32,32]))throw new Error('tab draw mismatch');}results.push({platform,screen,regions:regions.length});}return results;
 },{preview,token:studio.token});evidence.push('All six screens clip hit regions to the rendered canvas; tab and passcode regions match actual image rectangles');
 await page.setViewportSize({width:390,height:1000});await page.locator('#preview-platform').selectOption('android');await page.locator('[data-edit-screen=components]').click();await page.locator('#component-scene').selectOption('buttons');await page.locator('main').screenshot({path:path.join(out,'context-mobile.png')});
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'preview-context-report.json'),JSON.stringify({passed:true,evidence,geometry,deviceVerified:false},null,2));console.log('PASS:',evidence.join('; '));
}finally{if(browser)await browser.close();studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));}
