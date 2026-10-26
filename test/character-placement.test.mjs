import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {ROOT,newProject,compile,atomic,sha,validate,cloneProject,exportProject,importProject} from '../src/core.mjs';
import {bubbleGeometry,adaptBubbleGuides} from '../public/bubble-model.js';
import {makeEditorService} from '../src/editor-service.mjs';
const fixture=()=>{const p=newProject('캐릭터 위치 회귀');p.bubble={radius:18,paddingX:13,paddingY:7,stretchX:23,stretchY:22};p.assets.sentBubbleDecoration=p.assets.receivedBubbleDecoration='assets/'+ 'a'.repeat(64)+'.png';p.bubbleDesign={sent:{body:'color',size:32,applyTo:'all'},received:{body:'color',size:32,applyTo:'all'}};return p;};
test('placement never changes body size or internal text padding, including both anchors, flows and safety limits',()=>{
 for(const body of ['color','image'])for(const who of ['sent','received'])for(const group of [false,true])for(const size of [12,32,72])for(const radius of [0,18]){
  const p=fixture();p.bubbleDesign[who]={body,size,radius,applyTo:'all'};const initial=bubbleGeometry(p,who,group);
  for(const anchor of ['left','right'])for(const shiftX of [-72,-20,0,72])for(const placementY of [-24,0,24]){const target=group?(p.bubbleDesign[who].group??={}):p.bubbleDesign[who];Object.assign(target,{anchor,shiftX,placementY});const g=bubbleGeometry(p,who,group);assert.deepEqual([g.bodyWidth,g.bodyHeight,g.bodyInsets],[initial.bodyWidth,initial.bodyHeight,initial.bodyInsets]);assert.equal(g.insets[1]-g.bodyRect.x,g.bodyInsets[1]);assert.equal(g.insets[0]-g.header,g.bodyInsets[0]);assert.ok(g.decoration.x>=0&&g.decoration.x+size<=g.width);assert.ok(g.decoration.y+size<g.stretch[1]);assert.ok(g.decoration.x+size<g.stretch[0]||g.decoration.x>g.stretch[0]+1);assert.ok(size-g.header<=g.bodyInsets[0]);}
 }
});
test('iOS manual guides retain body-relative padding and geometry through move, overlap and reset',()=>{
 const p=fixture();p.overrides={ios:{'MessageCellStyle-Send/-ios-background-image':[20,60],'MessageCellStyle-Send/-ios-title-edgeinsets':[50,28,14,29]}};const a=bubbleGeometry(p,'sent');
 for(const next of [{shiftX:-20,placementY:-7},{shiftX:0,placementY:24},{shiftX:-40,placementY:-7,anchor:'left'},{shiftX:0,placementY:4,anchor:'right'}]){const before=structuredClone(p);Object.assign(p.bubbleDesign.sent,next);adaptBubbleGuides(p,before,'sent');const g=bubbleGeometry(p,'sent'),v=p.overrides.ios['MessageCellStyle-Send/-ios-title-edgeinsets'];assert.deepEqual([g.bodyWidth,g.bodyHeight,g.bodyInsets],[a.bodyWidth,a.bodyHeight,a.bodyInsets]);assert.deepEqual([v[0]-g.header,v[1]-g.bodyRect.x,v[2],v[3]-(g.width-g.bodyRect.x-g.bodyWidth)],[14,28,14,29]);assert.equal(validate(p).filter(x=>x.severity==='error').length,0);}
});
test('overlapping alpha layers preserve transparent body pixels and promotion excludes the character; fields round-trip',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/placement-unit-')),p=fixture();const character=await sharp(Buffer.from('<svg width="32" height="32"><rect x="4" y="4" width="24" height="28" fill="#ff0000" fill-opacity="0.5"/></svg>')).png().toBuffer(),ref='assets/'+sha(character)+'.png';await atomic(path.join(root,ref),character);p.assets.sentBubbleDecoration=p.assets.receivedBubbleDecoration=ref;Object.assign(p.bubbleDesign.sent,{color:'#0000ff',shiftX:-16,placementY:-7,layer:'front'});const editor=makeEditorService(root),g=bubbleGeometry(p,'sent'),file='ios/Images/chatroomBubbleSend01@2x.png';
 const front=(await compile(p,root)).files[file],at=(bytes,x,y)=>{const img=PNG.sync.read(bytes),i=(y*img.width+x)*4;return [...img.data.subarray(i,i+4)];};const x=Math.round(g.decoration.x+8)*2,y=(g.header+6)*2;const mixed=at(front,x,y);assert.ok(mixed[0]>100&&mixed[2]>100);assert.equal(mixed[3],255);
 p.bubbleDesign.sent.layer='back';const back=(await compile(p,root)).files[file];assert.deepEqual(at(back,x,y),[0,0,255,255]);p.bubbleDesign.sent.layer='front';
 const promoted=await editor.promoteResource(p,{file,slot:'sentBubble'});const image=PNG.sync.read(await fs.readFile(path.join(root,promoted.project.assets.sentBubble)));for(let i=0;i<image.data.length;i+=4)assert.equal(image.data[i],0,'red decoration must never be baked into the body source');
 assert.deepEqual(cloneProject(p).bubbleDesign,p.bubbleDesign);assert.deepEqual((await importProject(await exportProject(p,root),root)).bubbleDesign,p.bubbleDesign);const before=(await editor.preview(p)).revision;p.bubbleDesign.sent.placementY=-6;assert.notEqual((await editor.preview(p)).revision,before);
 for(const [key,value] of [['shiftX',73],['placementY',-25],['layer','invalid']]){const invalid=structuredClone(p);invalid.bubbleDesign.sent[key]=value;assert.ok(validate(invalid).some(e=>e.field==='bubbleDesign.sent.'+key));}
});
