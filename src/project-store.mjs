import {projectTrashRecords,projectTrashRecord,archiveProjectFolder,restoreProjectFolder,deleteProjectFolder,safeProjectTree} from './project-trash.mjs';
import {listAssetTrash,readTrashAsset,archiveAssets,restoreAssets,deleteUnusedAssets,deleteTrashAssets} from './asset-trash.mjs';
import {platformBubbleAssets} from '../public/bubble-model.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {assertValid,validId,cloneProject,atomic,readJson,exportProject,projectRevision} from './core.mjs';
import {assetReferences} from './resources.mjs';
import {assetFile,readAsset,writeAsset,listAssetFiles,legacyAssetRef,validAssetRef} from './asset-store.mjs';
import {migrateAssetReferences} from './asset-migration.mjs';
import {readProjectArchive,backupFilename} from './project-archive.mjs';
const exists=async file=>{try{await fs.lstat(file);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
const alive=pid=>{if(!Number.isInteger(pid)||pid<=0)return false;try{process.kill(pid,0);return true;}catch(e){return e.code!=='ESRCH';}};
async function metadata(dir,name){const file=path.join(dir,name),stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('프로젝트 메타데이터에 링크를 사용할 수 없습니다.');return readJson(file);}
async function directory(dir){const stat=await fs.lstat(dir);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('프로젝트 저장 폴더에 링크를 사용할 수 없습니다.');}
export class ProjectStore {
 constructor(root){this.root=path.resolve(root);this.projects=path.join(this.root,'projects');this.records=new Map();this.assetHistories=new Map();this.retiredProjects=new Map();this.queue=Promise.resolve();this.nonce=crypto.randomUUID();this.migration={migrated:0,namedProjects:0,namedReferences:0,preservedStaging:0};}
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
   for(const {m} of await projectTrashRecords(this.root))this.retiredProjects.set(m.projectId,m.packageId);
   const entries=await fs.readdir(this.projects,{withFileTypes:true});
   for(const entry of entries){const dir=path.join(this.projects,entry.name);if(entry.isSymbolicLink())throw new Error('프로젝트 폴더에 링크를 사용할 수 없습니다.');if(!entry.isDirectory())continue;if(!await exists(path.join(dir,'storage.json'))){if(await exists(path.join(dir,'theme.json')))throw new Error('완료 표시가 없는 프로젝트 폴더가 있습니다: '+entry.name);continue;}const p=await metadata(dir,'theme.json'),marker=await metadata(dir,'storage.json');assertValid(p);if(entry.name!==p.packageId||marker.version!==2||marker.projectId!==p.id||marker.packageId!==p.packageId)throw new Error('프로젝트 폴더명과 식별 정보가 일치하지 않습니다: '+entry.name);this.checkNew(p);this.records.set(p.id,p.packageId);}
   const legacy=[];const packages=new Map([...this.records].map(([id,pkg])=>[pkg,id]));
   for(const entry of entries.filter(x=>x.isFile()&&x.name.endsWith('.json'))){const p=await readJson(path.join(this.projects,entry.name));assertValid(p);if(entry.name!==p.id+'.json')throw new Error('기존 프로젝트 파일명과 ID가 일치하지 않습니다.');if(this.retiredProjects.has(p.id))continue;if(this.records.has(p.id)){if(this.records.get(p.id)!==p.packageId)throw new Error('기존 프로젝트와 새 폴더의 패키지명이 다릅니다.');continue;}if(packages.has(p.packageId))throw new Error('같은 패키지명을 사용하는 프로젝트가 있습니다: '+p.packageId);packages.set(p.packageId,p.id);legacy.push(p);}
   for(const p of legacy){await this.createLocked(p,{sourceRoot:this.root,migrated:true});this.migration.migrated++;}
   for(const id of this.records.keys())await this.migrateNames(id);
   return this;
  }catch(e){await this.close();throw e;}
 }
 async close(){if(!this.locked)return;const file=path.join(this.root,'.storage.lock');const record=await readJson(file,null);if(record?.nonce===this.nonce)await fs.unlink(file).catch(e=>{if(e.code!=='ENOENT')throw e;});this.locked=false;}
 checkNew(p){if(this.retiredProjects.has(p.id)||[...this.retiredProjects.values()].includes(p.packageId))throw new Error('정리한 프로젝트의 ID 또는 패키지명입니다. 프로젝트 보관함에서 복구하거나 새 ID로 가져오세요.');if(this.records.has(p.id))throw new Error('같은 ID의 프로젝트가 이미 있습니다. 기존 프로젝트를 열어 주세요.');if([...this.records.values()].includes(p.packageId))throw new Error('이미 같은 패키지명을 사용하는 프로젝트가 있습니다. 다른 패키지명을 입력하거나 기존 프로젝트를 열어 주세요.');}
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
 async import(buf,{asNew=false}={}){const parsed=await readProjectArchive(buf);return this.transaction(async()=>{const p=asNew?cloneProject(parsed.project):parsed.project,retired=this.retiredProjects.get(p.id);if(retired===p.packageId){const archived=(await projectTrashRecords(this.root)).some(x=>x.m.projectId===p.id&&x.hasFolder);if(archived)throw new Error('프로젝트 보관함에서 복구하거나 새 프로젝트로 가져오세요.');this.retiredProjects.delete(p.id);try{return await this.createLocked(p,{assets:parsed.assets});}catch(e){this.retiredProjects.set(p.id,retired);throw e;}}return this.createLocked(p,{assets:parsed.assets});});}
 async backup(id){return this.transaction(async()=>{const p=await this.load(id),dir=await this.rootFor(id),bytes=await exportProject(p,dir),name=backupFilename(p);await atomic(path.join(dir,'backups',name),bytes);return {bytes,name};});}
 async migrateNames(id){const dir=await this.rootFor(id),p=await this.load(id),marker=await metadata(dir,'storage.json');const old=assetReferences(p).some(legacyAssetRef);if(old){const backup=path.join(dir,'backups','asset-names-'+crypto.randomUUID());await fs.mkdir(backup,{mode:0o700});await atomic(path.join(backup,'theme.json'),JSON.stringify(p,null,2));await atomic(path.join(backup,'storage.json'),JSON.stringify(marker,null,2));const {project,changed}=await migrateAssetReferences(dir,p);assertValid(project);await atomic(path.join(dir,'theme.json'),JSON.stringify(project,null,2));this.migration.namedProjects++;this.migration.namedReferences+=changed;}if(marker.assetNamingVersion!==1)await atomic(path.join(dir,'storage.json'),JSON.stringify({...marker,assetNamingVersion:1},null,2));}
 async info(id){const p=await this.load(id),dir=await this.rootFor(id),used=new Set(assetReferences(p)),assets=[];for(const ref of await listAssetFiles(dir)){const file=await assetFile(dir,ref),stat=await fs.stat(file);assets.push({ref,bytes:stat.size,used:used.has(ref),legacy:legacyAssetRef(ref),slots:Object.entries(p.assets).filter(([,r])=>r===ref).map(([s])=>s).concat(platformBubbleAssets(p).filter(e=>e.ref===ref).map(e=>e.platform+' '+(e.who==='sent'?'보낸':'받은')+' '+(e.group?'연속':'첫')+' '+(e.kind==='body'?'본체':'캐릭터'))),outputs:Object.entries(p.resourceOverrides??{}).filter(([,r])=>r===ref).map(([s])=>s)});}assets.sort((a,b)=>Number(b.used)-Number(a.used)||a.ref.localeCompare(b.ref));return {projectId:p.id,packageId:p.packageId,directory:dir,storageVersion:2,assetNamingVersion:1,assetCount:assets.length,usedAssetCount:assets.filter(a=>a.used).length,assetBytes:assets.reduce((n,a)=>n+a.bytes,0),assets};}

 validateAssetHistory({clientId,sequence,project,historyRefs}){
  if(!validId(clientId)||!Number.isSafeInteger(sequence)||sequence<0||!Array.isArray(historyRefs)||historyRefs.length>20000||!historyRefs.every(validAssetRef))throw new Error('실행취소 이미지 참조를 확인하세요.');
  assertValid(project);return {clientId,sequence,projectId:project.id,refs:new Set([...assetReferences(project),...historyRefs])};
 }
 async protectAssetHistory(input){const next=this.validateAssetHistory(input);await this.rootFor(input.project);const previous=this.assetHistories.get(next.clientId);if(!previous||next.sequence>previous.sequence)this.assetHistories.set(next.clientId,next);return {protected:true};}
 releaseAssetHistory(clientId,sequence){if(!validId(clientId)||!Number.isSafeInteger(sequence))throw new Error('편집 기록 식별자를 확인하세요.');const prior=this.assetHistories.get(clientId);if(!prior||sequence>=prior.sequence)this.assetHistories.set(clientId,{clientId,sequence,projectId:null,refs:new Set()});}
 async cleanupState(input){
  await this.protectAssetHistory(input);const p=await this.load(input.project.id),dir=await this.rootFor(p),protectedRefs=new Set([...assetReferences(p),...assetReferences(input.project)]);
  for(const session of this.assetHistories.values())if(session.projectId===p.id)for(const ref of session.refs)protectedRefs.add(ref);
  const candidates=[];let protectedCount=0;for(const ref of await listAssetFiles(dir)){if(protectedRefs.has(ref)){protectedCount++;continue;}const bytes=await readAsset(dir,ref);candidates.push({ref,bytes:bytes.length});}
  return {dir,projectId:p.id,candidates,protectedCount};
 }
 async assetCleanup(input){return this.transaction(async()=>{const {dir,...state}=await this.cleanupState(input);return {...state,trash:await listAssetTrash(dir)};});}
 async archiveUnusedAssets(input){return this.removeUnusedAssets(input,false);}
 async deleteUnusedAssets(input){return this.removeUnusedAssets(input,true);}
 async removeUnusedAssets(input,permanent){return this.transaction(async()=>{
  const {dir,candidates}=await this.cleanupState(input),refs=input.refs;if(!Array.isArray(refs)||!refs.length||refs.length>1000||new Set(refs).size!==refs.length||!refs.every(validAssetRef))throw new Error('보관할 이미지를 선택하세요.');
  const allowed=new Set(candidates.map(a=>a.ref));if(refs.some(ref=>!allowed.has(ref)))throw new Error('현재 설정 또는 실행취소 기록에서 사용하는 이미지가 포함되어 있습니다. 목록을 새로고침하세요.');
  return permanent?deleteUnusedAssets(dir,refs):archiveAssets(dir,refs);
 });}
 async restoreAssetTrash(id,items){return this.changeAssetTrash(id,items,false);}
 async deleteAssetTrash(id,items){return this.changeAssetTrash(id,items,true);}
 async changeAssetTrash(id,items,permanent){return this.transaction(async()=>{const dir=await this.rootFor(id);if(!Array.isArray(items)||!items.length||items.length>1000||!items.every(x=>x&&validId(x.batchId)&&validAssetRef(x.ref))||new Set(items.map(x=>x.batchId+':'+x.ref)).size!==items.length)throw new Error('복구할 이미지를 선택하세요.');if(permanent){const protectedRefs=new Set(assetReferences(await this.load(id)));for(const session of this.assetHistories.values())if(session.projectId===id)for(const ref of session.refs)protectedRefs.add(ref);if(items.some(x=>protectedRefs.has(x.ref)))throw new Error('현재 설정 또는 실행취소 기록에서 사용하는 이미지는 삭제할 수 없습니다.');}return permanent?deleteTrashAssets(dir,items):restoreAssets(dir,items);});}
 async trashAsset(id,batchId,ref){return readTrashAsset(await this.rootFor(id),batchId,ref);}

 async manageProjects(){return this.transaction(async()=>{
  const active=[];for(const p of await this.list()){const dir=await this.rootFor(p),size=await safeProjectTree(dir),stat=await fs.stat(path.join(dir,'theme.json'));active.push({id:p.id,name:p.name,packageId:p.packageId,revision:projectRevision(p),updatedAt:stat.mtime.toISOString(),...size,assetCount:(await listAssetFiles(dir)).length});}
  const trash=[];for(const record of await projectTrashRecords(this.root))if(record.hasFolder&&record.m.status==='archived')trash.push({...record.m,...await safeProjectTree(record.projectDir)});
  return {active,trash,hasRemovedProjects:this.retiredProjects.size>0};
 });}
 async removedProjectInfo(p){const retired=this.retiredProjects.get(p.id)===p.packageId;return {retired,restorable:retired&&!(await projectTrashRecords(this.root)).some(x=>x.m.projectId===p.id&&x.hasFolder)};}
 async renameProject(id,name,revision){return this.transaction(async()=>{const p=await this.load(id);if(projectRevision(p)!==revision)throw new Error('프로젝트가 변경되었습니다. 목록을 새로고침하세요.');p.name=typeof name==='string'?name.trim():name;assertValid(p);await atomic(path.join(await this.rootFor(p),'theme.json'),JSON.stringify(p,null,2));return p;});}
 async removeProject(id,revision,permanent=false,busy=()=>false){return this.transaction(async()=>{
  if(busy())throw new Error('생성 작업이 끝난 뒤 프로젝트를 정리하세요.');
  const p=await this.load(id);if(projectRevision(p)!==revision)throw new Error('프로젝트가 변경되었습니다. 목록을 새로고침하세요.');const record=await archiveProjectFolder(this.root,await this.rootFor(p),p);this.records.delete(id);this.retiredProjects.set(id,p.packageId);for(const [key,session] of this.assetHistories)if(session.projectId===id)this.assetHistories.delete(key);
  if(permanent)await deleteProjectFolder(this.root,record.m.id);return {removed:id,archived:!permanent,trashId:record.m.id};
 });}
 async restoreProject(id){return this.transaction(async()=>{
  const record=await projectTrashRecord(this.root,id);if(this.records.has(record.m.projectId)||[...this.records.values()].includes(record.m.packageId))throw new Error('같은 프로젝트가 이미 등록되어 있습니다.');const p=await metadata(record.projectDir,'theme.json');assertValid(p);if(p.id!==record.m.projectId||p.packageId!==record.m.packageId)throw new Error('보관 프로젝트의 식별 정보가 일치하지 않습니다.');for(const ref of assetReferences(p))await readAsset(record.projectDir,ref,p.assetHashes?.[ref]);
  await restoreProjectFolder(this.root,id,path.join(this.projects,p.packageId));this.retiredProjects.delete(p.id);this.records.set(p.id,p.packageId);return p;
 });}
 async deleteStoredProject(id){return this.transaction(async()=>{const m=await deleteProjectFolder(this.root,id);this.retiredProjects.set(m.projectId,m.packageId);return {deleted:m.projectId};});}

 async buildDirectories(){const roots=[path.join(this.root,'builds')];for(const id of this.records.keys())roots.push(path.join(await this.rootFor(id),'builds'));const out=[];for(const root of roots){let entries=[];try{await directory(root);entries=await fs.readdir(root,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')continue;throw e;}for(const entry of entries)if(validId(entry.name)){if(!entry.isDirectory()||entry.isSymbolicLink())throw new Error('빌드 저장 경로를 확인하세요.');const dir=path.join(root,entry.name),report=await readJson(path.join(dir,'build-report.json'),null);if(report?.id===entry.name){if(this.retiredProjects.has(report.projectId))continue;const owner=[...this.records].find(([,pkg])=>root===path.join(this.projects,pkg,'builds'));if(owner&&report.projectId!==owner[0])throw new Error('빌드의 소유 프로젝트가 일치하지 않습니다.');out.push({dir,report});}}}return out;}
 async listBuilds(){return (await this.buildDirectories()).map(x=>x.report).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 async buildDirectory(id){if(!validId(id))throw new Error('빌드 ID가 잘못되었습니다.');const entries=(await this.buildDirectories()).filter(x=>x.report.id===id);if(entries.length!==1)throw new Error('빌드 결과를 찾을 수 없거나 중복됩니다.');return entries[0].dir;}
}
export async function openProjectStore(root){return new ProjectStore(root).initialize();}
