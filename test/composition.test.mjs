import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {ROOT,newProject,compile,bubbleImage,atomic,sha,exportProject,importProject,cloneProject,validate} from '../src/core.mjs';
import {makeEditorService} from '../src/editor-service.mjs';
import {readNinePatch,patchImage} from '../src/resources.mjs';
import {resourceSource} from '../src/provenance.mjs';
import {CATALOG,publicCatalog} from '../src/catalog.mjs';
import {bubbleGeometry} from '../public/bubble-model.js';
const pixel=(buf,x,y)=>{const p=PNG.sync.read(buf);return [...p.data.subarray((y*p.width+x)*4,(y*p.width+x)*4+4)];};
async function fixture(){await fs.mkdir(path.join(ROOT,'.test-data'),{recursive:true});const root=await fs.mkdtemp(path.join(ROOT,'.test-data/composition-')),p=newProject();async function asset(slot,color,width=32,height=16){const bytes=await sharp({create:{width,height,channels:4,background:color}}).png().toBuffer(),ref='assets/'+sha(bytes)+'.png';await atomic(path.join(root,ref),bytes);p.assets[slot]=ref;return ref;}return {root,p,asset};}
test('independent color/image bodies compose a fixed, aspect-preserved character on both platforms',async()=>{
 const {root,p,asset}=await fixture();try{
 await asset('sentBubbleDecoration','#EC1234');await asset('receivedBubbleDecoration','#EC1234');await asset('sentBubble','#1255AA',64,56);await asset('receivedBubble','#1255AA',64,56);
 for(const body of ['color','image'])for(const anchor of ['left','right']){
  p.bubbleDesign={sent:{body,color:'#228844',size:40,gap:6,offset:4,anchor,applyTo:'all'},received:{body,color:'#228844',size:40,gap:6,offset:4,anchor,applyTo:'first'}};
  const c=await compile(p,root);for(const who of ['sent','received'])for(const group of [false,true]){
   const g=bubbleGeometry(p,who,group),name=`chatroomBubble${who==='sent'?'Send':'Receive'}0${group?2:1}`;for(const scale of [2,3]){
    const png=c.files[`ios/Images/${name}@${scale}x.png`],im=PNG.sync.read(png);assert.equal(im.width,g.width*scale);assert.equal(im.height,g.height*scale);
    assert.deepEqual(pixel(png,Math.floor(im.width/2),(g.header+30)*scale),body==='color'?[34,136,68,255]:[18,85,170,255]);
    if(g.decorated){assert.deepEqual(pixel(png,(g.decoration.x+20)*scale,20*scale),[236,18,52,255]);assert.equal(pixel(png,(g.decoration.x+20)*scale,2*scale)[3],0);assert.ok(g.stretch[0]<g.decoration.x||g.stretch[0]>g.decoration.x+g.decoration.width);}
   }
   const af=`android/res/drawable-xxhdpi/theme_chatroom_bubble_${who==='sent'?'me':'you'}_0${group?2:1}_image.9.png`,guide=readNinePatch(c.files[af]);assert.deepEqual(guide.insets,g.insets.map(x=>x*3));assert.deepEqual(guide.stretchY,[[g.stretch[1]*3,(g.stretch[1]+1)*3]]);
   const prefix='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-';assert.deepEqual(c.styles.ios[prefix+(group?'group-':'')+'title-edgeinsets'],g.insets);
   const source=resourceSource(p,CATALOG.files.find(f=>f.path===af));assert.equal(source.kind,g.decorated?'composite':body==='image'?'common':'generated');if(g.decorated)assert.equal(source.components.decoration.ref,p.assets[who+'BubbleDecoration']);
  }
 }
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('composition survives cache, history-sized snapshots, clone and portable backup while exceptions retain their pixels',async()=>{
 const {root,p,asset}=await fixture();try{
 await asset('sentBubbleDecoration','#EC1234');const original=await asset('sentBubble','#1255AA',64,56);p.bubbleDesign={sent:{body:'color',color:'#228844'}};const editor=makeEditorService(root),a=await editor.preview(p);p.bubbleDesign.sent.size=48;const b=await editor.preview(p);assert.notEqual(a.revision,b.revision);assert.notEqual(a.files[a.ios.sent].hash,b.files[b.ios.sent].hash);
 const file='ios/Images/chatroomBubbleSend01@2x.png';p.resourceOverrides={[file]:original};const c=await compile(p,root);assert.deepEqual(pixel(c.files[file],30,30),[18,85,170,255]);assert.equal(resourceSource(p,CATALOG.files.find(f=>f.path===file)).kind,'override');
 const restored=await importProject(await exportProject(p,root),root);assert.deepEqual(restored,p);assert.deepEqual(cloneProject(p).bubbleDesign,p.bubbleDesign);assert.equal((await compile(restored,root)).coverage.complete,true);
 const copy=structuredClone(p);delete copy.resourceOverrides[file];copy.bubbleDesign.sent.body='image';const d=await compile(copy,root);assert.deepEqual(pixel(d.files[file],60,170),[18,85,170,255]);assert.equal(copy.assets.sentBubble,original);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('promoting a native NinePatch shares only inner artwork and retains original exception and guides',async()=>{
 const {root,p}=await fixture();try{const raw=await sharp({create:{width:64,height:56,channels:4,background:'#224466'}}).png().toBuffer(),bytes=patchImage(raw),ref='assets/'+sha(bytes)+'.png',file='android/res/drawable-xxhdpi/theme_chatroom_bubble_me_01_image.9.png';await atomic(path.join(root,ref),bytes);p.resourceOverrides={[file]:ref};p.nativeNinePatch=[file];const editor=makeEditorService(root),r=await editor.promoteResource(p,{file,slot:'sentBubble'});assert.equal(r.project.resourceOverrides[file],ref);assert.deepEqual(r.project.nativeNinePatch,[file]);const image=PNG.sync.read(await fs.readFile(path.join(root,r.project.assets.sentBubble)));assert.equal(image.width,64);assert.equal(image.height,56);assert.equal(image.data[3],255);assert.ok(publicCatalog().commonSources.find(x=>x.slot==='sentBubbleDecoration').platforms.includes('ios'));await assert.rejects(()=>editor.promoteResource(p,{file,slot:'chatBackground'}));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('composition rejects invalid inputs and accepts content guides in the expanded logical size',()=>{
 const p=newProject();p.bubbleDesign={sent:{size:999,anchor:'center',body:'image',unknown:true}};assert.ok(validate(p).some(x=>x.field.startsWith('bubbleDesign')));p.bubbleDesign={sent:{body:'color',size:48}};p.assets.sentBubbleDecoration='assets/'+'a'.repeat(64)+'.png';p.overrides={ios:{'MessageCellStyle-Send/-ios-title-edgeinsets':[62,14,10,14]}};assert.equal(validate(p).filter(x=>x.severity==='error').length,0);p.overrides.ios['MessageCellStyle-Send/-ios-title-edgeinsets']=[999,14,10,14];assert.ok(validate(p).some(x=>x.field.includes('title-edgeinsets')));
});
test('manual iOS guides follow changing decoration headers and remain valid when disabled',async()=>{
 const {adaptBubbleGuides}=await import('../public/bubble-model.js');const p=newProject();p.assets.sentBubbleDecoration='assets/'+'a'.repeat(64)+'.png';p.overrides={ios:{'MessageCellStyle-Send/-ios-background-image':[35,27],'MessageCellStyle-Send/-ios-title-edgeinsets':[11,14,10,14]}};let before=structuredClone(p);p.bubbleDesign={sent:{body:'color',size:72}};adaptBubbleGuides(p,before,'sent');assert.equal(validate(p).filter(x=>x.severity==='error').length,0);const g=bubbleGeometry(p,'sent');assert.ok(p.overrides.ios['MessageCellStyle-Send/-ios-background-image'][0]<g.decoration.x);assert.equal(p.overrides.ios['MessageCellStyle-Send/-ios-title-edgeinsets'][0],87);before=structuredClone(p);p.bubbleDesign.sent.decorationEnabled=false;adaptBubbleGuides(p,before,'sent');assert.equal(p.overrides.ios['MessageCellStyle-Send/-ios-title-edgeinsets'][0],11);assert.equal(validate(p).filter(x=>x.severity==='error').length,0);
});
test('first and continuous bubbles have independent optional bodies and character resources',async()=>{
 const {root,p,asset}=await fixture();try{
 const firstRef=await asset('receivedBubbleDecoration','#EE2222'),groupRef=await asset('receivedBubbleGroupDecoration','#2244EE');await asset('receivedBubbleGroup','#BB8822',64,56);p.bubbleDesign={received:{body:'color',color:'#228844',size:32,group:{body:'image',decorationMode:'separate',size:24,gap:2,anchor:'right'}}};
 let c=await compile(p,root);const first='ios/Images/chatroomBubbleReceive01@2x.png',group='ios/Images/chatroomBubbleReceive02@2x.png',g=bubbleGeometry(p,'received',true);assert.notEqual(bubbleGeometry(p,'received').height,g.height);assert.deepEqual(pixel(c.files[group],30,(g.header+30)*2),[187,136,34,255]);assert.deepEqual(pixel(c.files[group],(g.decoration.x+12)*2,12*2),[34,68,238,255]);assert.equal(resourceSource(p,CATALOG.files.find(f=>f.path===group)).components.decoration.ref,groupRef);assert.equal(resourceSource(p,CATALOG.files.find(f=>f.path===first)).components.decoration.ref,firstRef);
 p.bubbleDesign.received.decorationEnabled=false;c=await compile(p,root);assert.equal(PNG.sync.read(c.files[first]).height,bubbleGeometry(p,'received').height*2);assert.equal(PNG.sync.read(c.files[group]).height,g.height*2);p.bubbleDesign.received.group.decorationMode='none';c=await compile(p,root);assert.equal(PNG.sync.read(c.files[group]).height,bubbleGeometry(p,'received',true).height*2);assert.equal(p.assets.receivedBubbleGroupDecoration,groupRef);const restored=await importProject(await exportProject(p,root),root);assert.deepEqual(restored.bubbleDesign,p.bubbleDesign);assert.equal(restored.assets.receivedBubbleGroupDecoration,groupRef);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('promoting a padded character bubble removes only added stretch strips and preserves body artwork pixels',async()=>{
 const {root,p,asset}=await fixture();try{
  await asset('sentBubbleDecoration','#EC1234');const image=new PNG({width:64,height:56});for(let y=0;y<56;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4;image.data.set([x*3,y*4,(x+y)*2,255],i);}const body=PNG.sync.write(image),ref='assets/'+sha(body)+'.png';await atomic(path.join(root,ref),body);p.assets.sentBubble=ref;p.bubbleDesign={sent:{body:'image',size:48}};const editor=makeEditorService(root),result=await editor.promoteResource(p,{file:'ios/Images/chatroomBubbleSend01@2x.png',slot:'sentBubble'}),promoted=PNG.sync.read(await fs.readFile(path.join(root,result.project.assets.sentBubble))),expected=PNG.sync.read(await sharp(body).resize(128,112,{fit:'fill'}).png().toBuffer());assert.deepEqual([promoted.width,promoted.height],[128,112]);assert.deepEqual(promoted.data,expected.data);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('compact color bodies promote with their corners and tail intact at either character anchor',async()=>{
 const {root,p,asset}=await fixture();try{
  await asset('sentBubbleDecoration','#EC1234');p.palette.sent='#1255AA';p.bubble.radius=18;const expected=PNG.sync.read(await bubbleImage(p,'sent',2,false,true,root));const editor=makeEditorService(root);
  for(const anchor of ['left','right'])for(const size of [12,72]){p.bubbleDesign={sent:{body:'color',color:'#1255AA',radius:18,anchor,size}};const result=await editor.promoteResource(p,{file:'ios/Images/chatroomBubbleSend01@2x.png',slot:'sentBubble'}),actual=PNG.sync.read(await fs.readFile(path.join(root,result.project.assets.sentBubble)));assert.deepEqual(actual.data,expected.data,anchor+' '+size);}
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
