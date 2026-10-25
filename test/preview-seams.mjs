import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {ROOT,bubbleImage,newProject} from '../src/core.mjs';
import {PNG} from 'pngjs';
import {createStudio} from '../src/server.mjs';
const project=newProject();project.palette.sent='#3F6A9E';project.bubble.radius=16;
const raw=PNG.sync.read(await bubbleImage(project,'sent',2));
for(let y=34;y<70;y++)for(let x=36;x<90;x++){const i=(y*raw.width+x)*4;assert.deepEqual([...raw.data.subarray(i,i+4)],[63,106,158,255]);}
const dataRoot=path.join(ROOT,'.test-data','preview-seams-'+Date.now()),out=path.join(ROOT,'test-results');await fs.mkdir(out,{recursive:true});
const studio=await createStudio({dataRoot});await new Promise(r=>studio.server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await (process.env.SEAM_BROWSER==='webkit'?webkit:chromium).launch({headless:process.env.SEAM_HEADED!=='1',timeout:15000});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+studio.server.address().port+'/',{waitUntil:'domcontentloaded',timeout:10000});
 page.setDefaultTimeout(10000);const result=await page.evaluate(async(moduleUrl)=>{
  const {drawNine}=await import(moduleUrl);const results=[];
  const canvas=document.createElement('canvas');canvas.width=250;canvas.height=150;document.body.replaceChildren(canvas);document.body.style.margin='0';
  const ctx=canvas.getContext('2d');
  for(const alpha of [1,.5])for(const scale of [2,3])for(const multiple of [false,true]){
   const source=document.createElement('canvas');source.width=64*scale+(scale===3?2:0);source.height=56*scale+(scale===3?2:0);const s=source.getContext('2d');s.fillStyle=`rgba(63,106,158,${alpha})`;s.fillRect(2*scale,2*scale,source.width-4*scale,source.height-4*scale);const bitmap=await createImageBitmap(await new Promise(r=>source.toBlob(r)));
   const patch=scale===3?{stretchX:multiple?[[33,36],[90,93]]:[[90,93]],stretchY:multiple?[[30,33],[78,81]]:[[78,81]]}:null;
   ctx.clearRect(0,0,250,150);drawNine(ctx,bitmap,10.37,12.29,190.63,100.47,{scale,patch});const pixels=ctx.getImageData(40,35,135,58).data;const alphas=new Set();for(let i=3;i<pixels.length;i+=4)alphas.add(pixels[i]);results.push({alpha,scale,multiple,alphas:[...alphas].sort((a,b)=>a-b)});
  }
  return results;
 },process.env.SEAM_RENDERER_PATH?'data:text/javascript;base64,'+(await fs.readFile(process.env.SEAM_RENDERER_PATH)).toString('base64'):'/preview-renderer.js');await fs.writeFile(path.join(out,'preview-seams-report.json'),JSON.stringify({browser:process.env.SEAM_BROWSER??'chromium',sourceInteriorUniform:true,cases:result,deviceVerified:false},null,2));
 for(const r of result)assert.deepEqual(r.alphas,[r.alpha===1?255:128],JSON.stringify(r));
 await page.screenshot({path:path.join(out,'preview-seams.png')});console.log('PASS: generated bubble interior is uniform; fractional and multi-segment slices preserve opaque and translucent pixels without gaps or overlaps.');
}finally{if(browser)await browser.close();studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));}
