import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
import {ROOT} from '../src/core.mjs';
import {createStudio} from '../src/server.mjs';
const root=await fs.mkdtemp(path.join(ROOT,'.test-data/passcode-preview-')),out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
const studio=await createStudio({dataRoot:root});await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+studio.server.address().port;
async function api(route,method='GET',body){const r=await fetch(base+'/api/'+route,{method,headers:{Authorization:'Bearer '+studio.token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});assert.ok(r.ok,await r.clone().text());return r.json();}
let browser;try{
 let p=await api('projects','POST',{name:'잠금 실기기 배치 회귀'});const source=await sharp(Buffer.from('<svg width="1000" height="1000"><rect x="250" width="500" height="1000" fill="#CA2356"/></svg>')).png().toBuffer();p=await api('assets','POST',{project:p,slot:'lockBackground',base64:source.toString('base64')});
 const initial=structuredClone(p),errors=[];browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1540,height:1180}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/#'+studio.token);await page.locator('#design-status').filter({hasText:'미리보기 최신'}).waitFor({timeout:60000});if(await page.locator('#projects').inputValue()!==p.id){await page.locator('#projects').selectOption(p.id);await page.locator('#design-status').filter({hasText:'미리보기 최신'}).waitFor({timeout:60000});}await page.locator('#screens [data-screen=passcode]').click();await page.locator('#preview-platform').selectOption('both');
 const result=await page.evaluate(async()=>{
  const {renderPlatform}=await import('/preview-renderer.js'),canvases=['ios','android'].map(p=>document.querySelector('#'+p+'-preview')),pixel=(c,x,y)=>[...c.getContext('2d').getImageData(x,y,1,1).data];
  // The previous full-screen cover hid these transparent strips. Upper-panel
  // center-crop reproduces the independently measured iOS edge at x≈59/390.
  if(canvases[0].height!==845||canvases[1].height!==845)throw Error('Wrong lock viewport');
  if(pixel(canvases[0],64,100).join()!=='202,35,86,255'||pixel(canvases[0],54,100).join()==='202,35,86,255')throw Error('iOS upper crop no longer matches capture '+JSON.stringify([pixel(canvases[0],64,100),pixel(canvases[0],54,100)]));
  if(pixel(canvases[1],55,100).join()!=='202,35,86,255'||pixel(canvases[1],43,100).join()==='202,35,86,255')throw Error('Android upper crop mismatch');
  // Verify exact drawing/hit rectangles and source pixels remain independent
  // for all eight indicators, including outside the old 780px canvas.
  const rows=[];for(const platform of ['ios','android'])for(const entered of [0,1,2,3,4])for(const ratio of [16/9,19.5/9,21/9])for(const biometric of [false,true]){const canvas=document.createElement('canvas');canvas.width=390;canvas.height=780;const images={},draws=[];for(let n=1;n<=4;n++)for(const selected of [false,true]){const b=document.createElement('canvas');b.width=platform==='ios'?88:132;b.height=b.width;b.getContext('2d').fillStyle=selected?'#DD2244':'#22BB66';b.getContext('2d').fillRect(0,0,b.width,b.height);images[platform+'.passcode'+n+(selected?'Selected':'')]=b;}const ctx=canvas.getContext('2d'),draw=ctx.drawImage.bind(ctx);ctx.drawImage=(...args)=>{draws.push(args);draw(...args);};const palette={main:'#FFF9F2',text:'#492B26',secondary:'#795F57',chat:'#FFFFFF',accent:'#B84648'},preview={palette,bubble:{},files:{}};
   const regions=renderPlatform(canvas,platform,preview,images,{screen:'passcode',passcodeDigits:entered,passcodeAspectRatio:ratio,passcodeBiometric:biometric,selected:true,pressedDigit:0});const indicators=regions.filter(r=>r.slot?.startsWith('passcode'));if(indicators.length!==4)throw Error('Missing individual indicators');for(const[i,r]of indicators.entries()){const expected=i<entered?'221,34,68,255':'34,187,102,255';if(pixel(canvas,Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)).join()!==expected)throw Error('Independent indicator pixels lost');const painted=draws.find(a=>a[1]===r.x&&a[2]===r.y);if(!painted||Math.abs(painted[3]-r.width)>.001||Math.abs(painted[4]-r.height)>.001)throw Error('Hit/drawing mismatch');}const zero=regions.find(r=>r.label==='키패드 숫자 0');if(!zero||zero.y+zero.height>=canvas.height)throw Error('Bottom key clipped');if(regions.some(r=>r.y+r.height>canvas.height+.01))throw Error('Hit outside resized canvas');rows.push({platform,entered,height:canvas.height,ratio,biometric,centerY:indicators[0].y+indicators[0].height/2});
   renderPlatform(canvas,platform,preview,{}, {screen:'friends'});if(canvas.height!==780)throw Error('Other screens inherit tall lock viewport');
  }return rows;
 });
 await page.locator('#phones').screenshot({path:out+'/passcode-preview-bounds.png'});
 // Click/overlay geometry must use the taller canvas's coordinates at mobile
 // and desktop scales rather than a baked-in 780px height.
 for(const width of [1540,390]){await page.setViewportSize({width,height:1180});await page.locator('#preview-platform').selectOption('ios');const c=page.locator('#ios-preview');await c.scrollIntoViewIfNeeded();const b=await c.boundingBox();await page.mouse.move(b.x+b.width*172/390,b.y+b.height*337/845);await page.locator('#ios-preview + .preview-highlight').filter({hasText:'비밀번호'}).waitFor();}
 if(!await page.locator('#preview-more-options').evaluate(el=>el.open))await page.locator('#preview-more-options>summary').click();
 for(const [ratio,height]of [['1.7777777778',693],['2',780],['2.1666666667',845],['2.2222222222',867],['2.3333333333',910]]){await page.locator('#passcode-aspect').selectOption(ratio);for(const platform of ['ios','android'])assert.equal(await page.locator('#'+platform+'-preview').evaluate(c=>c.height),height);}
 await page.locator('#passcode-aspect').selectOption('2.1666666667');await page.locator('#passcode-biometric').selectOption('no');await page.locator('#passcode-biometric').selectOption('yes');
 await page.locator('#screens [data-screen=chat]').click();assert.equal(await page.locator('#ios-preview').evaluate(c=>c.height),780);await page.locator('#screens [data-screen=passcode]').click();assert.equal(await page.locator('#ios-preview').evaluate(c=>c.height),845);
 assert.deepEqual((await api('projects')).find(x=>x.id===p.id),initial);assert.deepEqual(errors,[]);await fs.writeFile(out+'/passcode-preview-report.json',JSON.stringify({passed:true,rows:result,upperPanelCropMatchesIosCapture:true,uiStateDoesNotChangeProject:true,pageErrors:errors,responsiveRatiosTested:['16:9','18:9','19.5:9','20:9','21:9'],biometricStatesTested:true,allDevicesVerified:false},null,2)+'\n');console.log('PASS: upper-only background crop, independent indicator states, tall-canvas hits and mobile overlays; project unchanged');
}finally{await browser?.close();studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));}
