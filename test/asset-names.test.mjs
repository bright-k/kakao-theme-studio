import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import JSZip from 'jszip';
import {ROOT,SLOTS,newProject,compile,sha,visualRevision,assertValid,importProject} from '../src/core.mjs';
import {CATALOG,RESOURCES,logicalResource} from '../src/catalog.mjs';
import {commonTarget,outputTarget,validAssetRef} from '../src/asset-names.mjs';
import {registerAsset,writeAsset,readAsset,listAssetFiles} from '../src/asset-store.mjs';
import {migrateAssetReferences} from '../src/asset-migration.mjs';
import {createProjectArchive,readProjectArchive} from '../src/project-archive.mjs';
import {makeEditorService} from '../src/editor-service.mjs';
import {openProjectStore} from '../src/project-store.mjs';
import {resourceSource} from '../src/provenance.mjs';
import {ProjectHistory} from '../public/history.js';
const image=color=>sharp({create:{width:64,height:56,channels:4,background:color}}).png().toBuffer();
async function fixture(){await fs.mkdir(path.join(ROOT,'.test-data'),{recursive:true});return fs.mkdtemp(path.join(ROOT,'.test-data/asset-names-'));}
async function legacy(root,bytes){const ref='assets/'+sha(bytes)+'.png';await writeAsset(root,ref,bytes);return ref;}
test('every common slot and physical output has a readable, safe, distinct role target',()=>{
 assert.equal(new Set(SLOTS.map(s=>commonTarget(s).base)).size,SLOTS.length);
 for(const s of SLOTS)assert.ok(validAssetRef(commonTarget(s).base+'-v0001.png'),s);
 const bases=CATALOG.files.map(f=>outputTarget(f.path).base);assert.equal(new Set(bases).size,CATALOG.files.length);
 for(const f of CATALOG.files){assert.ok(validAssetRef(outputTarget(f.path).base+'-v0001.png'),f.path);const group=outputTarget(f.path,{resourceId:logicalResource(f)});assert.ok(group.base.startsWith('assets/'+f.platform+'/'));}
 for(const bad of ['assets/common/../body-v0001.png','assets/ios/a/body.png','assets/android//body-v0001.png','assets/common/UPPER-v0001.png','assets/unknown/body-v0001.png'])assert.equal(validAssetRef(bad),false);
});
test('identical explicit slots are independent files while inherited and cross-platform outputs share the common source',async()=>{
 const root=await fixture();try{const p=newProject(),bytes=await image('#CC3355');for(const s of ['sentBubble','receivedBubble'])p.assets[s]=await registerAsset(root,p,commonTarget(s),bytes);
 assert.equal(p.assets.sentBubble,'assets/common/chat/sent/first/body-v0001.png');assert.notEqual(p.assets.sentBubble,p.assets.receivedBubble);assert.notEqual((await fs.stat(path.join(root,p.assets.sentBubble))).ino,(await fs.stat(path.join(root,p.assets.receivedBubble))).ino);
 const c=await compile(p,root);assert.equal(Object.keys(c.files).filter(n=>n.endsWith('.png')).length,146);
 for(const f of CATALOG.files.filter(f=>/BubbleSend0[12]@2x|bubble_me_0[12]_/.test(f.path)))assert.equal(resourceSource(p,f).ref,p.assets.sentBubble);
 assert.equal(p.assets.sentBubbleGroup,undefined);assert.equal((await listAssetFiles(root)).length,2);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('versions are immutable, simultaneous uploads do not collide, and undo restores source bytes and cache identity',async()=>{
 const root=await fixture();try{const p=newProject(),red=await image('#FF0000'),blue=await image('#0000FF');p.assets.profile=await registerAsset(root,p,commonTarget('profile'),red);const history=new ProjectHistory(p),before=visualRevision(p);
 p.assets.profile=await registerAsset(root,p,commonTarget('profile'),blue);history.record(p);assert.match(p.assets.profile,/-v0002.png$/);assert.notEqual(visualRevision(p),before);const old=history.undo();assert.equal(visualRevision(old),before);assert.deepEqual(await readAsset(root,old.assets.profile,old.assetHashes[old.assets.profile]),red);assert.deepEqual(await readAsset(root,history.redo().assets.profile),blue);
 const refs=await Promise.all(Array.from({length:8},()=>registerAsset(root,p,commonTarget('profile'),red)));assert.equal(new Set(refs).size,8);assert.match(refs.at(-1),/-v0010.png$/);await assert.rejects(()=>writeAsset(root,old.assets.profile,blue),/덮어/);
 await fs.writeFile(path.join(root,old.assets.profile),blue);await assert.rejects(()=>readAsset(root,old.assets.profile),/해시/);await assert.rejects(()=>compile(old,root),/해시/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('platform and per-scale overrides use separate paths, raw nine-patch bytes survive, and retained overrides never reactivate',async()=>{
 const root=await fixture();try{let p=newProject();const common=await image('#CC3344'),other=await image('#3366CC');p.assets.sentBubble=await registerAsset(root,p,commonTarget('sentBubble'),common);const editor=makeEditorService(root),ios=RESOURCES.find(r=>r.platform==='ios'&&r.variants.some(v=>v.fileName==='chatroomBubbleSend01@2x.png')),androidFile='android/res/drawable-xxhdpi/theme_chatroom_bubble_me_01_image.9.png',android=CATALOG.files.find(f=>f.path===androidFile);
 p=(await editor.singleResource(p,{resourceId:ios.id,base64:other.toString('base64')})).project;assert.equal(new Set(ios.variants.map(f=>p.resourceOverrides[f.path])).size,1);assert.equal(p.resourceOverrides[ios.variants[0].path],'assets/ios/chat/sent/first/body-v0001.png');assert.equal(resourceSource(p,android).ref,p.assets.sentBubble);
 const file=ios.variants.find(f=>f.fileName.includes('@2x')).path;p=(await editor.singleResource(p,{file,base64:common.toString('base64')})).project;assert.match(p.resourceOverrides[file],/assets\/ios\/chat\/sent\/first\/2x\/body-v0001.png$/);
 const raw=(await compile(p,root)).files[androidFile];p=(await editor.singleResource(p,{file:androidFile,base64:raw.toString('base64'),nativeNinePatch:true})).project;assert.match(p.resourceOverrides[androidFile],/^assets\/android\/chat\/sent\/first\/drawable-xxhdpi\/body-v0001\.9.png$/);const native=await readAsset(root,p.resourceOverrides[androidFile]);assert.deepEqual(await sharp(native).raw().toBuffer(),await sharp(raw).raw().toBuffer());assert.equal(sha((await compile(p,root)).files[androidFile]),sha(native));
 const retained=p.resourceOverrides[androidFile];delete p.resourceOverrides[androidFile];p.nativeNinePatch=[];assert.equal(resourceSource(p,android).ref,p.assets.sentBubble);assert.ok(await readAsset(root,retained));const c=await compile(p,root);assert.deepEqual(c.files[androidFile],raw);assert.equal(resourceSource(p,android).kind,'common');
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('migration preserves all 146 output bytes, same-image explicit slots split, and repeat migration retains selections',async()=>{
 const root=await fixture();try{const p=newProject(),bytes=await image('#AB3355'),ref=await legacy(root,bytes);p.assets.sentBubble=ref;p.assets.receivedBubble=ref;p.assets.sentBubbleDecoration=ref;p.bubbleDesign={sent:{body:'image'}};const editor=makeEditorService(root),c=await compile(p,root),file='android/res/drawable-xxhdpi/theme_chatroom_bubble_you_01_image.9.png';p.resourceOverrides={[file]:await legacy(root,c.files[file])};p.nativeNinePatch=[file];const before=await compile(p,root),{project:next,changed}=await migrateAssetReferences(root,p);assert.equal(changed,4);assert.notEqual(next.assets.sentBubble,next.assets.receivedBubble);assert.equal(next.assets.sentBubbleGroup,undefined);assert.deepEqual(next.nativeNinePatch,p.nativeNinePatch);const after=await compile(next,root);for(const [name,buffer] of Object.entries(before.files))assert.deepEqual(after.files[name],buffer,name);assert.equal((await migrateAssetReferences(root,next)).changed,0);assert.ok(await readAsset(root,ref));assertValid(next);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('a full template with deeply nested names backs up and restores with metadata, including native guides',async()=>{
 const root=await fixture(),restored=await fixture();try{const editor=makeEditorService(root);let p=newProject();p=(await editor.applyResources(p,await editor.bulkItems({zip:(await editor.resourceTemplate(p)).toString('base64')}))).project;assert.equal(Object.keys(p.resourceOverrides).length,146);const before=await compile(p,root),archive=await createProjectArchive(p,root),parsed=await readProjectArchive(archive);assert.equal(parsed.formatVersion,3);assert.equal(parsed.assets.size,146);const q=await importProject(archive,restored);assert.deepEqual(q.assetHashes,p.assetHashes);const after=await compile(q,restored);for(const f of CATALOG.files)assert.deepEqual(after.files[f.path],before.files[f.path],f.path);
 const zip=await JSZip.loadAsync(archive);assert.equal(Object.keys(zip.files).length,148);assert.ok(!Object.keys(zip.files).some(n=>n.endsWith('index.json')));const ref=Object.values(q.resourceOverrides)[0];await fs.unlink(path.join(restored,'assets/index.json'));await assert.rejects(()=>readAsset(restored,ref),/검증 정보/);await assert.rejects(()=>createProjectArchive(q,restored),/검증 정보/);
 }finally{await fs.rm(root,{recursive:true,force:true});await fs.rm(restored,{recursive:true,force:true});}
});
test('old format 1 and 2 archives import into named, independent project files',async()=>{
 const root=await fixture(),target=await fixture();let store;try{const p=newProject(),bytes=await image('#112233');p.assets.profile=await legacy(root,bytes);const v1=new JSZip();v1.file('theme.json',JSON.stringify(p));v1.file(p.assets.profile,bytes);const v2=await JSZip.loadAsync(await createProjectArchive(p,root)),manifestName=Object.keys(v2.files).find(n=>n.endsWith('/backup.json')),manifest=JSON.parse(await v2.file(manifestName).async('string'));manifest.version=2;v2.file(manifestName,JSON.stringify(manifest));store=await openProjectStore(target);
 for(const [zip,version] of [[v1,1],[v2,2]]){const archive=await zip.generateAsync({type:'nodebuffer'});assert.equal((await readProjectArchive(archive)).formatVersion,version);const q=await store.import(archive,{asNew:true});assert.equal(q.assets.profile,'assets/common/profiles/default-1-v0001.png');assert.deepEqual(await readAsset(await store.rootFor(q),q.assets.profile),bytes);}
 }finally{await store?.close();await fs.rm(root,{recursive:true,force:true});await fs.rm(target,{recursive:true,force:true});}
});
