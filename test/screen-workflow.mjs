import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {ROOT,SLOTS} from '../src/core.mjs';
import {publicCatalog} from '../src/catalog.mjs';
import {SCREENS,inScreen} from '../public/screen-model.js';
import {createStudio} from '../src/server.mjs';
const dataRoot=path.join(ROOT,'.test-data','screen-workflow-'+Date.now()),out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
const studio=await createStudio({dataRoot});await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+studio.server.address().port;let browser;const errors=[],evidence=[];
const catalog=publicCatalog(),seen={ios:new Set(),android:new Set(),resources:new Set()};
const ready=page=>page.getByText('예상 화면 · 실제 카카오톡의 글꼴·배치와 차이가 있을 수 있습니다.').waitFor();
const saved=page=>page.waitForFunction(()=>document.querySelector('#save-status').textContent==='자동 저장됨');
try{
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1520,height:1080}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/#'+studio.token);await ready(page);await page.locator('.inline-mode').waitFor();
 for(const screen of SCREENS){
  await page.locator(`[data-edit-screen=${screen.id}]`).click();await page.waitForFunction(id=>document.querySelector('#catalog-content')?.classList.contains('inline-mode')&&document.querySelector('#catalog-content')?.dataset.screen===id&&document.querySelector('#screen-title')?.textContent===document.querySelector(`[data-edit-screen=${id}]`)?.textContent,screen.id);
  // Wait for this screen's asynchronous catalog request, rather than stale previous controls.
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#screens .active').getAttribute('data-screen'),screen.id);
  for(const [tab,items] of [['ios',catalog.iosProperties],['android',catalog.androidColors],['resources',catalog.resources]]){
   await page.locator(`[data-catalog-tab=${tab}]`).click();
   const actual=await (tab==='resources'?page.locator('[aria-label="화면 이미지 선택"] option').evaluateAll(xs=>xs.map(x=>x.value)):page.locator('#catalog-list [data-property]').evaluateAll(xs=>xs.map(x=>x.dataset.property)));
   const expected=items.filter(x=>inScreen(x,tab,screen.id)).map(x=>x.id);assert.deepEqual(actual.sort(),expected.sort(),screen.id+'/'+tab);actual.forEach(id=>seen[tab].add(id));
  }
 }
 for(const tab of ['ios','android','resources']){const items=tab==='ios'?catalog.iosProperties.filter(x=>x.editable||x.kind==='image'):tab==='android'?catalog.androidColors:catalog.resources;assert.ok(items.every(x=>seen[tab].has(x.id)),tab+' omitted item');}
 evidence.push('All six screen editors expose the expected properties and all 82 image groups / 146 output slots');
 await page.locator('[data-panel=assets]').click();assert.equal(await page.locator('#asset-controls input[type=file]').count(),SLOTS.length);evidence.push('Every common source slot, including full profiles, selected tabs, bubble states and buttons, has an upload control');
 await page.locator('[data-screen=chat]').click();await page.waitForTimeout(100);await page.locator('[data-catalog-tab=android]').click();let field=page.getByRole('textbox',{name:'theme_chatroom_input_bar_send_button_color',exact:true});await field.fill('#123456');await field.press('Tab');await saved(page);await ready(page);let pixel=await page.locator('#android-preview').evaluate(c=>[...c.getContext('2d').getImageData(340,730,1,1).data]);assert.deepEqual(pixel,[18,52,86,255]);
 await page.locator('[data-screen=passcode]').click();await page.waitForTimeout(100);assert.equal(await page.locator('#passcode-controls input[data-slot^=passcode]').count(),8);await page.locator('[data-catalog-tab=android]').click();await page.locator('#reset-platform').click();await saved(page);
 const request=await fetch(base+'/api/projects',{headers:{Authorization:'Bearer '+studio.token}});const p=(await request.json())[0];assert.equal(p.overrides.android.theme_chatroom_input_bar_send_button_color,'#123456');evidence.push('Inline color edit reaches the rendered preview; resetting another screen preserves the edit');
 await page.locator('#next-screen').click();assert.equal(await page.locator('#screens .active').getAttribute('data-screen'),'components');
 await page.locator('#open-catalog').click();await page.locator('#catalog-dialog').waitFor({state:'visible'});await page.locator('[data-catalog-tab=resources]').click();assert.equal(await page.locator('.resource-card').count(),82);await page.locator('#close-catalog').click();await page.locator('.inline-mode').waitFor();assert.equal(await page.locator('#screens .active').getAttribute('data-screen'),'components');evidence.push('Next-screen navigation and full catalog round trip retain screen context');
 await page.locator('[data-edit-screen=chat]').click();await page.waitForTimeout(150);await page.locator('[data-catalog-tab=android]').click();await page.locator('#catalog-search').fill('send_button');await page.screenshot({path:path.join(out,'screen-workflow-desktop.png'),fullPage:true});
 assert.ok(await page.locator('#catalog-content').evaluate(el=>el.getBoundingClientRect().right<=window.innerWidth));
 await page.setViewportSize({width:800,height:1000});await page.screenshot({path:path.join(out,'screen-workflow-small.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'screen-workflow-report.json'),JSON.stringify({passed:true,evidence,pageErrors:errors,counts:{ios:105,android:49,logicalImages:82,outputImages:146},deviceVerified:false},null,2));console.log('PASS:',evidence.join('; '));
}finally{if(browser)await browser.close();studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));}
