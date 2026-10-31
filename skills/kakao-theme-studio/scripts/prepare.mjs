import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// Keep this helper dependency-free so it also works before pnpm install.
async function run(executable,args,cwd,timeout=15000){
 return new Promise(resolve=>{
  let stdout='',timer,finished=false;
  const done=result=>{if(finished)return;finished=true;clearTimeout(timer);resolve(result);};
  const child=spawn(executable,args,{cwd,shell:false,stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}});
  child.stdout.on('data',chunk=>{stdout=(stdout+chunk).slice(-1000000);});
  // Git errors can contain credential-bearing URLs; never return their text.
  child.stderr.resume();
  child.on('error',error=>done({ok:false,missing:error.code==='ENOENT'}));
  child.on('close',code=>done({ok:code===0,stdout:stdout.trim()}));
  timer=setTimeout(()=>{child.kill('SIGKILL');done({ok:false,timedOut:true});},timeout);
 });
}
const exists=file=>fs.lstat(file).then(()=>true,()=>false);
const git=(root,args)=>run('git',['-C',root,...args],root);
async function snapshot(root){
 const head=await git(root,['rev-parse','HEAD']);
 const branch=await git(root,['symbolic-ref','--quiet','--short','HEAD']);
 const status=await git(root,['status','--porcelain=v1','--untracked-files=all']);
 return {ok:head.ok&&status.ok,head:head.stdout,branch:branch.ok?branch.stdout:null,dirty:status.stdout!==''};
}
async function gitBusy(root){
 for(const name of ['MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply','BISECT_LOG','index.lock']){
  const result=await git(root,['rev-parse','--git-path',name]);
  if(!result.ok)return true;
  if(await exists(path.resolve(root,result.stdout)))return true;
 }
 return false;
}
async function inspectGit(root,update){
 const top=await git(root,['rev-parse','--show-toplevel']);
 if(!top.ok)return {status:top.missing?'git-unavailable':'not-a-git-repository',latestVerified:false};
 if(await fs.realpath(top.stdout)!==root)return {status:'repository-root-mismatch',latestVerified:false};
 const initial=await snapshot(root);
 const base={branch:initial.branch,head:initial.head,latestVerified:false};
 if(!initial.ok)return {...base,status:'git-state-unavailable'};
 const upstream=await git(root,['rev-parse','--abbrev-ref','--symbolic-full-name','@{upstream}']);
 base.upstream=upstream.ok?upstream.stdout:null;
 if(!update)return {...base,status:'check-only',dirty:initial.dirty};
 if(await gitBusy(root))return {...base,status:'git-operation-in-progress'};
 if(initial.dirty)return {...base,status:'local-changes',dirty:true};
 if(!initial.branch)return {...base,status:'detached-head'};
 if(!upstream.ok)return {...base,status:'no-upstream'};
 const remote=await git(root,['config','--get',`branch.${initial.branch}.remote`]);
 if(!remote.ok||!remote.stdout||remote.stdout.startsWith('-'))return {...base,status:'remote-unavailable'};
 const fetched=await git(root,['fetch','--no-recurse-submodules','--',remote.stdout]);
 if(!fetched.ok)return {...base,status:fetched.timedOut?'fetch-timeout':'fetch-failed'};
 const compare=await git(root,['rev-list','--left-right','--count','HEAD...@{upstream}']);
 if(!compare.ok||!/^\d+\s+\d+$/.test(compare.stdout))return {...base,status:'comparison-unavailable'};
 const [ahead,behind]=compare.stdout.split(/\s+/).map(Number);
 const current=await snapshot(root);
 if(!current.ok||current.head!==initial.head||current.branch!==initial.branch||current.dirty||await gitBusy(root))return {...base,status:'state-changed-during-fetch'};
 if(ahead)return {...base,status:behind?'diverged':'local-ahead',ahead,behind};
 if(!behind)return {...base,status:'up-to-date',ahead,behind,latestVerified:true};
 const pulled=await git(root,['-c','pull.autostash=false','-c','rebase.autoStash=false','-c','merge.autoStash=false','pull','--ff-only','--no-rebase','--no-recurse-submodules']);
 const after=await snapshot(root);
 if(!pulled.ok)return {...base,status:pulled.timedOut?'pull-timeout':'pull-failed',head:after.head};
 const remaining=await git(root,['rev-list','--left-right','--count','HEAD...@{upstream}']);
 if(!after.ok||after.branch!==initial.branch||after.dirty||!remaining.ok||!/^0\s+0$/.test(remaining.stdout))return {...base,status:'post-pull-check-failed',head:after.head};
 return {...base,status:'updated',previousHead:initial.head,head:after.head,latestVerified:true};
}

