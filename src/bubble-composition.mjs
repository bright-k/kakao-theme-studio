import sharp from 'sharp';
import {PNG} from 'pngjs';
import {bubbleConfig,bubbleGeometry} from '../public/bubble-model.js';
// Extend only the body stretch strips; fixed artwork and corners retain their size.
function stretchBody(raw,width,height,scale,stretchX,stretchY){
 const input=PNG.sync.read(raw),output=new PNG({width:width*scale,height:height*scale}),cutX=Math.min(input.width-1,stretchX*scale),cutY=Math.min(input.height-1,stretchY*scale),extraX=output.width-input.width,extraY=output.height-input.height;
 const source=(v,cut,extra)=>v<cut?v:v<cut+extra?cut:v-extra;
 for(let y=0;y<output.height;y++)for(let x=0;x<output.width;x++){const sx=source(x,cutX,extraX),sy=source(y,cutY,extraY);input.data.copy(output.data,(y*output.width+x)*4,(sy*input.width+sx)*4,(sy*input.width+sx)*4+4);}return PNG.sync.write(output);
}
// A generated body promoted back to a source must remove the added flat strips,
// rather than scaling its fixed artwork and corners down with the whole image.
export function collapseBubbleBody(raw,scale,stretchX,stretchY){
 const input=PNG.sync.read(raw),output=new PNG({width:64*scale,height:56*scale});
 const source=(v,cut,extra)=>extra>=0?(v<cut?v:v+extra):(v<cut?v:v<cut-extra?cut:v+extra),extraX=input.width-output.width,extraY=input.height-output.height;
 for(let y=0;y<output.height;y++)for(let x=0;x<output.width;x++){const sx=source(x,stretchX*scale,extraX),sy=source(y,stretchY*scale,extraY);input.data.copy(output.data,(y*output.width+x)*4,(sy*input.width+sx)*4,(sy*input.width+sx)*4+4);}return PNG.sync.write(output);
}
export async function composeBubble(p,who,scale,selected,first,assetRoot,{asset,legacy,bodyOnly=false,cache=(_key,generate)=>generate(),hash=bytes=>bytes.toString('base64')}){
 const cfg=bubbleConfig(p,who,!first),g=bubbleGeometry(p,who,!first),base=who+'Bubble';
 let body;
 if(!g.imageBody){
  const w=g.bodyWidth,h=g.bodyHeight,r=cfg.radius,color=cfg.color,tail=cfg.tail?`<path d="${who==='sent'?`M${w-12} ${h-17} ${w} ${h-2} ${w-17} ${h-8}`:`M12 ${h-17} 0 ${h-2} 17 ${h-8}`}" fill="${color}"/>`:'';
  const source=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="2" y="2" width="${w-4}" height="${h-4}" rx="${r}" fill="${color}"/>${tail}</svg>`);body=await cache('compose-body:'+hash(source)+':'+scale+':'+selected,async()=>{let png=await sharp(source).resize(w*scale,h*scale).png().toBuffer();if(selected)png=await sharp(png).modulate({brightness:.88}).png().toBuffer();return png;});
 }else{body=await legacy(p,who,scale,selected,first,assetRoot);if(g.bodyWidth!==64)body=stretchBody(body,g.bodyWidth,56,scale,p.bubble.stretchX,p.bubble.stretchY);}
 if(!g.decorated||bodyOnly)return body;
 const decoration=await asset(p,cfg.decorationSlot,assetRoot),s=cfg.size*scale;
 const character=await cache('compose-character:'+hash(decoration)+':'+s,()=>sharp(decoration).resize(s,s,{fit:'contain',background:'#00000000'}).png().toBuffer());
 // Alpha-over preserves the body under transparent character pixels. Direct
 // copy remains exact wherever the destination is empty or the source is opaque.
 const output=new PNG({width:g.width*scale,height:g.height*scale}),bodyPixels=PNG.sync.read(body),characterPixels=PNG.sync.read(character);
 const over=(src,left,top)=>{for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++){const si=(y*src.width+x)*4,di=((y+top)*output.width+x+left)*4,a=src.data[si+3]/255,b=output.data[di+3]/255;if(!a)continue;if(a===1||!b){src.data.copy(output.data,di,si,si+4);continue;}const alpha=a+b*(1-a);for(let c=0;c<3;c++)output.data[di+c]=Math.round((src.data[si+c]*a+output.data[di+c]*b*(1-a))/alpha);output.data[di+3]=Math.round(alpha*255);}};
 const drawBody=()=>over(bodyPixels,g.bodyRect.x*scale,g.header*scale),drawCharacter=()=>over(characterPixels,g.decoration.x*scale,0);
 if(cfg.layer==='back'){drawCharacter();drawBody();}else{drawBody();drawCharacter();}return PNG.sync.write(output);
}
