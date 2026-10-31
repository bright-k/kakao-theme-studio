import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {chromium} from 'playwright';
import {ROOT,newProject} from '../src/core.mjs';
import {registerAsset} from '../src/asset-store.mjs';
import {commonTarget} from '../src/asset-names.mjs';
import {createStudio} from '../src/server.mjs';
const root=await fs.mkdtemp(path.join(ROOT,'.test-data/profile-variants-browser-')),out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
const studio=await createStudio({dataRoot:root}),p=await studio.store.save(newProject('프로필 변형 검증')),projectRoot=await studio.store.rootFor(p),colors=['#D94354','#4A91BD','#E7BD52'];
for(let n=1;n<=3;n++){const slot=n===1?'profile':'profile'+n,bytes=await sharp({create:{width:40,height:40,channels:4,background:colors[n-1]}}).png().toBuffer();p.assets[slot]=await registerAsset(projectRoot,p,commonTarget(slot),bytes);}
await studio.store.save(p);const before=await fs.readFile(path.join(projectRoot,'theme.json'),'utf8');await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));let browser;const errors=[];
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1540,height:1140}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+studio.server.address().port+'/#'+studio.token);await page.locator('#design-status').filter({hasText:'미리보기 최신'}).waitFor({timeout:30000});
 const pixel=(platform,row=0)=>page.locator('#'+platform+'-preview').evaluate((c,row)=>[...c.getContext('2d').getImageData(48,153+row*95,1,1).data].slice(0,3),row),rgb=n=>[...Buffer.from(colors[n-1].slice(1),'hex')];
 for(const screen of ['friends','chats']){await page.locator('#screens [data-screen="'+screen+'"]').click();assert.equal(await page.locator('#profile-variant').inputValue(),'0');for(const platform of ['ios','android'])for(let row=0;row<5;row++)assert.deepEqual(await pixel(platform,row),rgb(row%3+1));}
 const picker=page.locator('#preview-target'),value=await picker.locator('option').filter({hasText:'IOS · 프로필 2'}).getAttribute('value');await picker.selectOption(value);await page.locator('#go-preview-target').click();await page.locator('#screen-assets [data-common-slot="profile2"].setting-target').waitFor();
 for(const n of [1,2,3]){await page.locator('#profile-variant').selectOption(String(n));for(const platform of ['ios','android'])for(const row of [0,1])assert.deepEqual(await pixel(platform,row),rgb(n));}
 await page.locator('#screens [data-screen="chat"]').click();for(const n of [2,3]){await page.locator('#profile-variant').selectOption(String(n));for(const platform of ['ios','android'])assert.deepEqual(await page.locator('#'+platform+'-preview').evaluate(c=>[...c.getContext('2d').getImageData(38,181,1,1).data].slice(0,3)),rgb(n));}
 await page.locator('#screens [data-screen="friends"]').click();await page.locator('#profile-variant').selectOption('0');await page.locator('#phones').screenshot({path:path.join(out,'profile-variants-browser.png')});await page.reload();await page.locator('#design-status').filter({hasText:'미리보기 최신'}).waitFor();await page.locator('#screens [data-screen="friends"]').click();assert.equal(await page.locator('#profile-variant').inputValue(),'0');
 assert.equal(await fs.readFile(path.join(projectRoot,'theme.json'),'utf8'),before);assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'profile-variants-report.json'),JSON.stringify({passed:true,checks:['five list rows use three generated portraits on both platforms','iOS profile 2 hit navigates to correct shared source','explicit variants reach lists and chat','reload defaults to mixed preview','UI states do not mutate theme'],pageErrors:errors,actualAppVerified:false},null,2));console.log('PASS: profiles 1–3 output pixels, preview mix/selection/navigation/reload and state isolation');
}finally{if(browser)await browser.close();studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));}
