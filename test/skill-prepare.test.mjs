import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepare} from '../skills/kakao-theme-studio/scripts/prepare.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
async function command(cwd,args){
 return new Promise((resolve,reject)=>{
  const child=spawn('git',args,{cwd,shell:false,env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0'}});let output='';
  child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  child.on('error',reject);child.on('close',code=>code===0?resolve(output.trim()):reject(new Error(output)));
 });
}
async function fixture(t){
 const root=await fs.mkdtemp(path.join(ROOT,'.test-data/skill-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const source=path.join(root,'source'),remote=path.join(root,'remote.git'),local=path.join(root,'local');
 await fs.mkdir(source);
 await command(root,['init','--bare',remote]);
 await command(source,['init','-b','main']);
 await command(source,['config','user.name','Skill Test']);await command(source,['config','user.email','skill@example.invalid']);
 for(const dir of ['src','templates','docs'])await fs.mkdir(path.join(source,dir));
 await fs.writeFile(path.join(source,'package.json'),JSON.stringify({name:'kakao-theme-studio-local',version:'1.2.3',engines:{node:'>=22'}}));
 await fs.writeFile(path.join(source,'src/catalog.mjs'),"export const COMPILER_VERSION = '1.2.3';\n");
 await fs.writeFile(path.join(source,'src/server.mjs'),'// fixture only\n');
 await fs.writeFile(path.join(source,'templates/profile-26.9.0.json'),JSON.stringify({iosProperties:[{}],androidColors:[{},{}],files:[{},{},{}]}));
 await fs.writeFile(path.join(source,'docs/HANDOFF.md'),'현재 앱 버전과 compilerVersion은 1.2.2이다.\n');
 await fs.writeFile(path.join(source,'.gitignore'),'.data/\n');
 await command(source,['add','.']);await command(source,['commit','-m','initial']);
 await command(source,['remote','add','origin',remote]);await command(source,['push','-u','origin','main']);
 await command(root,['clone','--branch','main',remote,local]);
 await command(local,['config','user.name','Skill Test']);await command(local,['config','user.email','skill@example.invalid']);
 const advance=async()=>{
  await fs.writeFile(path.join(source,'upstream.txt'),'remote update\n');
  await command(source,['add','.']);await command(source,['commit','-m','update']);await command(source,['push']);
 };
 return {root,source,remote,local,advance};
}

test('skill preparation fast-forwards upstream and leaves ignored user data unchanged',async t=>{
 const {local,source,advance}=await fixture(t);await advance();
 await fs.mkdir(path.join(local,'.data'));await fs.writeFile(path.join(local,'.data/secret'),'private fixture');
 await command(local,['config','pull.rebase','true']);await command(local,['config','pull.autostash','true']);
 const report=await prepare({repo:local,update:true});
 assert.equal(report.git.status,'updated');assert.equal(report.git.latestVerified,true);
 assert.equal(report.git.head,await command(source,['rev-parse','HEAD']));
 assert.equal(await fs.readFile(path.join(local,'.data/secret'),'utf8'),'private fixture');
 assert.equal(report.versions.documentationMismatch,true);assert.equal(report.catalog.imageOutputs,3);
 assert.equal((await prepare({repo:local,update:true})).git.status,'up-to-date');
});

test('read-only check does not fetch; tracked and untracked changes prevent pull',async t=>{
 const {local,advance}=await fixture(t);await advance();
 const initial=await command(local,['rev-parse','HEAD']);
 assert.equal((await prepare({repo:local})).git.status,'check-only');
 assert.equal(await command(local,['rev-parse','origin/main']),initial);
 for(const file of ['package.json','untracked.txt']){
  const original=file==='package.json'?await fs.readFile(path.join(local,file),'utf8'):null;
  await fs.writeFile(path.join(local,file),original?original+'\n':'my untracked work');
  const report=await prepare({repo:local,update:true});assert.equal(report.git.status,'local-changes');
  assert.equal(await command(local,['rev-parse','HEAD']),initial);
  assert.equal(await command(local,['rev-parse','origin/main']),initial);
  if(original)await fs.writeFile(path.join(local,file),original);else await fs.unlink(path.join(local,file));
 }
 assert.equal(await command(local,['stash','list']),'');
});

test('diverged or locally ahead branches are preserved without merge or stash',async t=>{
 const {local,advance}=await fixture(t);
 await fs.writeFile(path.join(local,'my-work'),'local');await command(local,['add','.']);await command(local,['commit','-m','my work']);
 const initial=await command(local,['rev-parse','HEAD']);
 assert.equal((await prepare({repo:local,update:true})).git.status,'local-ahead');
 await advance();assert.equal((await prepare({repo:local,update:true})).git.status,'diverged');
 assert.equal(await command(local,['rev-parse','HEAD']),initial);assert.equal(await command(local,['stash','list']),'');
});

test('detached HEAD, Git operations and missing upstream prevent mutation',async t=>{
 const {local}=await fixture(t);const initial=await command(local,['rev-parse','HEAD']);
 await command(local,['checkout','--detach']);assert.equal((await prepare({repo:local,update:true})).git.status,'detached-head');
 await command(local,['checkout','main']);
 await fs.writeFile(path.join(local,'.git/MERGE_HEAD'),initial+'\n');
 assert.equal((await prepare({repo:local,update:true})).git.status,'git-operation-in-progress');
 await fs.unlink(path.join(local,'.git/MERGE_HEAD'));
 await command(local,['branch','--unset-upstream']);assert.equal((await prepare({repo:local,update:true})).git.status,'no-upstream');
 assert.equal(await command(local,['rev-parse','HEAD']),initial);
});

test('unreachable upstream returns a sanitized result and keeps HEAD unchanged',async t=>{
 const {local,root}=await fixture(t);const initial=await command(local,['rev-parse','HEAD']);
 const secret='do-not-print-credential';await command(local,['remote','set-url','origin',path.join(root,secret)]);
 const report=await prepare({repo:local,update:true});assert.equal(report.git.status,'fetch-failed');
 assert.equal(report.git.latestVerified,false);assert.ok(!JSON.stringify(report).includes(secret));
 assert.equal(await command(local,['rev-parse','HEAD']),initial);
});

test('a distribution inside another repository is never updated; missing doctor does not open a data store',async t=>{
 const {local}=await fixture(t);await fs.rename(path.join(local,'.git'),path.join(local,'git-metadata'));
 const report=await prepare({repo:local,update:true,checkEnvironment:true});
 assert.equal(report.git.status,'repository-root-mismatch');assert.equal(report.doctor.status,'unavailable');
 await assert.rejects(fs.access(path.join(local,'.data')));
 await assert.rejects(prepare({repo:path.dirname(local)}));
});

test('CLI works without Git and reports missing tools without leaking environment secrets',async t=>{
 const {local}=await fixture(t);
 const entry=path.join(local,'prepare-link.mjs');
 await fs.symlink(path.join(ROOT,'skills/kakao-theme-studio/scripts/prepare.mjs'),entry);
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[entry,'--repo',local,'--pull'],{
   cwd:local,shell:false,env:{...process.env,PATH:'',STUDIO_KEY_PASSWORD:'never-print-this-password'}});let output='';
  child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);
  child.on('error',reject);child.on('close',code=>resolve({code,output}));
 });
 assert.equal(result.code,0);assert.equal(JSON.parse(result.output).git.status,'git-unavailable');
 assert.ok(!result.output.includes('never-print-this-password'));
 await assert.rejects(fs.access(path.join(local,'.data')));
});
