import test from 'node:test';
import assert from 'node:assert/strict';
import {publicCatalog} from '../src/catalog.mjs';
import {SLOTS} from '../src/core.mjs';
import {SCREENS,contextsFor,inScreen,slotsForScreen,auditScreenCoverage} from '../public/screen-model.js';
const catalog=publicCatalog();
test('every supported property and physical image is reachable through a screen or metadata editor',()=>{
 assert.deepEqual(auditScreenCoverage(catalog),{ios:105,android:49,resources:82,files:146});
 const union=new Set(SCREENS.flatMap(s=>slotsForScreen(s.id)));
 assert.deepEqual([...union].sort(),[...SLOTS].sort());
 for(const [kind,items] of [['ios',catalog.iosProperties],['android',catalog.androidColors],['resources',catalog.resources]]){
  const reachable=new Set([...SCREENS.map(s=>s.id),'settings'].flatMap(s=>items.filter(x=>inScreen(x,kind,s)).map(x=>x.id)));
  assert.deepEqual([...reachable].sort(),items.map(x=>x.id).sort());
 }
 assert.throws(()=>contextsFor({id:'future',selector:'NewStyle'},'ios'),/연결이 없는/);
 assert.throws(()=>contextsFor({id:'future',name:'unknown.png',group:'배경'},'resources'),/연결이 없는/);
});
test('screen associations preserve shared resources and detailed states',()=>{
 const ids=(kind,screen)=>new Set((kind==='resources'?catalog.resources:kind==='ios'?catalog.iosProperties:catalog.androidColors).filter(x=>inScreen(x,kind,screen)).map(x=>x.id));
 assert.ok(ids('resources','friends').has('ios/mainBgImage.png'));
 assert.ok(ids('resources','chats').has('ios/mainBgImage.png'));
 assert.ok(!ids('resources','passcode').has('ios/mainBgImage.png'));
 for(const n of [1,2,3,4])for(const suffix of ['', 'Selected'])assert.ok(ids('resources','passcode').has(`ios/passcodeImgCode0${n}${suffix}.png`));
 for(const name of ['chatroomBubbleSend02Selected.png','chatroomBubbleReceive01Selected.png'])assert.ok(ids('resources','chat').has('ios/'+name));
 assert.ok(ids('resources','chats').has('ios/maintabIcoLocalSelected.png'));
 assert.ok(ids('android','passcode').has('theme_passcode_pattern_line_color'));
 assert.ok(ids('ios','chat').has('InputBarStyle-Chat/-ios-send-highlighted-background-color'));
 assert.ok(ids('resources','identity').has('android/theme_splash_image.png'));
});
