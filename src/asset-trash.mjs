import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {assetFile,readAsset,validAssetRef} from './asset-store.mjs';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const uuid=s=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(s??'');
async function directory(dir,create=false){if(create)await fs.mkdir(dir,{mode:0o700}).catch(e=>{if(e.code!=='EEXIST')throw e;});const s=await fs.lstat(dir);if(!s.isDirectory()||s.isSymbolicLink())throw new Error('보관함 폴더에 링크를 사용할 수 없습니다.');}
async function fileExists(file){try{const s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink())throw new Error('보관함 파일 경로를 확인하세요.');return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
async function trashRoot(root,create=false){const dir=path.join(root,'asset-trash');if(!create){try{await directory(dir);}catch(e){if(e.code==='ENOENT')return null;throw e;}}else await directory(dir,true);return dir;}
async function batchDir(root,id){if(!uuid(id))throw new Error('보관함 식별자가 잘못되었습니다.');const parent=await trashRoot(root);if(!parent)throw new Error('보관함이 비어 있습니다.');const dir=path.join(parent,id);await directory(dir);return dir;}
async function manifest(root,id){const dir=await batchDir(root,id),file=path.join(dir,'manifest.json');if(!await fileExists(file))throw new Error('보관함 기록이 없습니다.');const m=JSON.parse(await fs.readFile(file,'utf8'));if(m.version!==1||m.id!==id||!Array.isArray(m.assets)||!m.assets.every(a=>validAssetRef(a.ref)&&/^[a-f0-9]{64}$/.test(a.sha256)&&Number.isSafeInteger(a.bytes)&&a.bytes>=0))throw new Error('보관함 기록이 잘못되었습니다.');return {dir,m};}
async function archivedFile(dir,ref,create=false){if(!validAssetRef(ref))throw new Error('자산 경로가 잘못되었습니다.');let base=dir;for(const part of ref.split('/').slice(0,-1)){base=path.join(base,part);await directory(base,create);}const file=path.join(dir,ref);return await fileExists(file)?file:null;}
export async function listAssetTrash(root){const dir=await trashRoot(root);if(!dir)return [];const out=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(entry.isSymbolicLink())throw new Error('보관함에 링크를 사용할 수 없습니다.');if(!entry.isDirectory()||!uuid(entry.name))continue;if(!await fileExists(path.join(dir,entry.name,'manifest.json')))continue;const {dir:batch,m}=await manifest(root,entry.name);for(const a of m.assets){let file;try{file=await archivedFile(batch,a.ref);}catch(e){if(e.code==='ENOENT')continue;throw e;}if(file)out.push({...a,batchId:m.id,archivedAt:m.createdAt});}}return out.sort((a,b)=>b.archivedAt.localeCompare(a.archivedAt)||a.ref.localeCompare(b.ref));}
export async function readTrashAsset(root,id,ref){const {dir,m}=await manifest(root,id),a=m.assets.find(a=>a.ref===ref);if(!a)throw new Error('보관함 이미지를 찾을 수 없습니다.');const file=await archivedFile(dir,ref);if(!file)throw new Error('이미 복구된 이미지입니다.');const bytes=await fs.readFile(file);if(digest(bytes)!==a.sha256||bytes.length!==a.bytes)throw new Error('보관함 원본의 해시가 일치하지 않습니다.');return bytes;}
export async function archiveAssets(root,refs){
 // Validate the entire selection before moving anything. The index reserves old versions.
 const assets=[];for(const ref of refs){const bytes=await readAsset(root,ref);assets.push({ref,sha256:digest(bytes),bytes:bytes.length});}
 const parent=await trashRoot(root,true),id=crypto.randomUUID(),dir=path.join(parent,id);await directory(dir,true);const m={version:1,id,createdAt:new Date().toISOString(),assets};
 await fs.writeFile(path.join(dir,'manifest.tmp'),JSON.stringify(m,null,2),{mode:0o600,flag:'wx'});await fs.rename(path.join(dir,'manifest.tmp'),path.join(dir,'manifest.json'));
 const moved=[],errors=[];for(const a of assets){try{await archivedFile(dir,a.ref,true);await fs.rename(await assetFile(root,a.ref),path.join(dir,a.ref));moved.push(a.ref);}catch(e){errors.push({ref:a.ref,message:e.message});}}
 // The manifest is written first. After interruption, actual file locations determine status.
 return {batchId:id,moved,errors};
}
export async function restoreAssets(root,items){
 const validated=[];for(const item of items){const bytes=await readTrashAsset(root,item.batchId,item.ref),{dir}=await manifest(root,item.batchId),source=await archivedFile(dir,item.ref),target=await assetFile(root,item.ref,{create:true});if(await fileExists(target)){if(digest(await fs.readFile(target))!==digest(bytes))throw new Error('원래 위치에 다른 파일이 있어 복구할 수 없습니다.');}validated.push({item,source,target});}
 const restored=[],errors=[];for(const {item,source,target} of validated){try{try{await fs.link(source,target);}catch(e){if(e.code!=='EEXIST')throw e; // Never replace an existing original.
 if(digest(await fs.readFile(target))!==digest(await fs.readFile(source)))throw new Error('원래 위치의 파일이 변경되었습니다.');}
 await fs.unlink(source);restored.push(item.ref);}catch(e){errors.push({ref:item.ref,message:e.message});}}
 return {restored,errors};
}

export async function deleteUnusedAssets(root,refs){
 const files=[];for(const ref of refs){await readAsset(root,ref);files.push({ref,file:await assetFile(root,ref)});}
 const deleted=[],errors=[];for(const {ref,file} of files){try{await fs.unlink(file);deleted.push(ref);}catch(e){errors.push({ref,message:e.message});}}return {deleted,errors};
}
export async function deleteTrashAssets(root,items){
 const files=[];for(const item of items){await readTrashAsset(root,item.batchId,item.ref);const {dir}=await manifest(root,item.batchId);files.push({ref:item.ref,file:await archivedFile(dir,item.ref)});}
 const deleted=[],errors=[];for(const {ref,file} of files){try{await fs.unlink(file);deleted.push(ref);}catch(e){errors.push({ref,message:e.message});}}return {deleted,errors};
}
