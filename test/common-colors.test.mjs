import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';
import sharp from 'sharp';
import {ROOT,newProject,compile,validate,cloneProject,exportProject,importProject,visualRevision,atomic,sha} from '../src/core.mjs';
import {CATALOG,publicCatalog} from '../src/catalog.mjs';
import {resolveStyles} from '../src/styles.mjs';
import {COMMON_COLORS,auditCommonColors,commonColorState,linkCommonColor} from '../public/common-colors.js';
import {bubbleGeometry} from '../public/bubble-model.js';
import {ProjectHistory} from '../public/history.js';
test('every color/opacity is audited as a shared role, existing bubble policy, or documented platform-only setting',()=>{
 const audit=auditCommonColors(CATALOG);assert.equal(audit.policies,39);assert.equal(publicCatalog().commonColors.length,39);
 const p=newProject();for(const s of COMMON_COLORS){const state=commonColorState(p,s,resolveStyles(p));assert.equal(state.mixed,false,s.id);const before=structuredClone(p.palette);p.commonColors={[s.id]:'#123456'};const styles=resolveStyles(p);for(const platform of ['ios','android'])for(const id of s[platform])assert.equal(styles[platform][id],'#123456',id);for(const id of s.alpha)assert.equal(styles.ios[id],1);assert.deepEqual(p.palette,before);}
 p.commonColors={unknown:'#123456',tabBannerBackground:'#12345678'};assert.equal(validate(p).filter(e=>e.field.startsWith('commonColors.')).length,2);
});
test('platform exceptions win over shared colors; reconnect, history, clone, cache and portable backup preserve the policy',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/common-colors-'));
 try{const p=newProject(),s=COMMON_COLORS.find(x=>x.id==='tabBannerBackground'),a=visualRevision(p);const automatic=newProject();automatic.overrides={ios:{[s.ios[0]]:'#112233'}};assert.equal(commonColorState(automatic,s,resolveStyles(automatic)).value,automatic.palette.accent);linkCommonColor(automatic,s);assert.equal(automatic.commonColors,undefined);assert.equal(resolveStyles(automatic).ios[s.ios[0]],automatic.palette.accent);p.commonColors={tabBannerBackground:'#123456',notificationText:'#2468ac'};assert.notEqual(a,visualRevision(p));const history=new ProjectHistory(p);p.overrides={ios:{[s.ios[0]]:'#112233'},android:{[s.android[0]]:'#80445566'}};history.record(p);const styles=resolveStyles(p);assert.equal(styles.ios[s.ios[0]],'#112233');assert.equal(styles.android[s.android[0]],'#80445566');assert.equal(commonColorState(p,s,styles).overridden.length,2);linkCommonColor(p,s);history.record(p);assert.equal(resolveStyles(p).ios[s.ios[0]],'#123456');assert.equal(history.undo().overrides.android[s.android[0]],'#80445566');assert.deepEqual(cloneProject(p).commonColors,p.commonColors);const restored=await importProject(await exportProject(p,root),root);assert.deepEqual(restored.commonColors,p.commonColors);const c=await compile(restored,root);assert.ok(c.files['ios/KakaoTalkTheme.css'].toString().includes('#123456'));assert.ok(c.files['android/res/values/colors.xml'].toString().includes('#123456'));assert.equal(c.coverage.complete,true);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('character headers leave the body height and vertical content padding unchanged',()=>{
 const p=newProject();for(const who of ['sent','received'])p.assets[who+'BubbleDecoration']='assets/'+'a'.repeat(64)+'.png';
 for(const body of ['color','image'])for(const radius of [0,18])for(const paddingY of [4,7,18])for(const who of ['sent','received']){if(body==='image')p.assets[who+'Bubble']='assets/'+'b'.repeat(64)+'.png';else delete p.assets[who+'Bubble'];p.bubble.paddingY=paddingY;p.bubble.paddingX=13;p.bubbleDesign={[who]:{body,radius,size:32,decorationEnabled:false}};const off=bubbleGeometry(p,who);p.bubbleDesign[who].decorationEnabled=true;const on=bubbleGeometry(p,who);assert.equal(on.bodyHeight,off.bodyHeight);assert.equal(on.insets[0]-on.header,off.insets[0]);assert.equal(on.insets[2],off.insets[2]);assert.equal(Math.max(on.height,23+on.insets[0]+on.insets[2])-on.header,Math.max(off.height,23+off.insets[0]+off.insets[2]));assert.ok(on.bodyHeight<=56);}
});
