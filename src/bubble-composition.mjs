import sharp from 'sharp';
import {PNG} from 'pngjs';
import {bubbleConfig,bubbleGeometry} from '../public/bubble-model.js';
// Extend only the body stretch strips; fixed artwork and corners retain their size.
function stretchBody(raw,width,scale,stretchX){
 const input=PNG.sync.read(raw),output=new PNG({width:width*scale,height:input.height}),cut=Math.min(input.width-1,stretchX*scale),extra=output.width-input.width;
 for(let y=0;y<input.height;y++)for(let x=0;x<output.width;x++){const sx=x<cut?x:x<cut+extra?cut:x-extra;input.data.copy(output.data,(y*output.width+x)*4,(y*input.width+sx)*4,(y*input.width+sx)*4+4);}return PNG.sync.write(output);
}
export async function composeBubble(p,who,scale,selected,first,assetRoot,{asset,legacy}){
 const cfg=bubbleConfig(p,who,!first),g=bubbleGeometry(p,who,!first),base=who+'Bubble';
 let body;
 if(cfg.body==='color'){
  const r=cfg.radius,color=cfg.color,tail=cfg.tail?`<path d="${who==='sent'?'M52 39 64 54 47 48':'M12 39 0 54 17 48'}" fill="${color}"/>`:'';
  body=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="56"><rect x="2" y="2" width="60" height="52" rx="${r}" fill="${color}"/>${tail}</svg>`)).resize(64*scale,56*scale).png().toBuffer();if(selected)body=await sharp(body).modulate({brightness:.88}).png().toBuffer();
 }else body=await legacy(p,who,scale,selected,first,assetRoot);
 if(g.width!==64)body=stretchBody(body,g.width,scale,p.bubble.stretchX);
 if(!g.decorated)return body;
 const decoration=await asset(p,cfg.decorationSlot,assetRoot),s=cfg.size*scale;
 const character=await sharp(decoration).resize(s,s,{fit:'contain',background:'#00000000'}).png().toBuffer();
 return sharp({create:{width:g.width*scale,height:g.height*scale,channels:4,background:'#00000000'}}).composite([{input:body,left:0,top:g.header*scale},{input:character,left:g.decoration.x*scale,top:0}]).png().toBuffer();
}
