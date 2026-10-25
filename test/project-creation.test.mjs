import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,newProject,cloneProject,validate,exportProject,importProject,iosCSS,compile,makeKtheme,sha} from '../src/core.mjs';
import JSZip from 'jszip';
import {createStudio} from '../src/server.mjs';

test('custom package IDs validate, survive backup, and drive the iOS identity',async()=>{
 const p=newProject('배포용 테마','forest','  com.bright.theme.forest_2026  ');
 assert.equal(p.packageId,'com.bright.theme.forest_2026');
 assert.equal(validate(p).filter(x=>x.severity==='error').length,0);
 const css=iosCSS(p,await fs.readFile(path.join(ROOT,'templates/ios.css'),'utf8'));
 assert.ok(css.includes("-kakaotalk-theme-id: 'com.bright.theme.forest_2026';"));
 await fs.mkdir(path.join(ROOT,'.test-data'),{recursive:true});
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/package-backup-'));
 try{assert.equal((await importProject(await exportProject(p,root),root)).packageId,p.packageId);}
 finally{await fs.rm(root,{recursive:true,force:true});}
 for(const value of [undefined,'','   '])assert.match(newProject('自動','forest',value).packageId,/^studio\.localtheme\.t[a-f0-9]+$/);
 for(const value of ['bad','Com.bright.theme','com.bright.2theme','com.bright.theme-name','com.class.theme','com.true.theme','com.null.theme','com.'+'a'.repeat(155)+'.theme',null,42]){
  assert.ok(validate(newProject('테스트','forest',value)).some(x=>x.severity==='error'&&x.field==='packageId'),String(value));
 }
});

test('existing project archives regenerate with the shared ID and a separate compiler cache',async()=>{
 await fs.mkdir(path.join(ROOT,'.test-data'),{recursive:true});
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/package-existing-'));
 try{
  const archive=await fs.readFile(path.join(ROOT,'examples/sample-project.zip'));
  const p=await importProject(archive,root),before=structuredClone(p);
  const c=await compile(p,root),z=await JSZip.loadAsync(await makeKtheme(c));
  const declaration=`-kakaotalk-theme-id: '${p.packageId}';`;
  assert.ok((await z.file('KakaoTalkTheme.css').async('string')).includes(declaration));
  assert.equal(c.styles.ios['ManifestStyle/-kakaotalk-theme-id'],p.packageId);
  assert.equal(c.compilerVersion,'0.4.1');assert.notEqual(c.revision,sha('0.4.0\n'+JSON.stringify(p)));
  assert.deepEqual(p,before);
  const restored=await importProject(await exportProject(p,root),root);
  assert.equal(iosCSS(restored).match(/-kakaotalk-theme-id: '([^']+)'/)[1],p.packageId);
  const duplicate=cloneProject(p);assert.notEqual(duplicate.packageId,p.packageId);
  assert.ok(iosCSS(duplicate).includes(`-kakaotalk-theme-id: '${duplicate.packageId}';`));
  const explicit=newProject('명시적 접미사','forest','com.bright.theme.ios');
  assert.ok(iosCSS(explicit).includes("-kakaotalk-theme-id: 'com.bright.theme.ios';"));
 }finally{await fs.rm(root,{recursive:true,force:true});}
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
