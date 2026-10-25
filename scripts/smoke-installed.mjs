import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { ROOT,readJson } from '../src/core.mjs';
const session=await readJson(path.join(ROOT,'.data/session.json'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1480,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${session.port}/#${session.token}`);
 await page.getByText('예상 화면 · 실제 카카오톡의 글꼴·배치와 차이가 있을 수 있습니다.').waitFor();
 assert.equal(await page.locator('#phones canvas').count(),2);assert.equal(await page.locator('[data-edit-screen]').count(),6);assert.deepEqual(errors,[]);
 if(process.env.STUDIO_SMOKE_CAPTURE)await page.screenshot({path:process.env.STUDIO_SMOKE_CAPTURE,fullPage:true});
 await page.getByRole('button',{name:'잠금화면 디자인',exact:false}).click();assert.equal(await page.locator('#passcode-controls input[data-slot^=passcode]').count(),8);await page.locator('#passcode-digits').selectOption('4');assert.equal(await page.locator('#passcode-digits option').count(),5);
 await page.getByRole('button',{name:'전체 구성·리소스',exact:false}).click();await page.locator('#catalog-dialog').waitFor({state:'visible'});assert.ok((await page.locator('#catalog-summary').textContent()).includes('146'));
 await page.locator('[data-catalog-tab=resources]').click();assert.equal(await page.locator('.resource-card').count(),82);await page.locator('[data-resource="ios/chatroomBubbleSend01.png"]').click();await page.getByRole('spinbutton',{name:'시각 편집 가로 늘림 1 시작',exact:true}).waitFor();assert.ok((await page.locator('#resource-source').textContent()).includes('기본 도형·색상으로 자동 생성'));assert.deepEqual(errors,[]);console.log('PASS: installed Desktop instance, authenticated editor, two previews, eight passcode image controls, state controls, full catalog, applied source, visual geometry, no browser errors.');
}finally{await browser.close();}
