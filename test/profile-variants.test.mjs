import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import JSZip from 'jszip';
import {ROOT,newProject,compile,makeKtheme,exportProject,importProject,cloneProject} from '../src/core.mjs';
import {registerAsset} from '../src/asset-store.mjs';
import {commonTarget} from '../src/asset-names.mjs';
import {resourceSource} from '../src/provenance.mjs';
import {CATALOG} from '../src/catalog.mjs';
const colors=['#D94354','#4A91BD','#E7BD52'];
async function fixture(){const root=await fs.mkdtemp(path.join(ROOT,'.test-data/profile-variants-unit-')),p=newProject('프로필 3종');return {root,p,async add(slot,color){const bytes=await sharp({create:{width:40,height:40,channels:4,background:color}}).png().toBuffer();p.assets[slot]=await registerAsset(root,p,commonTarget(slot),bytes);}};}
const pixel=async b=>[...(await sharp(b).removeAlpha().raw().toBuffer()).subarray(0,3)];
test('three common portraits reach iOS CSS, both PNG scales and packaged ktheme',async()=>{
 const {root,p,add}=await fixture();try{
  for(let n=1;n<=3;n++)await add(n===1?'profile':'profile'+n,colors[n-1]);
  const compiled=await compile(p,root),zip=await JSZip.loadAsync(await makeKtheme(compiled));
  assert.match(await zip.file('KakaoTalkTheme.css').async('string'),/-ios-profile-images: 'profileImg01\.png' 'profileImg02\.png' 'profileImg03\.png';/);
  for(let n=1;n<=3;n++)for(const scale of [2,3]){const file=`ios/Images/profileImg0${n}@${scale}x.png`,bytes=await zip.file(file.slice(4)).async('nodebuffer');assert.deepEqual(await pixel(bytes),[...Buffer.from(colors[n-1].slice(1),'hex')]);assert.equal((await sharp(bytes).metadata()).width,120*scale);assert.equal(resourceSource(p,CATALOG.files.find(f=>f.path===file)).slot,n===1?'profile':'profile'+n);}
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('old single-profile projects retain the same portrait in the additional slots',async()=>{
 const {root,p,add}=await fixture();try{await add('profile',colors[0]);const compiled=await compile(p,root);for(const scale of [2,3])for(const n of [2,3])assert.deepEqual(compiled.files[`ios/Images/profileImg0${n}@${scale}x.png`],compiled.files[`ios/Images/profileImg01@${scale}x.png`]);assert.equal(compiled.coverage.complete,true);}finally{await fs.rm(root,{recursive:true,force:true});}
});
test('portrait output exceptions, backup and clone preserve independent portraits',async()=>{
 const {root,p,add}=await fixture();try{for(let n=1;n<=3;n++)await add(n===1?'profile':'profile'+n,colors[n-1]);const file='ios/Images/profileImg02@3x.png';p.resourceOverrides={[file]:p.assets.profile3};const c=await compile(p,root);assert.deepEqual(await pixel(c.files[file]),[231,189,82]);assert.deepEqual(await pixel(c.files['ios/Images/profileImg02@2x.png']),[74,145,189]);const restoredRoot=path.join(root,'restored'),restored=await importProject(await exportProject(p,root),restoredRoot),restoredOutput=await compile(restored,restoredRoot);for(const f of CATALOG.files)assert.deepEqual(restoredOutput.files[f.path],c.files[f.path],f.path);assert.deepEqual(cloneProject(p).assets,p.assets);assert.deepEqual(cloneProject(p).resourceOverrides,p.resourceOverrides);}finally{await fs.rm(root,{recursive:true,force:true});}
});
