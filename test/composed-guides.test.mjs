import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {ROOT,newProject,atomic,sha,compile,cloneProject,exportProject,importProject,validate} from '../src/core.mjs';
import {bubbleGeometry} from '../public/bubble-model.js';
import {resolveComposedGuides} from '../public/bubble-guides.js';
import {validGeometry} from '../public/geometry-model.js';
import {readNinePatch} from '../src/resources.mjs';
const file='android/res/drawable-xxhdpi/theme_chatroom_bubble_me_01_image.9.png';
const legacy={width:192,height:168,stretchX:[[69,70]],stretchY:[[66,67]],insets:[42,20,46,21]};
function fixture(){const p=newProject('가이드 회귀','dusk');p.bubble={radius:18,paddingX:13,paddingY:7,stretchX:23,stretchY:22};p.bubbleDesign={sent:{body:'color',color:'#558264',size:32,placementY:1}};p.assets.sentBubbleDecoration='assets/'+ 'a'.repeat(64)+'.png';return p;}
test('legacy body guides map into the real composed body, with fixed character and text protection',()=>{
 const p=fixture();const original=structuredClone(legacy);for(const who of ['sent','received'])for(const anchor of ['left','right'])for(const placementY of [-7,1,24])for(const shiftX of [0,-20]){p.bubbleDesign[who]={...p.bubbleDesign.sent,anchor,placementY,shiftX,applyTo:'all'};p.assets[who+'BubbleDecoration']=p.assets.sentBubbleDecoration;for(const group of [false,true]){const c=bubbleGeometry(p,who,group),g=resolveComposedGuides(legacy,c,3);assert.ok(validGeometry(g));assert.ok(g.insets[0]>=g.bodyRect.y);assert.ok(g.insets[2]>=g.height-g.bodyRect.y-g.bodyRect.height);for(const runs of [g.stretchX,g.stretchY])for(const [a,z] of runs){assert.equal(a%3,0);assert.equal(z%3,0);}for(const [a,z] of g.stretchY)assert.ok(a>=g.bodyRect.y&&a>c.decoration.height*3&&z<=g.bodyRect.y+g.bodyRect.height);for(const [a,z] of g.stretchX)assert.ok(z<=c.decoration.x*3||a>=(c.decoration.x+c.decoration.width)*3);assert.ok(g.insets[1]+g.insets[3]>=g.width-6);}}
 assert.deepEqual(legacy,original);
});
test('explicit body frames retain internal padding when the character header or outside gutter changes',()=>{
 const p=fixture(),base=bubbleGeometry(p,'sent'),first=resolveComposedGuides(legacy,base,3),padding=[first.insets[0]-first.bodyRect.y,first.insets[1]-first.bodyRect.x,first.insets[2],first.insets[3]];
 for(const anchor of ['left','right'])for(const placementY of [-7,0,24])for(const shiftX of [0,-20]){Object.assign(p.bubbleDesign.sent,{anchor,placementY,shiftX});const c=bubbleGeometry(p,'sent'),g=resolveComposedGuides(first,c,3),b=g.bodyRect;assert.deepEqual([g.insets[0]-b.y,g.insets[1]-b.x,g.insets[2]-(g.height-b.y-b.height),g.insets[3]-(g.width-b.x-b.width)],padding);}
 p.resourceGeometry={[file]:first};assert.equal(validate(p).filter(x=>x.severity==='error').length,0);assert.deepEqual(cloneProject(p).resourceGeometry,p.resourceGeometry);p.resourceGeometry[file].bodyRect.x=-1;assert.ok(validate(p).some(x=>x.field==='resourceGeometry.'+file));
});
test('generated PNG artwork stays identical while output guides are repaired; backup keeps original and framed records',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/composed-guides-')),p=fixture(),bytes=await sharp({create:{width:32,height:32,channels:4,background:'#ec1234'}}).png().toBuffer(),ref='assets/'+sha(bytes)+'.png';await atomic(path.join(root,ref),bytes);p.assets.sentBubbleDecoration=ref;const before=await compile(p,root);p.resourceGeometry={[file]:structuredClone(legacy)};const after=await compile(p,root),guide=readNinePatch(after.files[file]),c=bubbleGeometry(p,'sent');assert.ok(guide.insets[0]>=c.header*3);const a=PNG.sync.read(before.files[file]),b=PNG.sync.read(after.files[file]);for(let y=1;y<a.height-1;y++)assert.deepEqual(a.data.subarray((y*a.width+1)*4,(y*a.width+a.width-1)*4),b.data.subarray((y*b.width+1)*4,(y*b.width+b.width-1)*4));assert.deepEqual(p.resourceGeometry[file],legacy);
 for(const value of [legacy,resolveComposedGuides(legacy,c,3)]){p.resourceGeometry[file]=value;assert.deepEqual((await importProject(await exportProject(p,root),root)).resourceGeometry,p.resourceGeometry);}
});
