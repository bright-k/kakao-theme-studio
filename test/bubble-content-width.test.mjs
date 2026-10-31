import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {PNG} from 'pngjs';
import {newProject,atomic,sha,compile} from '../src/core.mjs';
import {bubbleGeometry} from '../public/bubble-model.js';
import {readNinePatch} from '../src/resources.mjs';
import {messageLayout} from '../public/preview-renderer.js';
test('short/long preview layout preserves body padding and keeps the complete outward character inside the viewport',()=>{
 const p=newProject(),ctx={measureText:s=>({width:s.length*8})};p.bubble={radius:18,paddingX:13,paddingY:7,stretchX:23,stretchY:22};p.assets.sentBubble=p.assets.receivedBubble='assets/'+ 'a'.repeat(64)+'.png';p.assets.sentBubbleDecoration=p.assets.receivedBubbleDecoration='assets/'+ 'b'.repeat(64)+'.png';
 for(const who of ['sent','received'])for(const body of ['color','image'])for(const size of [12,32,72])for(const anchor of ['left','right'])for(const shiftX of [0,-20,-72]){p.bubbleDesign={[who]:{body,size,anchor,shiftX}};const g=bubbleGeometry(p,who);for(const text of ['가','그러니까!!','긴 메시지의 줄바꿈과 가장자리 잘림을 확인합니다. '.repeat(8)]){const layout=messageLayout(ctx,text,{insets:g.insets,geometry:g,logical:g,out:who==='sent'});assert.ok(layout.x>=0&&layout.x+layout.width<=390);assert.ok(layout.width>=g.width-1);assert.equal(layout.height-g.header,layout.lines.length*23+g.bodyInsets[0]+g.bodyInsets[2]);for(const line of layout.lines)assert.ok(ctx.measureText(line).width+g.insets[1]+g.insets[3]<=layout.width);}}
});
test('character size/anchor/on-off never widens the body or its internal content padding',()=>{
 const p=newProject();p.assets.sentBubble=p.assets.receivedBubble='assets/'+ 'a'.repeat(64)+'.png';p.assets.sentBubbleDecoration=p.assets.receivedBubbleDecoration='assets/'+ 'b'.repeat(64)+'.png';
 for(const body of ['color','image'])for(const who of ['sent','received'])for(const group of [false,true])for(const radius of [0,18])for(const [paddingX,paddingY] of [[4,4],[13,7],[24,18]]){
  Object.assign(p.bubble,{radius,paddingX,paddingY});p.bubbleDesign={[who]:{body,tail:false,decorationEnabled:false,group:{tail:false,decorationMode:'none'}}};const off=bubbleGeometry(p,who,group);
  for(const size of [12,32,72])for(const anchor of ['left','right']){Object.assign(p.bubbleDesign[who],{size,anchor,decorationEnabled:true,group:{tail:false,decorationMode:'shared'}});const on=bubbleGeometry(p,who,group);assert.deepEqual([on.bodyWidth,on.bodyHeight,on.bodyInsets],[off.bodyWidth,off.bodyHeight,off.bodyInsets],JSON.stringify({body,who,group,radius,paddingX,size,anchor}));assert.ok(on.insets[1]+on.insets[3]+1>=on.width-1);assert.ok(on.decoration.x>=0&&on.decoration.x+size<=on.width);assert.ok(on.decoration.x+size<on.stretch[0]||on.decoration.x>on.stretch[0]+1);}
 }
});
test('real source body pixels and exported body-relative padding are identical with the character off/on',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-content-width-'));try{
  const p=newProject();p.bubble={radius:18,paddingX:13,paddingY:7,stretchX:23,stretchY:22};const bytes=await sharp({create:{width:32,height:16,channels:4,background:'#EC1234'}}).png().toBuffer(),ref='assets/'+sha(bytes)+'.png';await atomic(path.join(root,ref),bytes);p.assets.sentBubbleDecoration=p.assets.receivedBubbleDecoration=ref;
  const body=await sharp({create:{width:64,height:56,channels:4,background:'#228844'}}).png().toBuffer(),bodyRef='assets/'+sha(body)+'.png';await atomic(path.join(root,bodyRef),body);p.assets.sentBubble=p.assets.receivedBubble=bodyRef;
  for(const mode of ['color','image'])for(const size of [12,32,72])for(const anchor of ['left','right']){
   p.bubbleDesign=Object.fromEntries(['sent','received'].map(who=>[who,{body:mode,color:'#228844',tail:false,size,anchor,decorationEnabled:false,group:{decorationMode:'none'}}]));const off=await compile(p,root);for(const who of ['sent','received'])Object.assign(p.bubbleDesign[who],{decorationEnabled:true,group:{decorationMode:'shared'}});const on=await compile(p,root);
   for(const who of ['sent','received'])for(const group of [false,true])for(const scale of [2,3]){const g=bubbleGeometry(p,who,group),file=scale===2?`ios/Images/chatroomBubble${who==='sent'?'Send':'Receive'}0${group?2:1}@2x.png`:`android/res/drawable-xxhdpi/theme_chatroom_bubble_${who==='sent'?'me':'you'}_0${group?2:1}_image.9.png`,a=PNG.sync.read(off.files[file]),b=PNG.sync.read(on.files[file]),border=scale===2?0:1;for(let y=0;y<g.bodyHeight*scale;y++){const ai=((y+border)*a.width+border)*4,bi=((y+border+g.header*scale)*b.width+border+g.bodyRect.x*scale)*4;assert.deepEqual(b.data.subarray(bi,bi+g.bodyWidth*scale*4),a.data.subarray(ai,ai+g.bodyWidth*scale*4));}
    const pre='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':''),i=scale===2?on.styles.ios[pre+'title-edgeinsets']:readNinePatch(on.files[file]).insets.map(n=>n/scale),j=scale===2?off.styles.ios[pre+'title-edgeinsets']:readNinePatch(off.files[file]).insets.map(n=>n/scale);assert.deepEqual([i[0]-g.header,i[1]-g.bodyRect.x,i[2],i[3]-(g.width-g.bodyRect.x-g.bodyWidth)],j);
   }
  }
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
