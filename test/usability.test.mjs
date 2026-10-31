import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import JSZip from 'jszip';
import {newProject,ROOT,compile,validate} from '../src/core.mjs';
import {openProjectStore} from '../src/project-store.mjs';
import {registerAsset} from '../src/asset-store.mjs';
import {commonTarget} from '../src/asset-names.mjs';
import {createStudio} from '../src/server.mjs';

test('recoverable invalid edits protect image references across restart, reject stale clears and stay out of portable backups',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/draft-'));let store=await openProjectStore(root);try{
  const p=await store.save(newProject('임시 편집')),dir=await store.rootFor(p),ref=await registerAsset(dir,p,commonTarget('profile'),await sharp({create:{width:20,height:20,channels:4,background:'#EA5B70'}}).png().toBuffer()),draft=structuredClone(p);draft.version='1.0';draft.assets.profile=ref;
  const clientId=crypto.randomUUID(),data={projectId:p.id,clientId,sequence:5,project:draft,base:JSON.stringify(p)};await store.updateDraft(data);assert.equal((await store.load(p.id)).version,'1.0.0');
  await store.close();store=await openProjectStore(root);assert.equal((await store.drafts(p.id))[clientId].project.version,'1.0');
  const input={project:p,historyRefs:[],clientId:crypto.randomUUID(),sequence:1};assert.equal((await store.assetCleanup(input)).candidates.length,0);await assert.rejects(()=>store.archiveUnusedAssets({...input,refs:[ref]}),/현재 설정/);
  await store.updateDraft({...data,sequence:4,clear:true});assert.equal((await store.assetCleanup(input)).candidates.length,0);
  const backup=await JSZip.loadAsync((await store.backup(p.id)).bytes);assert.ok(!Object.keys(backup.files).some(n=>/draft|password|\.p12/.test(n)));assert.ok(!Object.keys(backup.files).some(n=>n.endsWith(ref)));
  await assert.rejects(()=>store.updateDraft({...data,sequence:6,project:{...draft,assets:{profile:'assets/../../keys/secret'}}}),/참조/);
  const activeClient=crypto.randomUUID();await store.protectAssetHistory({project:p,historyRefs:[],clientId:activeClient,draftClientId:clientId,sequence:1});await assert.rejects(()=>store.updateDraft({...data,sequence:6,clear:true,requesterClientId:crypto.randomUUID()}),/활성 창/);store.releaseAssetHistory(activeClient,2);await store.updateDraft({...data,sequence:6,clear:true});await store.updateDraft({...data,sequence:5});assert.equal((await store.assetCleanup(input)).candidates.length,1);assert.equal((await store.drafts(p.id))[clientId].project,undefined);
 }finally{await store.close();await fs.rm(root,{recursive:true,force:true});}
});
test('contrast resolves platform/state colors, uses actual selected pixels, and does not claim image contrast is known',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/contrast-'));try{const p=newProject();p.bubbleDesign={received:{body:'color',color:'#FFFFFF',textColor:'#FCFCFC'}};
 assert.ok(validate(p).some(d=>d.field==='bubbleDesign.received.textColor'&&d.contrast<1.1));p.bubbleDesign.received.textColor='#111111';p.overrides={ios:{'MessageCellStyle-Receive/-ios-selected-text-color':'#E0E0E0'}};const c=await compile(p,root);assert.ok(c.diagnostics.some(d=>d.target?.selected&&d.contrast<1.1));assert.ok(!c.diagnostics.some(d=>d.contrast&&d.target?.platform==='android'&&/받은/.test(d.message)));
 p.bubblePlatforms={ios:{received:{body:'assets/'+'a'.repeat(64)+'.png'}}};const d=validate(p);assert.ok(d.some(x=>x.target?.platform==='ios'&&x.contrastKnown===false));assert.ok(!d.some(x=>x.target?.platform==='ios'&&x.contrast&&/받은/.test(x.message)));
 p.commonColors={inputBackground:'#FFFFFF',inputText:'#FFFFFF'};p.overrides.android={theme_chatroom_input_bar_color:'#000000'};assert.ok(validate(p).some(d=>d.field==='commonColors.inputText'&&d.target.platform==='ios'));assert.ok(!validate(p).some(d=>d.field==='commonColors.inputText'&&d.target.platform==='android'));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('background upload applies image mode explicitly, preserves platform exceptions and supports source-only registration',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/background-apply-')),studio=await createStudio({dataRoot:root});await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+studio.server.address().port,headers={Authorization:'Bearer '+studio.token,'Content-Type':'application/json'};
 try{let p=await studio.store.save(newProject());p.resourceOptions={'ios/chatroomBgImage.png':{enabled:false,focalX:.25},'android/theme_chatroom_background_image.png':{enabled:false}};
 p.overrides={ios:{'BackgroundStyle-ChatRoom/background-color':'#112233'}};const png=await sharp({create:{width:24,height:24,channels:4,background:'#445566'}}).png().toBuffer();const ref=await registerAsset(await studio.store.rootFor(p),p,commonTarget('chatBackground'),png);p.resourceOverrides={'ios/Images/chatroomBgImage@2x.png':ref};const upload=async apply=>{const r=await fetch(base+'/api/assets',{method:'POST',headers,body:JSON.stringify({project:p,slot:'chatBackground',base64:png.toString('base64'),apply})});assert.equal(r.status,200,await r.clone().text());return r.json();};
 p=await upload(false);assert.equal(p.resourceOptions['ios/chatroomBgImage.png'].enabled,false);p=await upload(true);assert.equal(p.resourceOptions['ios/chatroomBgImage.png'].enabled,true);assert.equal(p.resourceOptions['ios/chatroomBgImage.png'].focalX,.25);assert.equal(p.resourceOverrides['ios/Images/chatroomBgImage@2x.png'],ref);assert.equal(p.overrides.ios['BackgroundStyle-ChatRoom/background-color'],'#112233');
 assert.equal((await fetch(base+'/api/drafts?id='+p.id)).status,403);assert.equal((await fetch(base+'/api/draft',{method:'POST',headers,body:JSON.stringify({projectId:'../keys',clientId:crypto.randomUUID(),sequence:1,project:p,base:''})})).status,400);
 }finally{studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));await fs.rm(root,{recursive:true,force:true});}
});
