import fs from 'node:fs/promises';
import path from 'node:path';
import { newProject, validate, assertValid, compile } from './core.mjs';
import { doctor, KeyStore, buildBoth } from './android.mjs';
const [cmd,filename,...args]=process.argv.slice(2);
try{
 if(cmd==='doctor')console.log(JSON.stringify(await doctor(),null,2));
 else if(cmd==='new'){if(!filename)throw new Error('출력 경로를 입력하세요.');await fs.writeFile(filename,JSON.stringify(newProject(args[0]),null,2),{flag:'wx'});console.log(filename);}
 else if(cmd==='validate'){const p=JSON.parse(await fs.readFile(filename,'utf8'));const d=validate(p);console.log(JSON.stringify(d,null,2));if(d.some(x=>x.severity==='error'))process.exitCode=1;}
 else if(cmd==='build'){
  const p=JSON.parse(await fs.readFile(filename,'utf8'));assertValid(p);const root=path.resolve(process.env.THEME_STUDIO_DATA??'.data');const keys=new KeyStore(root);const password=process.env.STUDIO_KEY_PASSWORD;if(!password)throw new Error('STUDIO_KEY_PASSWORD 환경변수가 필요합니다.');if(!p.signingKeyId)throw new Error('편집기에서 키를 생성·선택하고 프로젝트를 저장하세요.');await keys.unlock(p.signingKeyId,password);const c=await compile(p,path.dirname(path.resolve(filename)));const r=await buildBoth(c,root,keys,s=>console.error(s));console.log(JSON.stringify(r,null,2));if(r.status!=='success')process.exitCode=1;
 }else console.log('node src/cli.mjs doctor | new theme.json [이름] | validate theme.json | build theme.json');
}catch(e){console.error(e.message);process.exitCode=1;}
