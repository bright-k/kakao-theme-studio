import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {PNG} from 'pngjs';
import {CATALOG,logicalResource} from '../src/catalog.mjs';
import sharp from 'sharp';
import {newProject,compile,atomic,sha,exportProject,importProject,cloneProject} from '../src/core.mjs';
import {bubbleGeometry} from '../public/bubble-model.js';
import {BACKGROUNDS,setBackgroundMode,backgroundMode} from '../public/background-model.js';
import {hexToHSV,hsvToHex,replaceRGB} from '../public/hex-color.js';

test('HEX edits preserve ARGB alpha; HSV controls round-trip representative colors',()=>{
 assert.equal(replaceRGB('#80112233','#aabbcc'),'#80aabbcc');assert.equal(replaceRGB('#112233','#aabbcc'),'#aabbcc');
 for(const hex of ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#7C93BA','#FFAA55'])assert.equal(hsvToHex(...hexToHSV(hex)),hex);
});
test('all four solid background modes preserve sources/options/exceptions and serialize without images',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-background-'));try{
  const p=newProject(),bytes=await sharp({create:{width:4,height:4,channels:4,background:'#AA3355'}}).png().toBuffer(),ref='assets/'+sha(bytes)+'.png';await atomic(path.join(root,ref),bytes);
  p.overrides={ios:{'BackgroundStyle-ChatRoom/background-color':'#345678'}};
  for(const [slot,spec] of Object.entries(BACKGROUNDS)){p.assets[slot]=ref;p.commonColors??={};p.commonColors[spec.color]='#123456';p.resourceOptions??={};p.resourceOptions[spec.resources[0]]={fit:'contain',focalX:.3};setBackgroundMode(p,slot,'color');assert.equal(backgroundMode(p,slot),'color');}
  const c=await compile(p,root);assert.equal(c.coverage.complete,true);assert.equal(c.styles.ios['BackgroundStyle-ChatRoom/background-color'],'#345678');assert.equal(c.styles.android.theme_chatroom_background_color,'#123456');for(const {resources} of Object.values(BACKGROUNDS))for(const id of resources)for(const file of CATALOG.files.filter(f=>logicalResource(f)===id))assert.ok(!c.files[file.path],file.path);
  const restored=await importProject(await exportProject(p,root),root);assert.deepEqual(restored.resourceOptions,p.resourceOptions);assert.deepEqual(cloneProject(p).commonColors,p.commonColors);
  for(const slot of Object.keys(BACKGROUNDS))setBackgroundMode(p,slot,'image');const image=await compile(p,root);assert.equal(image.coverage.emitted,150);assert.equal(p.resourceOptions['ios/mainBgImage.png'].fit,'contain');assert.equal(p.assets.chatBackground,ref);const png=PNG.sync.read(image.files['ios/Images/chatroomBgImage@2x.png']),center=(Math.floor(png.height/2)*png.width+Math.floor(png.width/2))*4;assert.deepEqual([...png.data.subarray(center,center+3)],[170,51,85]);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('unsafe manual iOS guides protect composed characters/text and leave stored or final-image guides intact',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-ios-safe-'));try{
  const p=newProject(),bytes=await sharp({create:{width:32,height:32,channels:4,background:'#EC1234'}}).png().toBuffer(),ref='assets/'+sha(bytes)+'.png';await atomic(path.join(root,ref),bytes);
  for(const who of ['sent','received']){p.assets[who+'BubbleDecoration']=ref;p.bubbleDesign??={};p.bubbleDesign[who]={body:'color',size:32};}p.overrides={ios:{}};
  for(const who of ['sent','received'])for(const group of [false,true]){if(group)p.bubbleDesign[who].group={decorationMode:'shared'};const pre='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':'');p.overrides.ios[pre+'background-image']=[10,10];p.overrides.ios[pre+'selected-background-image']=[11,11];p.overrides.ios[pre+'title-edgeinsets']=[2,4,3,4];}
  const before=structuredClone(p.overrides),c=await compile(p,root);
  for(const who of ['sent','received'])for(const group of [false,true]){const g=bubbleGeometry(p,who,group),pre='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':'');for(const selected of [false,true]){const [x,y]=c.styles.ios[pre+(selected?'selected-':'')+'background-image'];assert.ok(x>=g.decoration.x+32||x+1<=g.decoration.x);assert.ok(y>32&&y>=g.header);}const [t,l,b,r]=c.styles.ios[pre+'title-edgeinsets'];assert.ok(t>=g.header);assert.ok(l+r>=g.width-2);assert.ok(t+b+16>=g.height-1);}
  assert.deepEqual(p.overrides,before);p.resourceOverrides={'ios/Images/chatroomBubbleSend01@2x.png':ref};const final=await compile(p,root);assert.deepEqual(final.styles.ios['MessageCellStyle-Send/-ios-background-image'],[10,10]);assert.deepEqual(final.styles.ios['MessageCellStyle-Send/-ios-title-edgeinsets'],[2,4,3,4]);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
