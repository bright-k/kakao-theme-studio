import fs from 'node:fs/promises';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {ROOT,newProject,compile,sha} from '../src/core.mjs';
import {CATALOG,RESOURCES} from '../src/catalog.mjs';
const p=newProject();let start=performance.now();const first=await compile(p,ROOT);const firstMs=performance.now()-start;p.name='메타데이터 수정';start=performance.now();const next=await compile(p,ROOT);const metadataEditMs=performance.now()-start;
const imageHashesStable=Object.entries(first.files).filter(([k])=>k.endsWith('.png')).every(([k,b])=>sha(b)===sha(next.files[k]));
const report={date:'2026-10-25',...next.coverage,logicalImageGroups:RESOURCES.length,editableIOSProperties:CATALOG.iosProperties.filter(x=>x.editable).length,metadataEditImageHashesStable:imageHashesStable,performance:{firstCompileMs:Math.round(firstMs*10)/10,metadataEditMs:Math.round(metadataEditMs*10)/10},scopeNote:'Coverage is defined against the bundled official 26.9.0 sample and identified guide additions, not every KakaoTalk version or actual application.'};
await fs.writeFile(path.join(ROOT,'docs/coverage-after.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.complete||!imageHashesStable)process.exitCode=1;
