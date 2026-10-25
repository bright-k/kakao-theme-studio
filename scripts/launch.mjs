import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createStudio } from '../src/server.mjs';
import { ROOT,atomic,readJson } from '../src/core.mjs';
const dataRoot=process.env.THEME_STUDIO_DATA??path.join(ROOT,'.data');const sessionFile=path.join(dataRoot,'session.json');
function open(url){if(process.env.STUDIO_NO_OPEN==='1')return;spawn('/usr/bin/open',[url],{stdio:'ignore',shell:false}).on('error',()=>{});}
const prior=await readJson(sessionFile,null);
if(prior?.port&&/^[a-f0-9]{48}$/.test(prior.token??'')){
 try{const r=await fetch(`http://127.0.0.1:${prior.port}/api/status`,{headers:{Authorization:`Bearer ${prior.token}`},signal:AbortSignal.timeout(1200)});if(r.ok){open(`http://127.0.0.1:${prior.port}/#${prior.token}`);console.log('실행 중인 테마 스튜디오를 열었습니다.');process.exit(0);}}catch{}
}
const studio=await createStudio({dataRoot});
studio.server.on('error',e=>{console.error('서버를 시작할 수 없습니다:',e.message);process.exitCode=1;});
studio.server.listen(Number(process.env.PORT??4317),'127.0.0.1',async()=>{
 const port=studio.server.address().port;await atomic(sessionFile,JSON.stringify({pid:process.pid,port,token:studio.token}));const url=`http://127.0.0.1:${port}/#${studio.token}`;console.log(`테마 스튜디오 실행 중: ${url}`);console.log('종료하려면 이 터미널에서 Control+C를 누르세요.');open(url);
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{studio.server.closeAllConnections();studio.server.close(()=>process.exit(0));});
