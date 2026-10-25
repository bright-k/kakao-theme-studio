import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { PNG } from 'pngjs';
import {newProject,validate,compile,makeKtheme,ninePatch,bubbleImage,exportProject,importProject,normalizeUpload,sha,atomic,iosCSS,ROOT,androidColors} from '../src/core.mjs';

test('invalid colors, path traversal, geometry and identity fail before generation',()=>{
 const p=newProject();assert.equal(validate(p).filter(x=>x.severity==='error').length,0);p.assets.chatBackground='../../secret';p.palette.sent='blue';p.bubble.paddingX=35;p.packageId='bad';const fields=validate(p).filter(x=>x.severity==='error').map(x=>x.field);for(const f of ['assets.chatBackground','palette.sent','bubble.paddingX','packageId'])assert.ok(fields.includes(f));
});
test('nine-patch protects image pixels and encodes independent stretch and content bounds',async()=>{
 const p=newProject();const buf=await bubbleImage(p,'sent',3,false,true,'/tmp');const patch=PNG.sync.read(ninePatch(buf,p.bubble));assert.equal(patch.width,194);assert.equal(patch.height,170);const alpha=(x,y)=>patch.data[(y*patch.width+x)*4+3];assert.equal(alpha(0,0),0);assert.equal(alpha(91,0),255);assert.equal(alpha(94,0),0);assert.equal(alpha(0,79),255);assert.equal(alpha(43,169),255);assert.equal(alpha(42,169),0);
});
test('iOS escaping and platform colors/geometry are derived from shared policy',async()=>{
 const p=newProject("a'; injected: 'x");p.author="O'Neil";p.bubble.paddingX=19;p.bubble.stretchX=35;const css=iosCSS(p,await fs.readFile(path.join(ROOT,'templates/ios.css'),'utf8'));assert.ok(css.includes("a\\'; injected: \\'x"));assert.ok(css.includes('35px 26px'));assert.ok(css.includes('10px 19px 10px 19px'));assert.ok(css.includes(`-ios-text-color: ${p.palette.sentText}`));const colors=androidColors(p,await fs.readFile(path.join(ROOT,'templates/android-colors.xml'),'utf8'));assert.ok(colors.includes(`<color name="theme_body_cell_color">#00${p.palette.main.slice(1)}`));
});
test('all iOS image references resolve and the archive has CSS at root',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-core-'));try{const c=await compile(newProject(),root);const css=c.files['ios/KakaoTalkTheme.css'].toString();for(const m of css.matchAll(/'([\w]+)\.png'/g))assert.ok(c.files[`ios/Images/${m[1]}@2x.png`]||c.files[`ios/Images/${m[1]}.png`],m[0]);const z=await JSZip.loadAsync(await makeKtheme(c));assert.ok(z.file('KakaoTalkTheme.css'));assert.ok(z.file('Images/commonIcoTheme.png'));assert.ok(c.files['android/res/drawable-xxhdpi/theme_chatroom_bubble_me_01_image.9.png']);assert.equal(c.deviceVerified,false);}finally{await fs.rm(root,{recursive:true,force:true});}
});
test('portable project retains assets and stable IDs, excludes signing key, rejects tampering',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'studio-project-'));try{const p=newProject();p.signingKeyId=newProject().id;const image=await normalizeUpload(await bubbleImage(p,'sent',3,false,true,root));const ref=`assets/${sha(image)}.png`;await atomic(path.join(root,ref),image);p.assets.sentBubble=ref;const archive=await exportProject(p,root);const z=await JSZip.loadAsync(archive);assert.deepEqual(Object.keys(z.files).filter(n=>/p12|jks|password/.test(n)),[]);const imported=await importProject(archive,root);assert.equal(imported.packageId,p.packageId);assert.equal(imported.signingKeyId,null);assert.deepEqual(imported.assets,p.assets);z.file(ref,Buffer.from('tampered'));const tampered=await z.generateAsync({type:'nodebuffer'});await assert.rejects(()=>importProject(tampered,root));}finally{await fs.rm(root,{recursive:true,force:true});}
});
test('upload rejects arbitrary SVG/XML input',async()=>{await assert.rejects(()=>normalizeUpload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')));});
