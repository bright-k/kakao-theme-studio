import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {PNG} from 'pngjs';
import JSZip from 'jszip';
import {newProject,compile,validate,cloneProject,exportProject,importProject,makeKtheme} from '../src/core.mjs';
import {makeEditorService} from '../src/editor-service.mjs';
import {publicCatalog} from '../src/catalog.mjs';
import {iosBubbleGeometry} from '../public/bubble-model.js';

test('custom iOS bubble sizes preserve every state and scale, guides, cache and portable assets',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'ios-bubble-size-'));try{
  let p=newProject();const editor=makeEditorService(root),expected=new Map();
  for(const who of ['Send','Receive'])for(const group of [false,true])for(const selected of [false,true]){
   const name=`chatroomBubble${who}0${group?2:1}${selected?'Selected':''}`,id='ios/'+name+'.png',prefix='MessageCellStyle-'+who+'/-ios-'+(group?'group-':'');p.resourceOptions??={};p.resourceOptions[id]={logicalSize:[72,81]};
   for(const scale of [2,3]){const image=new PNG({width:72*scale,height:81*scale});for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const i=(y*image.width+x)*4;if(y>=46*scale){image.data[i]=selected?190:245;image.data[i+1]=210;image.data[i+2]=225;image.data[i+3]=255;}if(x>=2*scale&&x<45*scale&&y>=2*scale&&y<50*scale){image.data[i]=30;image.data[i+1]=200;image.data[i+2]=90;image.data[i+3]=255;}}const file='ios/Images/'+name+'@'+scale+'x.png';expected.set(file,image);p=(await editor.singleResource(p,{file,base64:PNG.sync.write(image).toString('base64')})).project;}
   p.overrides??={};p.overrides.ios??={};p.overrides.ios[prefix+(selected?'selected-':'')+'background-image']=[55,62];p.overrides.ios[prefix+'title-edgeinsets']=[56,16,10,17];
  }
  assert.deepEqual(validate(p).filter(d=>d.severity==='error'),[]);const c=await compile(p,root),preview=await editor.preview(p);for(const[file,image]of expected){const output=PNG.sync.read(c.files[file]);assert.deepEqual([output.width,output.height],[image.width,image.height]);assert.deepEqual(output.data,image.data);assert.deepEqual(preview.files[file].logical,{width:72,height:81});assert.equal(preview.files[file].composition,null);assert.match(preview.files[file].source.transform,/72×81/);}
  assert.deepEqual(c.styles.ios['MessageCellStyle-Receive/-ios-title-edgeinsets'],[56,16,10,17]);assert.deepEqual(c.styles.ios['MessageCellStyle-Send/-ios-group-selected-background-image'],[55,62]);assert.equal(iosBubbleGeometry(p,'chatroomBubbleReceive01.png').height,81);
  const restored=await importProject(await exportProject(p,root),root);assert.deepEqual(restored.resourceOptions,p.resourceOptions);assert.deepEqual(cloneProject(p).resourceOptions,p.resourceOptions);const archive=await JSZip.loadAsync(await makeKtheme(c));assert.equal(PNG.sync.read(await archive.file('Images/chatroomBubbleReceive01@3x.png').async('nodebuffer')).height,243);
  const legacy=structuredClone(p);delete legacy.resourceOptions;delete legacy.overrides;const old=await compile(legacy,root);assert.notEqual(c.visualRevision,old.visualRevision);for(const[file]of expected){const image=PNG.sync.read(old.files[file]),scale=file.includes('@2x')?2:3;assert.deepEqual([image.width,image.height],[64*scale,56*scale]);}for(const[file,bytes]of Object.entries(c.files))if(file.startsWith('android/'))assert.ok(bytes.equals(old.files[file]),file);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('logical size is restricted to valid iOS bubble resources and bounds guide inputs',()=>{
 for(const[id,size]of [['ios/profileImg01.png',[72,81]],['android/theme_chatroom_bubble_you_01_image.9.png',[72,81]],['ios/chatroomBubbleReceive01.png',[0,81]],['ios/chatroomBubbleReceive01.png',[72.5,81]],['ios/chatroomBubbleReceive01.png',[72,1025]],['ios/chatroomBubbleReceive01.png',[72]],['ios/chatroomBubbleReceive01.png','72x81']]){const p=newProject();p.resourceOptions={[id]:{logicalSize:size}};assert.ok(validate(p).some(d=>d.severity==='error'&&d.field.startsWith('resourceOptions')),JSON.stringify({id,size}));}
 const p=newProject();p.resourceOptions={'ios/chatroomBubbleReceive01.png':{logicalSize:[72,81]}};assert.equal(iosBubbleGeometry(p,'chatroomBubbleReceive01.png').width,64);p.resourceOverrides={'ios/Images/chatroomBubbleReceive01@2x.png':'assets/'+'a'.repeat(64)+'.png'};p.overrides={ios:{'MessageCellStyle-Receive/-ios-title-edgeinsets':[56,16,10,17],'MessageCellStyle-Receive/-ios-background-image':[55,62]}};assert.deepEqual(validate(p).filter(d=>d.severity==='error'),[]);p.overrides.ios['MessageCellStyle-Receive/-ios-background-image']=[72,62];assert.ok(validate(p).some(d=>d.severity==='error'&&d.field.endsWith('background-image')));
 assert.equal(publicCatalog().resources.filter(r=>r.logicalSizeEditable).length,8);
});
