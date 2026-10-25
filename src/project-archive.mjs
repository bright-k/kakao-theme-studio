import crypto from 'node:crypto';
import JSZip from 'jszip';
import {assertValid,normalizeUpload} from './core.mjs';
import {assetReferences} from './resources.mjs';
import {legacyAssetRef,namedAssetRef,readAsset} from './asset-store.mjs';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function backupStamp(date=new Date()){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return p.year+p.month+p.day+'-'+p.hour+p.minute+p.second;}
export function backupFilename(p){let name='';for(const ch of p.name.replace(/[^\p{L}\p{N}_-]/gu,'_')){if(Buffer.byteLength(name+ch)>24)break;name+=ch;}return `${name||'theme'}-${p.packageId}-${backupStamp()}-${crypto.randomUUID().slice(0,8)}.zip`;}
// Check the central directory before JSZip can collapse duplicate entry names.
function inspectZip(buf){
 if(!Buffer.isBuffer(buf)||buf.length>24*1024*1024)throw new Error('프로젝트 ZIP은 24MB 이하만 지원합니다.');let end=-1;
 for(let i=buf.length-22;i>=Math.max(0,buf.length-65557);i--)if(buf.readUInt32LE(i)===0x06054b50&&i+22+buf.readUInt16LE(i+20)===buf.length){end=i;break;}
 if(end<0)throw new Error('프로젝트 ZIP 형식을 확인하세요.');const count=buf.readUInt16LE(end+10),size=buf.readUInt32LE(end+12),offset=buf.readUInt32LE(end+16);
 if(buf.readUInt16LE(end+4)||buf.readUInt16LE(end+6)||buf.readUInt16LE(end+8)!==count||count>400||offset+size!==end)throw new Error('지원하지 않는 ZIP 구조입니다.');
 let at=offset,total=0;const seen=new Set();for(let i=0;i<count;i++){
  if(at+46>end||buf.readUInt32LE(at)!==0x02014b50)throw new Error('ZIP 파일 목록이 잘못되었습니다.');const length=buf.readUInt16LE(at+28),extra=buf.readUInt16LE(at+30),comment=buf.readUInt16LE(at+32),next=at+46+length+extra+comment;
  if(next>end||buf.readUInt16LE(at+8)&1||![0,8].includes(buf.readUInt16LE(at+10)))throw new Error('지원하지 않는 ZIP 항목입니다.');
  const name=buf.subarray(at+46,at+46+length).toString('utf8'),canonical=name.replace(/\/$/,'');if(!canonical||canonical.startsWith('/')||/[\\\x00-\x1f]/.test(name)||canonical.split('/').some(s=>!s||s==='.'||s==='..')||seen.has(canonical))throw new Error('ZIP 경로가 잘못되었거나 중복됩니다.');seen.add(canonical);total+=buf.readUInt32LE(at+24);if(total>128*1024*1024)throw new Error('압축 해제 크기가 너무 큽니다.');at=next;
 }if(at!==end)throw new Error('ZIP 파일 목록 길이가 잘못되었습니다.');
}
export async function createProjectArchive(p,root){
 assertValid(p);const zip=new JSZip(),prefix=p.packageId+'--backup-'+backupStamp()+'-'+crypto.randomUUID()+'/',portable={...p,signingKeyId:null},files=new Map([['theme.json',Buffer.from(JSON.stringify(portable,null,2))]]);
 for(const ref of assetReferences(p))files.set(ref,await readAsset(root,ref,p.assetHashes?.[ref]));
 const manifest={format:'kakao-theme-studio-project',version:3,projectId:p.id,packageId:p.packageId,files:[...files].map(([name,bytes])=>({path:name,sha256:hash(bytes),bytes:bytes.length}))};
 if([...files.values()].reduce((n,b)=>n+b.length,0)>128*1024*1024)throw new Error('프로젝트 백업의 원본 크기가 128MB를 초과합니다.');for(const [name,bytes] of files)zip.file(prefix+name,bytes,{createFolders:false});zip.file(prefix+'backup.json',JSON.stringify(manifest,null,2),{createFolders:false});const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});if(bytes.length>24*1024*1024)throw new Error('프로젝트 백업이 복원 한도 24MB를 초과합니다.');return bytes;
}
export async function readProjectArchive(buf){
 inspectZip(buf);const zip=await JSZip.loadAsync(buf,{checkCRC32:true}),names=Object.entries(zip.files).filter(([,f])=>!f.dir).map(([n])=>n);let prefix='',manifest=null;
 if(!zip.file('theme.json')){const candidates=names.filter(n=>n.split('/').length===2&&n.endsWith('/backup.json'));if(candidates.length!==1)throw new Error('프로젝트 백업 루트가 하나여야 합니다.');prefix=candidates[0].slice(0,-'backup.json'.length);manifest=JSON.parse(await zip.file(prefix+'backup.json').async('string'));if(manifest.format!=='kakao-theme-studio-project'||![2,3].includes(manifest.version)||!Array.isArray(manifest.files))throw new Error('지원하지 않는 프로젝트 백업 버전입니다.');}
 const theme=zip.file(prefix+'theme.json');if(!theme)throw new Error('theme.json이 없습니다.');const themeBytes=await theme.async('nodebuffer'),p=JSON.parse(themeBytes.toString());p.signingKeyId=null;assertValid(p);
 if(manifest&&(manifest.projectId!==p.id||manifest.packageId!==p.packageId||!prefix.startsWith(p.packageId+'--backup-')))throw new Error('백업의 프로젝트 식별 정보가 일치하지 않습니다.');
 const refs=assetReferences(p),expected=new Set(['theme.json',...refs,...(manifest?['backup.json']:[])]);
 if(names.some(n=>!n.startsWith(prefix)||!expected.has(n.slice(prefix.length))))throw new Error('프로젝트 백업에 예상하지 않은 파일이 있습니다.');
 const files=new Map([['theme.json',themeBytes]]),assets=new Map();for(const ref of refs){const f=zip.file(prefix+ref);if(!f)throw new Error('자산이 누락되었습니다.');const bytes=await f.async('nodebuffer');if(namedAssetRef(ref)&&manifest?.version!==3)throw new Error('이 원본 경로는 새 백업 형식이 필요합니다.');if(hash(bytes)!==(legacyAssetRef(ref)?ref.slice(7,-4):p.assetHashes?.[ref]))throw new Error('자산 해시가 잘못되었습니다.');await normalizeUpload(bytes);assets.set(ref,bytes);files.set(ref,bytes);}
 if(manifest){if(manifest.files.length!==files.size||new Set(manifest.files.map(f=>f.path)).size!==files.size)throw new Error('백업 파일 목록이 일치하지 않습니다.');for(const record of manifest.files){const bytes=files.get(record.path);if(!bytes||record.sha256!==hash(bytes)||record.bytes!==bytes.length)throw new Error('백업 파일의 해시 또는 크기가 일치하지 않습니다.');}}
 return {project:p,assets,formatVersion:manifest?.version??1};
}
