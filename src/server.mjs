import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT, newProject, cloneProject, validId, assertValid, validate, sha, normalizeUpload, atomic, readJson, compile, writeTree, exportProject, importProject } from './core.mjs';
import { KeyStore, doctor, buildBoth } from './android.mjs';
import { publicCatalog } from './catalog.mjs';
import { makeEditorService } from './editor-service.mjs';

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json','.zip':'application/zip','.ktheme':'application/octet-stream','.apk':'application/vnd.android.package-archive','.p12':'application/x-pkcs12','.txt':'text/plain; charset=utf-8'};
export async function createStudio({dataRoot=process.env.THEME_STUDIO_DATA??path.join(ROOT,'.data'),token=crypto.randomBytes(24).toString('hex')}={}){
 await fs.mkdir(dataRoot,{recursive:true,mode:0o700});const keys=new KeyStore(dataRoot);const editor=makeEditorService(dataRoot);const jobs=new Map();let queue=Promise.resolve();let previewQueue=Promise.resolve();
 const projectFile=id=>{if(!validId(id))throw new Error('프로젝트 ID가 잘못되었습니다.');return path.join(dataRoot,'projects',`${id}.json`);};
 const load=id=>readJson(projectFile(id));
 const listProjects=async()=>{let entries=[];try{entries=await fs.readdir(path.join(dataRoot,'projects'));}catch(e){if(e.code!=='ENOENT')throw e;}return Promise.all(entries.filter(f=>f.endsWith('.json')).map(f=>readJson(path.join(dataRoot,'projects',f))));};
 let saveQueue=Promise.resolve();
 const save=async p=>{assertValid(p);const saving=saveQueue.catch(()=>{}).then(async()=>{const old=await readJson(projectFile(p.id),null);if(old&&old.packageId!==p.packageId)throw new Error('기존 프로젝트 앱 ID는 변경할 수 없습니다.');if(!old&&(await listProjects()).some(x=>x.packageId===p.packageId))throw new Error('이미 같은 패키지명을 사용하는 프로젝트가 있습니다. 다른 패키지명을 입력하거나 기존 프로젝트를 열어 주세요.');await atomic(projectFile(p.id),JSON.stringify(p,null,2));return p;});saveQueue=saving;return saving;};
 async function body(req){let n=0;const chunks=[];for await(const c of req){n+=c.length;if(n>34*1024*1024)throw new Error('요청이 너무 큽니다.');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
 function json(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
 async function file(res,f,download=false){const buf=await fs.readFile(f);res.writeHead(200,{'Content-Type':MIME[path.extname(f)]??'application/octet-stream','Cache-Control':'no-store',...(download?{'Content-Disposition':`attachment; filename="${path.basename(f)}"`}:{})});res.end(buf);}
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'");
  try{
   const origin=`http://127.0.0.1:${server.address().port}`;if(req.headers.host!==`127.0.0.1:${server.address().port}`){json(res,{error:'Invalid host'},403);return;}
   const u=new URL(req.url,origin);const url=u.pathname;
   if(url.startsWith('/api/')){
    if(req.headers.authorization!==`Bearer ${token}`||req.headers.origin&&req.headers.origin!==origin){json(res,{error:'인증되지 않은 요청입니다.'},403);return;}
    if(url==='/api/status'){json(res,{environment:await doctor(),keys:await keys.list()});return;}
    if(url==='/api/projects'&&req.method==='GET'){json(res,await listProjects());return;}
    if(url==='/api/projects'&&req.method==='POST'){const b=await body(req);const p=newProject(b.name??'이끼 숲',b.palette??'forest',b.packageId);await save(p);json(res,p);return;}
    if(url==='/api/project'&&req.method==='PUT'){json(res,await save((await body(req)).project));return;}
    if(url==='/api/assets'&&req.method==='POST'){const b=await body(req);const p=b.project??await load(b.projectId);assertValid(p);const bytes=await normalizeUpload(Buffer.from(b.base64,'base64'));const ref=`assets/${sha(bytes)}.png`;const next={...p,assets:{...p.assets,[b.slot]:ref}};assertValid(next);await atomic(path.join(dataRoot,ref),bytes);json(res,await save(next));return;}
    if(url==='/api/validate'){json(res,validate((await body(req)).project));return;}
    if(url==='/api/preview'&&req.method==='POST'){json(res,await editor.preview((await body(req)).project));return;}
    if(url==='/api/catalog'){json(res,publicCatalog());return;}
    if(url==='/api/details'&&req.method==='POST'){const p=(await body(req)).project;assertValid(p);json(res,editor.details(p));return;}
    if(url==='/api/project-clone'&&req.method==='POST'){const p=(await body(req)).project;assertValid(p);json(res,await save(cloneProject(p)));return;}
    if(url==='/api/resource'&&req.method==='POST'){const b=await body(req);assertValid(b.project);const r=await editor.singleResource(b.project,b);await save(r.project);json(res,r);return;}
    if(url==='/api/resources-import'&&req.method==='POST'){const b=await body(req);assertValid(b.project);const items=await editor.bulkItems(b);const r=await editor.applyResources(b.project,items);await save(r.project);json(res,r);return;}
    if(url==='/api/resource-template'){const p=await load(u.searchParams.get('id'));const buf=await editor.resourceTemplate(p);res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="theme-resources.zip"'});res.end(buf);return;}
    if(url==='/api/preview-file'){const rev=u.searchParams.get('revision'),name=u.searchParams.get('name');if(!/^[a-f0-9]{64}$/.test(rev)||!name||name.includes('..')||!/^((ios\/Images)|(android\/res\/[\w-]+))\/[\w@.-]+\.png$/.test(name))throw new Error('경로가 잘못되었습니다.');await file(res,path.join(dataRoot,'previews',rev,name));return;}
    if(url==='/api/project-export'){const p=await load(u.searchParams.get('id'));const buf=await exportProject(p,dataRoot);res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="theme-project.zip"'});res.end(buf);return;}
    if(url==='/api/project-import'&&req.method==='POST'){const b=await body(req);let p=await importProject(Buffer.from(b.base64,'base64'),dataRoot);if(b.asNew)p=cloneProject(p);if(await readJson(projectFile(p.id),null))throw new Error('같은 ID의 프로젝트가 이미 있습니다. 기존 프로젝트를 열어 주세요.');json(res,await save(p));return;}
    if(url==='/api/keys'&&req.method==='POST'){const b=await body(req);json(res,await keys.create(b.label,b.password));return;}
    if(url==='/api/keys/unlock'&&req.method==='POST'){const b=await body(req);json(res,await keys.unlock(b.id,b.password));return;}
    if(url==='/api/keys/import'&&req.method==='POST'){const b=await body(req);json(res,await keys.import(b.label,b.password,Buffer.from(b.base64,'base64')));return;}
    if(url==='/api/keys/backup'){const id=u.searchParams.get('id');await keys.signing(id);await file(res,path.join(dataRoot,'keys',`${id}.p12`),true);return;}
    if(url==='/api/build'&&req.method==='POST'){
     const p=(await body(req)).project;assertValid(p);await save(p);const id=crypto.randomUUID();const job={id,status:'queued',step:'대기 중',report:null};jobs.set(id,job);queue=queue.then(async()=>{job.status='running';try{job.step='리소스 변환';const c=await compile(p,dataRoot);job.report=await buildBoth(c,dataRoot,keys,s=>job.step=s);job.status=job.report.status;job.step=job.status==='success'?'두 플랫폼 생성 완료':'iOS 완료 · Android 확인 필요';}catch(e){job.status='failed';job.step=e.message;}});json(res,job,202);return;
    }
    if(url==='/api/job'){const j=jobs.get(u.searchParams.get('id'));if(!j)throw new Error('작업을 찾을 수 없습니다.');json(res,j);return;}
    if(url==='/api/builds'){let entries=[];try{entries=await fs.readdir(path.join(dataRoot,'builds'));}catch{}const reports=[];for(const id of entries)if(validId(id)){const r=await readJson(path.join(dataRoot,'builds',id,'build-report.json'),null);if(r)reports.push(r);}json(res,reports.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));return;}
    if(url==='/api/download'){const id=u.searchParams.get('id'),name=u.searchParams.get('name');if(!validId(id)||!['theme-ios.ktheme','theme-android.apk','theme-bundle.zip','build-report.json','install-guide.html','signature-verification.txt'].includes(name))throw new Error('잘못된 다운로드입니다.');await file(res,path.join(dataRoot,'builds',id,name),true);return;}
    json(res,{error:'API를 찾을 수 없습니다.'},404);return;
   }
   const staticFiles={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/history.js':'history.js','/preview-renderer.js':'preview-renderer.js','/catalog-editor.js':'catalog-editor.js','/screen-model.js':'screen-model.js','/geometry-model.js':'geometry-model.js','/visual-geometry.js':'visual-geometry.js'};if(!staticFiles[url]){res.writeHead(404);res.end('Not found');return;}await file(res,path.join(ROOT,'public',staticFiles[url]));
  }catch(e){json(res,{error:e.code==='ENOENT'?'파일을 찾을 수 없습니다.':e.message,diagnostics:e.diagnostics},400);}
 });
 return {server,token,dataRoot,keys};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const studio=await createStudio();const port=Number(process.env.PORT??4317);studio.server.listen(port,'127.0.0.1',()=>{console.log(`Kakao Theme Studio: http://127.0.0.1:${studio.server.address().port}/#${studio.token}`);});studio.server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'4317 포트가 사용 중입니다. 기존 창 또는 터미널을 확인하세요.':e.message);process.exitCode=1;});}
