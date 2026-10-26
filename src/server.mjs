import {activateCommonBubbleBody,platformBubbleState,editPlatformBubble} from '../public/bubble-model.js';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {openProjectStore} from './project-store.mjs';
import {commonTarget,platformBubbleTarget} from './asset-names.mjs';
import {readProjectArchive} from './project-archive.mjs';
import {readAsset,registerAsset,validAssetRef} from './asset-store.mjs';
import { pathToFileURL } from 'node:url';
import { ROOT, newProject, validId, assertValid, validate, sha, normalizeUpload, compile } from './core.mjs';
import { KeyStore, doctor, buildBoth } from './android.mjs';
import { publicCatalog, COMPILER_VERSION } from './catalog.mjs';
import { makeEditorService } from './editor-service.mjs';

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json','.zip':'application/zip','.ktheme':'application/octet-stream','.apk':'application/vnd.android.package-archive','.p12':'application/x-pkcs12','.txt':'text/plain; charset=utf-8'};
export async function createStudio({dataRoot=process.env.THEME_STUDIO_DATA??path.join(ROOT,'.data'),token=crypto.randomBytes(24).toString('hex')}={}){
 const store=await openProjectStore(dataRoot);const keys=new KeyStore(dataRoot);const editor=makeEditorService(dataRoot,{resolveRoot:p=>store.rootFor(p)});const jobs=new Map();let queue=Promise.resolve();
 const load=id=>store.load(id),listProjects=()=>store.list(),save=p=>store.save(p);
 async function body(req){let n=0;const chunks=[];for await(const c of req){n+=c.length;if(n>34*1024*1024)throw new Error('요청이 너무 큽니다.');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
 function json(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
 async function file(res,f,download=false){const stat=await fs.lstat(f);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('파일 저장 경로를 확인하세요.');const buf=await fs.readFile(f);res.writeHead(200,{'Content-Type':MIME[path.extname(f)]??'application/octet-stream','Cache-Control':'no-store',...(download?{'Content-Disposition':`attachment; filename="${path.basename(f)}"`}:{})});res.end(buf);}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'");
  try{
   const origin=`http://127.0.0.1:${server.address().port}`;if(req.headers.host!==`127.0.0.1:${server.address().port}`){json(res,{error:'Invalid host'},403);return;}
   const u=new URL(req.url,origin);const url=u.pathname;
   if(url.startsWith('/api/')){
    if(req.headers.authorization!==`Bearer ${token}`||req.headers.origin&&req.headers.origin!==origin){json(res,{error:'인증되지 않은 요청입니다.'},403);return;}
    if(url==='/api/status'){json(res,{compilerVersion:COMPILER_VERSION,environment:await doctor(),keys:await keys.list(),storageVersion:2,assetNamingVersion:1,migration:store.migration});return;}
    if(url==='/api/projects'&&req.method==='GET'){json(res,await listProjects());return;}
    if(url==='/api/projects'&&req.method==='POST'){const b=await body(req);const p=newProject(b.name??'이끼 숲',b.palette??'forest',b.packageId);await save(p);json(res,p);return;}
    if(url==='/api/project'&&req.method==='PUT'){json(res,await save((await body(req)).project));return;}
    if(url==='/api/assets'&&req.method==='POST'){const b=await body(req);const p=b.project??await load(b.projectId);assertValid(p);const bytes=await normalizeUpload(Buffer.from(b.base64,'base64'));const next=structuredClone(p),ref=await registerAsset(await store.rootFor(p),next,commonTarget(b.slot),bytes);next.assets[b.slot]=ref;activateCommonBubbleBody(next,b.slot,p);assertValid(next);json(res,await save(next));return;}
    if(url==='/api/bubble-platform-asset'&&req.method==='POST'){const b=await body(req);assertValid(b.project);const target=platformBubbleTarget(b.platform,b.who,b.group,b.kind),next=structuredClone(b.project),bytes=await normalizeUpload(Buffer.from(b.base64,'base64')),ref=await registerAsset(await store.rootFor(next),next,target,bytes),state=platformBubbleState(next,b.platform,b.who,b.group,true);if(b.kind==='body')state.body=ref;else{state.character??={};state.character.image=ref;state.character.decorationEnabled=true;}editPlatformBubble(next,b.project,b.platform,b.who);assertValid(next);json(res,await save(next));return;}
    if(url==='/api/asset-file'){const ref=u.searchParams.get('ref');if(!validAssetRef(ref))throw new Error('자산 경로가 잘못되었습니다.');const id=u.searchParams.get('projectId'),p=await load(id),bytes=await readAsset(await store.rootFor(id),ref,p.assetHashes?.[ref]);res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(bytes);return;}
    if(url==='/api/resource-promote'&&req.method==='POST'){const b=await body(req);const result=await editor.promoteResource(b.project,b);await save(result.project);json(res,result);return;}
    if(url==='/api/validate'){json(res,validate((await body(req)).project));return;}
    if(url==='/api/preview'&&req.method==='POST'){json(res,await editor.preview((await body(req)).project));return;}
    if(url==='/api/catalog'){json(res,publicCatalog());return;}
    if(url==='/api/details'&&req.method==='POST'){const p=(await body(req)).project;assertValid(p);json(res,editor.details(p));return;}
    if(url==='/api/project-clone'&&req.method==='POST'){const p=(await body(req)).project;assertValid(p);json(res,await store.clone(p));return;}
    if(url==='/api/resource'&&req.method==='POST'){const b=await body(req);assertValid(b.project);const r=await editor.singleResource(b.project,b);await save(r.project);json(res,r);return;}
    if(url==='/api/resources-import'&&req.method==='POST'){const b=await body(req);assertValid(b.project);const items=await editor.bulkItems(b);const r=await editor.applyResources(b.project,items);await save(r.project);json(res,r);return;}
    if(url==='/api/resource-template'){const p=await load(u.searchParams.get('id'));const buf=await editor.resourceTemplate(p);res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="theme-resources.zip"'});res.end(buf);return;}
    if(url==='/api/preview-file'){const rev=u.searchParams.get('revision'),name=u.searchParams.get('name');if(!/^[a-f0-9]{64}$/.test(rev)||!name||name.includes('..')||!/^((ios\/Images)|(android\/res\/[\w-]+))\/[\w@.-]+\.png$/.test(name))throw new Error('경로가 잘못되었습니다.');await file(res,path.join(await store.rootFor(u.searchParams.get('projectId')),'previews',rev,name));return;}
    if(url==='/api/asset-history'&&req.method==='POST'){const b=await body(req);if(b.release){store.releaseAssetHistory(b.clientId,b.sequence);json(res,{released:true});}else json(res,await store.protectAssetHistory(b));return;}
    if(url==='/api/asset-cleanup'&&req.method==='POST'){json(res,await store.assetCleanup(await body(req)));return;}
    if(url==='/api/asset-archive'&&req.method==='POST'){json(res,await store.archiveUnusedAssets(await body(req)));return;}
    if(url==='/api/asset-delete'&&req.method==='POST'){json(res,await store.deleteUnusedAssets(await body(req)));return;}
    if(url==='/api/asset-trash-delete'&&req.method==='POST'){const b=await body(req);json(res,await store.deleteAssetTrash(b.projectId,b.items));return;}
    if(url==='/api/asset-restore'&&req.method==='POST'){const b=await body(req);json(res,await store.restoreAssetTrash(b.projectId,b.items));return;}
    if(url==='/api/asset-trash-file'&&req.method==='GET'){const bytes=await store.trashAsset(u.searchParams.get('projectId'),u.searchParams.get('batchId'),u.searchParams.get('ref'));res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'no-store'});res.end(bytes);return;}
    if(url==='/api/project-management'&&req.method==='GET'){json(res,await store.manageProjects());return;}
    if(url==='/api/project-rename'&&req.method==='POST'){const b=await body(req);json(res,await store.renameProject(b.id,b.name,b.revision));return;}
    if(url==='/api/project-remove'&&req.method==='POST'){const b=await body(req);if(!['archive','delete'].includes(b.mode))throw new Error('정리 방식을 선택하세요.');if([...jobs.values()].some(j=>j.projectId===b.id&&['queued','running'].includes(j.status)))throw new Error('생성 작업이 끝난 뒤 프로젝트를 정리하세요.');json(res,await store.removeProject(b.id,b.revision,b.mode==='delete',()=>[...jobs.values()].some(j=>j.projectId===b.id&&['queued','running'].includes(j.status))));return;}
    if(url==='/api/project-restore'&&req.method==='POST'){json(res,await store.restoreProject((await body(req)).id));return;}
    if(url==='/api/project-trash-delete'&&req.method==='POST'){json(res,await store.deleteStoredProject((await body(req)).id));return;}
    if(url==='/api/project-storage'){json(res,await store.info(u.searchParams.get('id')));return;}
    if(url==='/api/project-folder'&&req.method==='POST'){const b=await body(req),dir=await store.rootFor(b.id);const executable=process.platform==='darwin'?'open':process.platform==='win32'?'explorer.exe':'xdg-open';await new Promise((resolve,reject)=>{const child=spawn(executable,[dir],{shell:false,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('프로젝트 폴더를 열 수 없습니다.')));});json(res,{opened:true});return;}
    if(url==='/api/project-export'){const {bytes,name}=await store.backup(u.searchParams.get('id'));res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':"attachment; filename=\"theme-project.zip\"; filename*=UTF-8''"+encodeURIComponent(name)});res.end(bytes);return;}
    if(url==='/api/project-import-check'&&req.method==='POST'){const b=await body(req),parsed=await readProjectArchive(Buffer.from(b.base64,'base64')),p=parsed.project,existing=(await store.list()).find(x=>x.id===p.id||x.packageId===p.packageId);json(res,{id:p.id,name:p.name,packageId:p.packageId,existingId:existing?.id??null,...await store.removedProjectInfo(p)});return;}
    if(url==='/api/project-import'&&req.method==='POST'){const b=await body(req);json(res,await store.import(Buffer.from(b.base64,'base64'),{asNew:b.asNew===true}));return;}
    if(url==='/api/keys'&&req.method==='POST'){const b=await body(req);json(res,await keys.create(b.label,b.password));return;}
    if(url==='/api/keys/unlock'&&req.method==='POST'){const b=await body(req);json(res,await keys.unlock(b.id,b.password));return;}
    if(url==='/api/keys/import'&&req.method==='POST'){const b=await body(req);json(res,await keys.import(b.label,b.password,Buffer.from(b.base64,'base64')));return;}
    if(url==='/api/keys/backup'){const id=u.searchParams.get('id');await keys.signing(id);await file(res,path.join(dataRoot,'keys',`${id}.p12`),true);return;}
    if(url==='/api/build'&&req.method==='POST'){
     const p=(await body(req)).project;assertValid(p);await save(p);const id=crypto.randomUUID();const job={id,projectId:p.id,status:'queued',step:'대기 중',report:null};jobs.set(id,job);queue=queue.then(async()=>{job.status='running';try{job.step='리소스 변환';const projectRoot=await store.rootFor(p);const c=await compile(p,projectRoot);job.report=await buildBoth(c,dataRoot,keys,s=>job.step=s,{projectRoot});job.status=job.report.status;job.step=job.status==='success'?'두 플랫폼 생성 완료':'iOS 완료 · Android 확인 필요';}catch(e){job.status='failed';job.step=e.message;}});json(res,job,202);return;
    }
    if(url==='/api/job'){const j=jobs.get(u.searchParams.get('id'));if(!j)throw new Error('작업을 찾을 수 없습니다.');json(res,j);return;}
    if(url==='/api/builds'){json(res,await store.listBuilds());return;}
    if(url==='/api/download'){const id=u.searchParams.get('id'),name=u.searchParams.get('name');if(!validId(id)||!['theme-ios.ktheme','theme-android.apk','theme-bundle.zip','build-report.json','install-guide.html','signature-verification.txt'].includes(name))throw new Error('잘못된 다운로드입니다.');await file(res,path.join(await store.buildDirectory(id),name),true);return;}
    json(res,{error:'API를 찾을 수 없습니다.'},404);return;
   }
   const staticFiles={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/history.js':'history.js','/asset-references.js':'asset-references.js','/asset-cleanup.js':'asset-cleanup.js','/project-manager.js':'project-manager.js','/preview-renderer.js':'preview-renderer.js','/catalog-editor.js':'catalog-editor.js','/screen-model.js':'screen-model.js','/geometry-model.js':'geometry-model.js','/visual-geometry.js':'visual-geometry.js','/bubble-model.js':'bubble-model.js','/bubble-guides.js':'bubble-guides.js','/design-editor.js':'design-editor.js','/platform-bubble-editor.js':'platform-bubble-editor.js','/common-colors.js':'common-colors.js','/common-color-editor.js':'common-color-editor.js','/component-preview.js':'component-preview.js','/preview-interaction.js':'preview-interaction.js','/preview-queue.js':'preview-queue.js'};if(!staticFiles[url]){res.writeHead(404);res.end('Not found');return;}await file(res,path.join(ROOT,'public',staticFiles[url]));
  }catch(e){json(res,{error:e.code==='ENOENT'?'파일을 찾을 수 없습니다.':e.message,diagnostics:e.diagnostics},400);}
 });
 const close=server.close.bind(server);server.close=callback=>close(async error=>{try{await queue.catch(()=>{});await store.queue.catch(()=>{});await store.close();callback?.(error);}catch(e){callback?.(e);}});
 return {server,token,dataRoot,keys,store};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const studio=await createStudio();const port=Number(process.env.PORT??4317);studio.server.listen(port,'127.0.0.1',()=>{console.log(`Kakao Theme Studio: http://127.0.0.1:${studio.server.address().port}/#${studio.token}`);});studio.server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'4317 포트가 사용 중입니다. 기존 창 또는 터미널을 확인하세요.':e.message);process.exitCode=1;});}
