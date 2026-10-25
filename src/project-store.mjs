import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {assertValid,validId,cloneProject,atomic,readJson,exportProject} from './core.mjs';
import {assetReferences} from './resources.mjs';
import {assetFile,readAsset,writeAsset,listAssetFiles,legacyAssetRef} from './asset-store.mjs';
import {migrateAssetReferences} from './asset-migration.mjs';
import {readProjectArchive,backupFilename} from './project-archive.mjs';
const exists=async file=>{try{await fs.lstat(file);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
const alive=pid=>{if(!Number.isInteger(pid)||pid<=0)return false;try{process.kill(pid,0);return true;}catch(e){return e.code!=='ESRCH';}};
async function metadata(dir,name){const file=path.join(dir,name),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('프로젝트 메타데이터에 링크를 사용할 수 없습니다.');return readJson(file);}
async function directory(dir){const stat=await fs.lstat(dir);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('프로젝트 저장 폴더에 링크를 사용할 수 없습니다.');}
export class ProjectStore {
 constructor(root){this.root=path.resolve(root);this.projects=path.join(this.root,'projects');this.records=new Map();this.queue=Promise.resolve();this.nonce=crypto.randomUUID();this.migration={migrated:0,namedProjects:0,namedReferences:0,preservedStaging:0};}
 transaction(fn){const result=this.queue.catch(()=>{}).then(fn);this.queue=result;return result;}
 async initialize(){
  await fs.mkdir(this.root,{recursive:true,mode:0o700});await directory(this.root);
  // Older running servers do not hold the new lock. Do not migrate underneath one.
  const session=await readJson(path.join(this.root,'session.json'),null);if(session?.pid!==process.pid&&alive(session?.pid)&&Number.isInteger(session.port)&&/^[a-f0-9]{48}$/.test(session.token??'')){
   let running=false;try{const r=await fetch(`http://127.0.0.1:${session.port}/api/projects`,{headers:{Authorization:'Bearer '+session.token},signal:AbortSignal.timeout(1500)});running=r.ok;}catch{}if(running)throw new Error('이 저장소의 스튜디오가 이미 실행 중입니다. 기존 서버를 종료한 후 다시 실행하세요.');
  }
  const lock=path.join(this.root,'.storage.lock');for(let attempt=0;attempt<2;attempt++)try{const h=await fs.open(lock,'wx',0o600);await h.writeFile(JSON.stringify({pid:process.pid,nonce:this.nonce,version:2}));await h.close();this.locked=true;break;}catch(e){if(e.code!=='EEXIST')throw e;const prior=await readJson(lock,null);if(!prior||alive(prior.pid)||attempt)throw new Error('프로젝트 저장소를 다른 서버 또는 CLI가 사용 중입니다.');await fs.unlink(lock);}
  try{
   await fs.mkdir(this.projects,{recursive:true,mode:0o700});await directory(this.projects);const staging=path.join(this.root,'.staging');await fs.mkdir(staging,{recursive:true,mode:0o700});await directory(staging);this.migration.preservedStaging=(await fs.readdir(staging)).length;
   const entries=await fs.readdir(this.projects,{withFileTypes:true});
   for(const entry of entries){const dir=path.join(this.projects,entry.name);if(entry.isSymbolicLink())throw new Error('프로젝트 폴더에 링크를 사용할 수 없습니다.');if(!entry.isDirectory())continue;if(!await exists(path.join(dir,'storage.json'))){if(await exists(path.join(dir,'theme.json')))throw new Error('완료 표시가 없는 프로젝트 폴더가 있습니다: '+entry.name);continue;}const p=await metadata(dir,'theme.json'),marker=await metadata(dir,'storage.json');assertValid(p);if(entry.name!==p.packageId||marker.version!==2||marker.projectId!==p.id||marker.packageId!==p.packageId)throw new Error('프로젝트 폴더명과 식별 정보가 일치하지 않습니다: '+entry.name);this.checkNew(p);this.records.set(p.id,p.packageId);}
   const legacy=[];const packages=new Map([...this.records].map(([id,pkg])=>[pkg,id]));
   for(const entry of entries.filter(x=>x.isFile()&&x.name.endsWith('.json'))){const p=await readJson(path.join(this.projects,entry.name));assertValid(p);if(entry.name!==p.id+'.json')throw new Error('기존 프로젝트 파일명과 ID가 일치하지 않습니다.');if(this.records.has(p.id)){if(this.records.get(p.id)!==p.packageId)throw new Error('기존 프로젝트와 새 폴더의 패키지명이 다릅니다.');continue;}if(packages.has(p.packageId))throw new Error('같은 패키지명을 사용하는 프로젝트가 있습니다: '+p.packageId);packages.set(p.packageId,p.id);legacy.push(p);}
   for(const p of legacy){await this.createLocked(p,{sourceRoot:this.root,migrated:true});this.migration.migrated++;}
   for(const id of this.records.keys())await this.migrateNames(id);
   return this;
  }catch(e){await this.close();throw e;}
 }
 async close(){if(!this.locked)return;const file=path.join(this.root,'.storage.lock');const record=await readJson(file,null);if(record?.nonce===this.nonce)await fs.unlink(file).catch(e=>{if(e.code!=='ENOENT')throw e;});this.locked=false;}
 checkNew(p){if(this.records.has(p.id))throw new Error('같은 ID의 프로젝트가 이미 있습니다. 기존 프로젝트를 열어 주세요.');if([...this.records.values()].includes(p.packageId))throw new Error('이미 같은 패키지명을 사용하는 프로젝트가 있습니다. 다른 패키지명을 입력하거나 기존 프로젝트를 열어 주세요.');}
 async rootFor(input){const id=typeof input==='string'?input:input?.id;if(!validId(id)||!this.records.has(id))throw new Error('등록된 프로젝트를 찾을 수 없습니다.');const pkg=this.records.get(id);if(typeof input==='object'&&input.packageId!==pkg)throw new Error('기존 프로젝트 앱 ID는 변경할 수 없습니다.');const dir=path.join(this.projects,pkg);await directory(dir);for(const name of ['assets','previews','builds','backups'])await directory(path.join(dir,name));const marker=await metadata(dir,'storage.json');if(marker.version!==2||marker.projectId!==id||marker.packageId!==pkg)throw new Error('프로젝트 저장 정보가 일치하지 않습니다.');return dir;}
 async load(id){const dir=await this.rootFor(id),p=await metadata(dir,'theme.json');assertValid(p);if(p.id!==id||p.packageId!==this.records.get(id))throw new Error('프로젝트 폴더명과 식별 정보가 일치하지 않습니다.');return p;}
 async list(){return Promise.all([...this.records.keys()].map(id=>this.load(id)));}
 async createLocked(p,{sourceRoot,assets,migrated=false}={}){
  assertValid(p);this.checkNew(p);const target=path.join(this.projects,p.packageId);if(await exists(target))throw new Error('같은 이름의 프로젝트 폴더가 이미 있습니다: '+p.packageId);
  const stage=await fs.mkdtemp(path.join(this.root,'.staging','project-'));try{
   await atomic(path.join(stage,'operation.json'),JSON.stringify({owner:'kakao-theme-studio',pid:process.pid,nonce:this.nonce,projectId:p.id,packageId:p.packageId}));
   for(const folder of ['assets','previews','builds','backups'])await fs.mkdir(path.join(stage,folder),{mode:0o700});
   for(const ref of assetReferences(p)){let bytes;if(assets){bytes=assets.get(ref);if(!bytes)throw new Error('자산이 누락되었습니다.');}else if(sourceRoot)bytes=await readAsset(sourceRoot,ref,p.assetHashes?.[ref]);else throw new Error('새 프로젝트의 자산 원본을 찾을 수 없습니다.');await writeAsset(stage,ref,bytes,{expectedHash:p.assetHashes?.[ref]});await readAsset(stage,ref);}
   const named=await migrateAssetReferences(stage,p);p=named.project;assertValid(p);await atomic(path.join(stage,'theme.json'),JSON.stringify(p,null,2));await atomic(path.join(stage,'storage.json'),JSON.stringify({version:2,assetNamingVersion:1,projectId:p.id,packageId:p.packageId,createdAt:new Date().toISOString(),migratedFromLegacy:migrated},null,2));
   await fs.unlink(path.join(stage,'operation.json'));if(await exists(target))throw new Error('프로젝트 폴더가 이미 있습니다.');await fs.rename(stage,target);this.records.set(p.id,p.packageId);return p;
  }catch(e){await fs.rm(stage,{recursive:true,force:true});throw e;}
 }
 async save(p){const snapshot=structuredClone(p);return this.transaction(async()=>{assertValid(snapshot);if(!this.records.has(snapshot.id))return this.createLocked(snapshot);const dir=await this.rootFor(snapshot);await this.load(snapshot.id);for(const ref of assetReferences(snapshot))await assetFile(dir,ref);await atomic(path.join(dir,'theme.json'),JSON.stringify(snapshot,null,2));return snapshot;});}
 async clone(p){const snapshot=structuredClone(p);return this.transaction(async()=>{assertValid(snapshot);const sourceRoot=await this.rootFor(snapshot);return this.createLocked(cloneProject(snapshot),{sourceRoot});});}
 async import(buf,{asNew=false}={}){const parsed=await readProjectArchive(buf);return this.transaction(()=>this.createLocked(asNew?cloneProject(parsed.project):parsed.project,{assets:parsed.assets}));}
 async backup(id){return this.transaction(async()=>{const p=await this.load(id),dir=await this.rootFor(id),bytes=await exportProject(p,dir),name=backupFilename(p);await atomic(path.join(dir,'backups',name),bytes);return {bytes,name};});}
 async migrateNames(id){const dir=await this.rootFor(id),p=await this.load(id),marker=await metadata(dir,'storage.json');const old=assetReferences(p).some(legacyAssetRef);if(old){const backup=path.join(dir,'backups','asset-names-'+crypto.randomUUID());await fs.mkdir(backup,{mode:0o700});await atomic(path.join(backup,'theme.json'),JSON.stringify(p,null,2));await atomic(path.join(backup,'storage.json'),JSON.stringify(marker,null,2));const {project,changed}=await migrateAssetReferences(dir,p);assertValid(project);await atomic(path.join(dir,'theme.json'),JSON.stringify(project,null,2));this.migration.namedProjects++;this.migration.namedReferences+=changed;}if(marker.assetNamingVersion!==1)await atomic(path.join(dir,'storage.json'),JSON.stringify({...marker,assetNamingVersion:1},null,2));}
 async info(id){const p=await this.load(id),dir=await this.rootFor(id),used=new Set(assetReferences(p)),assets=[];for(const ref of await listAssetFiles(dir)){const file=await assetFile(dir,ref),stat=await fs.stat(file);assets.push({ref,bytes:stat.size,used:used.has(ref),legacy:legacyAssetRef(ref),slots:Object.entries(p.assets).filter(([,r])=>r===ref).map(([s])=>s),outputs:Object.entries(p.resourceOverrides??{}).filter(([,r])=>r===ref).map(([s])=>s)});}assets.sort((a,b)=>Number(b.used)-Number(a.used)||a.ref.localeCompare(b.ref));return {projectId:p.id,packageId:p.packageId,directory:dir,storageVersion:2,assetNamingVersion:1,assetCount:assets.length,usedAssetCount:assets.filter(a=>a.used).length,assetBytes:assets.reduce((n,a)=>n+a.bytes,0),assets};}

 async buildDirectories(){const roots=[path.join(this.root,'builds')];for(const id of this.records.keys())roots.push(path.join(await this.rootFor(id),'builds'));const out=[];for(const root of roots){let entries=[];try{await directory(root);entries=await fs.readdir(root,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')continue;throw e;}for(const entry of entries)if(validId(entry.name)){if(!entry.isDirectory()||entry.isSymbolicLink())throw new Error('빌드 저장 경로를 확인하세요.');const dir=path.join(root,entry.name),report=await readJson(path.join(dir,'build-report.json'),null);if(report?.id===entry.name){const owner=[...this.records].find(([,pkg])=>root===path.join(this.projects,pkg,'builds'));if(owner&&report.projectId!==owner[0])throw new Error('빌드의 소유 프로젝트가 일치하지 않습니다.');out.push({dir,report});}}}return out;}
 async listBuilds(){return (await this.buildDirectories()).map(x=>x.report).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 async buildDirectory(id){if(!validId(id))throw new Error('빌드 ID가 잘못되었습니다.');const entries=(await this.buildDirectories()).filter(x=>x.report.id===id);if(entries.length!==1)throw new Error('빌드 결과를 찾을 수 없거나 중복됩니다.');return entries[0].dir;}
}
export async function openProjectStore(root){return new ProjectStore(root).initialize();}
