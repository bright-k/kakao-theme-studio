import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {ROOT,newProject,atomic,sha,compile} from '../src/core.mjs';
test('reused image transforms preserve every output byte and changed source bytes invalidate them',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/preview-cache-')),p=newProject();const source=await sharp({create:{width:40,height:60,channels:4,background:'#336699'}}).png().toBuffer(),ref='assets/'+sha(source)+'.png';await atomic(path.join(root,ref),source);p.assets.mainBackground=ref;p.assets.sentBubbleDecoration=ref;p.bubbleDesign={sent:{body:'color',placementY:-6,shiftX:-16}};
 const first=await compile(p,root);p.commonColors={notificationText:'#123456'};const second=await compile(p,root);const files=Object.keys(first.files).filter(f=>f.endsWith('.png'));assert.equal(files.length,146);for(const f of files)assert.deepEqual(second.files[f],first.files[f],f);
 const next=await sharp({create:{width:40,height:60,channels:4,background:'#aa7744'}}).png().toBuffer(),nextRef='assets/'+sha(next)+'.png';await atomic(path.join(root,nextRef),next);p.assets.mainBackground=nextRef;const third=await compile(p,root);assert.notEqual(sha(third.files['ios/Images/mainBgImage@2x.png']),sha(second.files['ios/Images/mainBgImage@2x.png']));
});
