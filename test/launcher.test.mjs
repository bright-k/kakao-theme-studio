import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {ROOT} from '../src/core.mjs';
import {COMPILER_VERSION} from '../src/catalog.mjs';
test('launcher refuses stale or unversioned servers and reuses only a compatible server',async()=>{
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/launcher-'));let version;
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({storageVersion:2,assetNamingVersion:1,compilerVersion:version}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 await fs.writeFile(path.join(root,'session.json'),JSON.stringify({port:server.address().port,token:'a'.repeat(48)}));
 const launch=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/launch.mjs'],{cwd:ROOT,env:{...process.env,THEME_STUDIO_DATA:root,STUDIO_NO_OPEN:'1'},shell:false});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('error',reject);child.on('exit',code=>resolve({code,output}));});
 try{
  for(version of [undefined,'0.7.0']){const r=await launch();assert.equal(r.code,1);assert.match(r.output,/이전 서버가 실행 중/);assert.doesNotMatch(r.output,/실행 중인 테마 스튜디오를 열었습니다/);}
  version=COMPILER_VERSION;const r=await launch();assert.equal(r.code,0);assert.match(r.output,/실행 중인 테마 스튜디오를 열었습니다/);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await fs.rm(root,{recursive:true,force:true});}
});
