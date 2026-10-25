import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,newProject,validate,exportProject,importProject,iosCSS} from '../src/core.mjs';
import {createStudio} from '../src/server.mjs';

test('custom package IDs validate, survive backup, and drive the iOS identity',async()=>{
 const p=newProject('배포용 테마','forest','  com.bright.theme.forest_2026  ');
 assert.equal(p.packageId,'com.bright.theme.forest_2026');
 assert.equal(validate(p).filter(x=>x.severity==='error').length,0);
 const css=iosCSS(p,await fs.readFile(path.join(ROOT,'templates/ios.css'),'utf8'));
 assert.ok(css.includes("'com.bright.theme.forest_2026.ios'"));
 await fs.mkdir(path.join(ROOT,'.test-data'),{recursive:true});
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/package-backup-'));
 try{assert.equal((await importProject(await exportProject(p,root),root)).packageId,p.packageId);}
 finally{await fs.rm(root,{recursive:true,force:true});}
 for(const value of [undefined,'','   '])assert.match(newProject('自動','forest',value).packageId,/^studio\.localtheme\.t[a-f0-9]+$/);
 for(const value of ['bad','Com.bright.theme','com.bright.2theme','com.bright.theme-name','com.class.theme','com.true.theme','com.null.theme','com.'+'a'.repeat(155)+'.theme',null,42]){
  assert.ok(validate(newProject('테스트','forest',value)).some(x=>x.severity==='error'&&x.field==='packageId'),String(value));
 }
});

test('project API rejects duplicate packages, concurrent creation, and identity changes',async()=>{
 await fs.mkdir(path.join(ROOT,'.test-data'),{recursive:true});
 const dataRoot=await fs.mkdtemp(path.join(ROOT,'.test-data/package-api-'));
 const studio=await createStudio({dataRoot});
 await new Promise((resolve,reject)=>{studio.server.once('error',reject);studio.server.listen(0,'127.0.0.1',resolve);});
 const base=`http://127.0.0.1:${studio.server.address().port}/api/`;
 const request=(route,method='GET',data)=>fetch(base+route,{method,headers:{Authorization:`Bearer ${studio.token}`,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
 try{
  const response=await request('projects','POST',{name:'내 테마',packageId:'com.bright.theme.api'});assert.equal(response.status,200);const p=await response.json();assert.equal(p.packageId,'com.bright.theme.api');
  for(const packageId of ['com.bright.theme.api','com.class.theme','bad'])assert.equal((await request('projects','POST',{packageId})).status,400);
  const racing=await Promise.all([1,2].map(()=>request('projects','POST',{packageId:'com.bright.theme.concurrent'})));assert.deepEqual(racing.map(r=>r.status).sort(),[200,400]);
  assert.equal((await request('project','PUT',{project:{...p,packageId:'com.bright.theme.changed'}})).status,400);
  assert.equal((await request('project','PUT',{project:{...newProject(),packageId:p.packageId}})).status,400);
  const archive=await exportProject({...p,id:newProject().id},dataRoot);
  assert.equal((await request('project-import','POST',{base64:archive.toString('base64')})).status,400);
  assert.equal((await request('project','PUT',{project:{...p,name:'이름 변경'}})).status,200);
  const automatic=await request('projects','POST',{});assert.equal(automatic.status,200);assert.match((await automatic.json()).packageId,/^studio\.localtheme\.t/);
  const persisted=await fs.readFile(path.join(dataRoot,'projects',`${p.id}.json`),'utf8');assert.equal(JSON.parse(persisted).packageId,p.packageId);
  assert.equal((await (await request('projects')).json()).length,3);
 }finally{studio.server.closeAllConnections();await new Promise(r=>studio.server.close(r));await fs.rm(dataRoot,{recursive:true,force:true});}
});
