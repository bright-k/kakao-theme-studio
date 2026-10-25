import fs from 'node:fs/promises';
import path from 'node:path';
import {newProject,validate,assertValid,compile,readJson} from './core.mjs';
import {doctor,KeyStore,buildBoth} from './android.mjs';
import {openProjectStore} from './project-store.mjs';
const [cmd,filename,...args]=process.argv.slice(2);let store;
try{
 if(cmd==='doctor')console.log(JSON.stringify(await doctor(),null,2));
 else if(cmd==='new'){if(!filename)throw new Error('출력 경로를 입력하세요.');await fs.writeFile(filename,JSON.stringify(newProject(args[0]),null,2),{flag:'wx'});console.log(filename);}
 else if(cmd==='validate'){const p=JSON.parse(await fs.readFile(filename,'utf8'));const d=validate(p);console.log(JSON.stringify(d,null,2));if(d.some(x=>x.severity==='error'))process.exitCode=1;}
 else if(cmd==='migrate'){const root=path.resolve(process.env.THEME_STUDIO_DATA??'.data');store=await openProjectStore(root);console.log(JSON.stringify({storageVersion:2,projects:(await store.list()).map(p=>({id:p.id,name:p.name,packageId:p.packageId})),migration:store.migration}));}
 else if(cmd==='build'){
  const p=JSON.parse(await fs.readFile(filename,'utf8'));assertValid(p);let projectRoot=path.dirname(path.resolve(filename));const marker=await readJson(path.join(projectRoot,'storage.json'),null);let root=path.resolve(process.env.THEME_STUDIO_DATA??'.data');
  if(marker){root=path.dirname(path.dirname(projectRoot));store=await openProjectStore(root);if(await store.rootFor(p)!==projectRoot)throw new Error('프로젝트 저장 위치가 일치하지 않습니다.');}else{store=await openProjectStore(root);if(path.resolve(filename)===path.join(root,'projects',p.id+'.json'))projectRoot=await store.rootFor(p);}
  const keys=new KeyStore(root),password=process.env.STUDIO_KEY_PASSWORD;if(!password)throw new Error('STUDIO_KEY_PASSWORD 환경변수가 필요합니다.');if(!p.signingKeyId)throw new Error('편집기에서 키를 생성·선택하고 프로젝트를 저장하세요.');await keys.unlock(p.signingKeyId,password);const c=await compile(p,projectRoot);const r=await buildBoth(c,root,keys,s=>console.error(s),{projectRoot});console.log(JSON.stringify(r,null,2));if(r.status!=='success')process.exitCode=1;
 }else console.log('node src/cli.mjs doctor | new theme.json [이름] | validate theme.json | build theme.json | migrate');
}catch(e){console.error(e.message);process.exitCode=1;}finally{await store?.close();}