export async function prepare({repo,update=false,checkEnvironment=false}){
 if(!repo)throw new Error('--repo 경로가 필요합니다.');
 const root=await fs.realpath(path.resolve(repo)).catch(()=>{throw new Error('저장소 경로를 확인하세요.');});
 for(const name of ['package.json','src/catalog.mjs','src/server.mjs']){
  if(!await exists(path.join(root,name)))throw new Error('스튜디오 저장소 루트를 지정하세요.');
 }
 const initialPackage=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 if(initialPackage.name!=='kakao-theme-studio-local')throw new Error('Kakao Theme Studio 저장소가 아닙니다.');
 const gitReport=await inspectGit(root,update);
 // Read metadata after an update without importing freshly fetched app code.
 const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
 const catalogSource=await fs.readFile(path.join(root,'src/catalog.mjs'),'utf8');
 const compiler=catalogSource.match(/export\s+const\s+COMPILER_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1]??null;
 const catalog=JSON.parse(await fs.readFile(path.join(root,'templates/profile-26.9.0.json'),'utf8'));
 const handoff=await fs.readFile(path.join(root,'docs/HANDOFF.md'),'utf8').catch(()=>'');
 const handoffVersion=handoff.match(/현재 앱 버전과 compilerVersion은\s*([\d.]+)/)?.[1]?.replace(/\.$/,'')??null;
 const result={schemaVersion:1,repository:root,git:gitReport,
  versions:{app:pkg.version,compiler,handoff:handoffVersion,documentationMismatch:!!handoffVersion&&(handoffVersion!==pkg.version||handoffVersion!==compiler)},
  catalog:{profile:catalog.profile??null,iosProperties:catalog.iosProperties?.length??null,androidColors:catalog.androidColors?.length??null,imageOutputs:catalog.files?.length??null},
  dataRoot:path.resolve(root,process.env.THEME_STUDIO_DATA??'.data'),
  node:{current:process.version,required:pkg.engines?.node??null}};
 if(checkEnvironment){
  const checked=await run(process.execPath,['src/cli.mjs','doctor'],root);
  try{result.doctor={status:checked.ok?'checked':'unavailable',environment:JSON.parse(checked.stdout)};}
  catch{result.doctor={status:checked.timedOut?'timeout':'unavailable',reason:'현재 저장소의 의존성·doctor 실행 환경을 확인하세요.'};}
 }
 return result;
}

async function main(){
 const args=process.argv.slice(2);let repo,update=false,checkEnvironment=false;
 for(let i=0;i<args.length;i++){
  if(args[i]==='--help'){console.log('node prepare.mjs --repo PATH [--pull] [--doctor]\n기본은 읽기 전용 점검. --pull은 안전 조건에서만 fast-forward 최신화.');return;}
  if(args[i]==='--repo'&&args[i+1]&&!args[i+1].startsWith('--'))repo=args[++i];
  else if(args[i]==='--pull')update=true;
  else if(args[i]==='--doctor')checkEnvironment=true;
  else throw new Error('사용법: node prepare.mjs --repo PATH [--pull] [--doctor]');
 }
 console.log(JSON.stringify(await prepare({repo,update,checkEnvironment}),null,2));
}
const entryPath=process.argv[1]?await fs.realpath(path.resolve(process.argv[1])).catch(()=>null):null;
if(entryPath&&import.meta.url===pathToFileURL(entryPath).href){
 main().catch(()=>{console.error('준비 실패: 인자·스튜디오 루트·메타데이터 파일을 확인하세요. (--help)');process.exitCode=1;});
}
