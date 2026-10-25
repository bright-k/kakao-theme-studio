import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {validAssetRef,legacyAssetRef,namedAssetRef} from './asset-names.mjs';
export {validAssetRef,legacyAssetRef,namedAssetRef} from './asset-names.mjs';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');const queues=new Map();
async function atomic(file,bytes){const tmp=file+'.'+crypto.randomUUID()+'.tmp';try{await fs.writeFile(tmp,bytes,{mode:0o600,flag:'wx'});await fs.rename(tmp,file);}finally{await fs.unlink(tmp).catch(e=>{if(e.code!=='ENOENT')throw e;});}}
async function folder(dir,{create=false}={}){if(create)await fs.mkdir(dir,{mode:0o700}).catch(e=>{if(e.code!=='EEXIST')throw e;});const stat=await fs.lstat(dir);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('자산 폴더에 링크를 사용할 수 없습니다.');}
async function assetRoot(root,{create=false}={}){await folder(root);await folder(path.join(root,'assets'),{create});}
async function index(root){await assetRoot(root);const file=path.join(root,'assets','index.json');let bytes;try{const s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink())throw new Error('자산 메타데이터 경로를 확인하세요.');bytes=await fs.readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return {version:1,files:{}};throw e;}const data=JSON.parse(bytes);if(data.version!==1||!data.files||Array.isArray(data.files)||typeof data.files!=='object')throw new Error('자산 메타데이터 형식이 잘못되었습니다.');return data;}
async function queued(root,fn){const key=path.resolve(root),work=(queues.get(key)??Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,work);try{return await work;}finally{if(queues.get(key)===work)queues.delete(key);}}
export async function assetFile(root,ref,{create=false}={}){
 if(!validAssetRef(ref))throw new Error('자산 경로가 잘못되었습니다.');await assetRoot(root,{create});const parts=ref.split('/');let dir=path.join(root,'assets');for(const name of parts.slice(1,-1)){dir=path.join(dir,name);await folder(dir,{create});}
 const file=path.join(root,ref);try{const s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink())throw new Error('자산 파일에 링크를 사용할 수 없습니다.');}catch(e){if(e.code!=='ENOENT'||!create)throw e;}return file;
}
export async function assetRecord(root,ref){if(!validAssetRef(ref))throw new Error('자산 경로가 잘못되었습니다.');if(legacyAssetRef(ref))return {sha256:path.basename(ref,'.png')};const data=await index(root),record=data.files[ref];if(!record||!/^[a-f0-9]{64}$/.test(record.sha256??''))throw new Error('원본 이미지의 검증 정보가 없습니다.');return record;}
export async function readAsset(root,ref,expectedHash){const bytes=await fs.readFile(await assetFile(root,ref)),record=await assetRecord(root,ref);if(hash(bytes)!==record.sha256||expectedHash&&expectedHash!==record.sha256)throw new Error('자산 해시가 일치하지 않습니다.');return bytes;}
export async function writeAsset(root,ref,bytes,{expectedHash,target}={}){
 if(!validAssetRef(ref))throw new Error('자산 경로가 잘못되었습니다.');const digest=hash(bytes);if(expectedHash&&expectedHash!==digest||legacyAssetRef(ref)&&digest!==path.basename(ref,'.png'))throw new Error('자산 해시가 일치하지 않습니다.');
 return queued(root,async()=>{const file=await assetFile(root,ref,{create:true});if(namedAssetRef(ref)){const data=await index(root);try{const existing=await fs.readFile(file);if(hash(existing)!==digest||data.files[ref]&&data.files[ref].sha256!==digest)throw new Error('같은 원본 버전을 다른 이미지로 덮어쓸 수 없습니다.');}catch(e){if(e.code!=='ENOENT')throw e;}await atomic(file,bytes);data.files[ref]={sha256:digest,bytes:bytes.length,...(target?{target}:{})};await atomic(path.join(root,'assets','index.json'),JSON.stringify(data,null,2));}else await atomic(file,bytes);return ref;});
}
export async function registerAsset(root,project,target,bytes,{nativeNinePatch=false}={}){
 if(!/^assets\/(common|ios|android)\/(?:[a-z0-9][a-z0-9_-]*\/)*[a-z][a-z0-9_-]*$/.test(target.base))throw new Error('원본 등록 위치를 확인하세요.');
 return queued(root,async()=>{await assetRoot(root,{create:true});const data=await index(root),known=new Set([...Object.keys(data.files),...Object.keys(project.assetHashes??{}),...Object.values(project.assets??{}),...Object.values(project.resourceOverrides??{})]);const ext=nativeNinePatch?'.9.png':'.png';let n=1,ref;
 for(;;n++){if(n>999999999)throw new Error('원본 버전 범위를 초과했습니다.');ref=target.base+'-v'+String(n).padStart(4,'0')+ext;if(known.has(ref))continue;const file=await assetFile(root,ref,{create:true});try{await fs.lstat(file);}catch(e){if(e.code==='ENOENT')break;throw e;}}
 const file=await assetFile(root,ref,{create:true}),digest=hash(bytes);await fs.writeFile(file,bytes,{mode:0o600,flag:'wx'});data.files[ref]={sha256:digest,bytes:bytes.length,target};try{await atomic(path.join(root,'assets','index.json'),JSON.stringify(data,null,2));}catch(e){await fs.unlink(file);throw e;}
 project.assetHashes??={};project.assetHashes[ref]=digest;return ref;
 });
}
export async function listAssetFiles(root){await assetRoot(root);const refs=[];async function walk(dir,prefix){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const ref=prefix+'/'+entry.name;if(entry.isSymbolicLink())throw new Error('자산 폴더에 링크를 사용할 수 없습니다.');if(entry.isDirectory())await walk(path.join(dir,entry.name),ref);else if(validAssetRef(ref))refs.push(ref);}}await walk(path.join(root,'assets'),'assets');return refs.sort();}
