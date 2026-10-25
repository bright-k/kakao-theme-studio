import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import JSZip from 'jszip';
import { PNG } from 'pngjs';
import {composeBubble} from './bubble-composition.mjs';
import {bubbleGeometry} from '../public/bubble-model.js';
import {validAssetRef,readAsset,writeAsset} from './asset-store.mjs';
import {createProjectArchive,readProjectArchive} from './project-archive.mjs';
import { COMPILER_VERSION } from './catalog.mjs';
import { serializeIOS, serializeAndroid, resolveStyles, previewStyles } from './styles.mjs';
import { validateExtensions, assetReferences, completeResources, coverage } from './resources.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PROFILE = 'kakaotalk-26.9.0';
export const SLOTS = ['mainBackground','chatBackground','lockBackground','tabBackground','splashBackground','themeIcon','sentBubble','receivedBubble','sentBubbleGroup','receivedBubbleGroup','sentBubbleSelected','receivedBubbleSelected','sentBubbleGroupSelected','receivedBubbleGroupSelected','sentBubbleDecoration','receivedBubbleDecoration','sentBubbleGroupDecoration','receivedBubbleGroupDecoration','profile','profile2','profile3','profileFull1','profileFull2','profileFull3','friendsIcon','chatsIcon','nowIcon','shoppingIcon','moreIcon','localIcon','callIcon','piccomaIcon',...['friends','chats','now','shopping','more','local','call','piccoma'].map(x=>x+'IconSelected'),'friendAddButton','friendAddButtonPressed','keypadPressed',...[1,2,3,4].flatMap(n=>['passcode'+n,'passcode'+n+'Selected'])];
export const PALETTES = {
  forest: {main:'#F4F5EF',chat:'#E7EBDD',text:'#293E32',secondary:'#657465',accent:'#50715B',sent:'#50715B',sentText:'#FFFFFF',received:'#FFFFFF',receivedText:'#293E32',input:'#FFFFFF'},
  dusk: {main:'#242833',chat:'#1D222B',text:'#F1EEE6',secondary:'#A9B0BD',accent:'#B9CAA6',sent:'#6D8068',sentText:'#FFFFFF',received:'#343C48',receivedText:'#F1EEE6',input:'#303743'},
  peach: {main:'#FFF4ED',chat:'#F7E7DE',text:'#614B48',secondary:'#927675',accent:'#BD7562',sent:'#BD7562',sentText:'#FFFFFF',received:'#FFFFFF',receivedText:'#614B48',input:'#FFFFFF'}
};
export const sha = b => crypto.createHash('sha256').update(b).digest('hex');
export const projectRevision = p => sha(COMPILER_VERSION+'\n'+JSON.stringify(p));
export const visualRevision = p => sha(COMPILER_VERSION+'\n'+JSON.stringify({palette:p.palette,bubble:p.bubble,assets:p.assets,overrides:p.overrides,resourceOverrides:p.resourceOverrides,nativeNinePatch:p.nativeNinePatch,resourceOptions:p.resourceOptions,resourceGeometry:p.resourceGeometry,bubbleDesign:p.bubbleDesign,assetHashes:p.assetHashes}));
export function cloneProject(p){const copy={...structuredClone(p),...newProject(p.name+' 사본')};for(const key of ['author','palette','bubble','assets','assetHashes','overrides','resourceOverrides','resourceOptions','nativeNinePatch','resourceGeometry','bubbleDesign','mode','url','signingKeyId'])if(p[key]!==undefined)copy[key]=structuredClone(p[key]);copy.name=(p.name.slice(0,55)+' 사본');return copy;}
export const xml = s => String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export const validId = s => typeof s==='string' && /^[a-f0-9-]{36}$/.test(s);
export function newProject(name='이끼 숲', palette='forest', packageId) {
  const id=crypto.randomUUID();
  if(typeof packageId==='string')packageId=packageId.trim()||undefined;
  return {schemaVersion:1,id,name,author:'Theme Creator',version:'1.0.0',packageId:packageId===undefined?`studio.localtheme.t${id.replaceAll('-','')}`:packageId,profile:PROFILE,mode:palette==='dusk'?'dark':'light',palette:{...(PALETTES[palette]??PALETTES.forest)},bubble:{radius:14,paddingX:14,paddingY:10,stretchX:30,stretchY:26},assets:{},signingKeyId:null,createdAt:new Date().toISOString()};
}
const JAVA_RESERVED=new Set('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null'.split(' '));
export function validate(p) {
  const d=[];const err=(field,message)=>d.push({severity:'error',field,message});
  if(!p||typeof p!=='object'||Array.isArray(p))return [{severity:'error',field:'project',message:'프로젝트 형식이 잘못되었습니다.'}];
  if(p.schemaVersion!==1)err('schemaVersion','지원하지 않는 프로젝트 버전입니다.');
  if(!validId(p.id))err('id','유효한 프로젝트 ID가 필요합니다.');
  for(const k of ['name','author'])if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>60||/[\x00-\x1F]/.test(p[k]))err(k,'1~60자의 텍스트를 입력하세요.');
  if(!/^\d+\.\d+\.\d+$/.test(p.version))err('version','버전은 1.0.0 형식이어야 합니다.');
  if(typeof p.packageId!=='string'||!/^([a-z][a-z0-9_]*\.){2,}[a-z][a-z0-9_]*$/.test(p.packageId)||p.packageId.length>160||p.packageId.split('.').some(x=>JAVA_RESERVED.has(x)))err('packageId','패키지명은 com.bright.theme.forest처럼 소문자로 시작하는 3개 이상의 구간을 점으로 연결하세요. 소문자·숫자·밑줄만 허용하며 Java 예약어는 사용할 수 없습니다. (최대 160자)');
  if(p.profile!==PROFILE)err('profile','지원하지 않는 카카오톡 프로필입니다.');
  if(!['light','dark'].includes(p.mode))err('mode','화면 모드가 잘못되었습니다.');
  for(const k of Object.keys(PALETTES.forest))if(!/^#[0-9a-fA-F]{6}$/.test(p.palette?.[k]??''))err(`palette.${k}`,'#RRGGBB 색상이 필요합니다.');
  for(const [k,min,max] of [['radius',0,18],['paddingX',4,24],['paddingY',4,18],['stretchX',22,40],['stretchY',20,34]])if(!Number.isInteger(p.bubble?.[k])||p.bubble[k]<min||p.bubble[k]>max)err(`bubble.${k}`,`${min}~${max} 정수를 입력하세요.`);
  if(!p.assets||typeof p.assets!=='object'||Array.isArray(p.assets))err('assets','자산 형식이 잘못되었습니다.');
  else for(const [k,v] of Object.entries(p.assets))if(!SLOTS.includes(k)||typeof v!=='string'||!validAssetRef(v))err(`assets.${k}`,'유효하지 않은 자산 참조입니다.');
  if(p.signingKeyId!==null&&!validId(p.signingKeyId))err('signingKeyId','유효하지 않은 키 ID입니다.');
  if(p.assets?.sentBubble||p.assets?.receivedBubble)d.push({severity:'warning',field:'bubble',message:'말풍선 본체는 64×56 기준이며 캐릭터 합성 출력은 확장됩니다. 늘림 지점과 내용 여백을 확인하세요.'});
  if(!d.some(x=>x.severity==='error')) {
    const lum=h=>{const a=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];};
    for(const [a,b] of [['sent','sentText'],['received','receivedText'],['main','text']]){const x=lum(p.palette[a]),y=lum(p.palette[b]);if((Math.max(x,y)+.05)/(Math.min(x,y)+.05)<4.5)d.push({severity:'warning',field:`palette.${b}`,message:`${a} 영역의 글자 대비가 낮습니다. (도구 권장 기준 4.5:1)`});}
  }
  return d.concat(validateExtensions(p));
}
export function assertValid(p){const d=validate(p);if(d.some(x=>x.severity==='error'))throw Object.assign(new Error(d.filter(x=>x.severity==='error').map(x=>x.message).join(' ')),{diagnostics:d});return d;}
export async function atomic(file,data){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=`${file}.${crypto.randomUUID()}.tmp`;await fs.writeFile(tmp,data,{mode:0o600});await fs.rename(tmp,file);}
export async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT'&&fallback!==undefined)return fallback;throw e;}}
export function cssString(s){return String(s).replaceAll('\\','\\\\').replaceAll("'","\\'").replace(/[\r\n\f]/g,' ');}
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const ICONS={friends:'<circle cx="22" cy="17" r="7"/><path d="M9 39c0-14 26-14 26 0M35 11a7 7 0 0 1 0 14m4 5c5 1 8 4 8 9"/>',chats:'<path d="M10 10h28a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H23l-12 8v-8H10a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Z"/><path d="M15 22h18"/>',now:'<path d="m27 4-18 25h15l-3 17 20-28H26Z"/>',shopping:'<path d="M10 17h30l4 27H6Zm8 0V12a7 7 0 0 1 14 0v5"/>',more:'<circle cx="10" cy="25" r="2"/><circle cx="25" cy="25" r="2"/><circle cx="40" cy="25" r="2"/>',call:'<path d="m10 5 9 12-6 7c4 6 7 9 13 12l7-6 12 8c-7 19-43-16-35-33Z"/>'};
const imageCache=new Map();let imageCacheBytes=0;
export async function cachedImage(key,generate){if(imageCache.has(key)){const value=imageCache.get(key);imageCache.delete(key);imageCache.set(key,value);return value;}const buf=await generate();if(buf.length<16*1024*1024){imageCache.set(key,buf);imageCacheBytes+=buf.length;while(imageCache.size>256||imageCacheBytes>64*1024*1024){const first=imageCache.keys().next().value;imageCacheBytes-=imageCache.get(first).length;imageCache.delete(first);}}return buf;}
async function raster(source,w,h){return cachedImage('raster:'+sha(source)+':'+w+':'+h,()=>sharp(source,{limitInputPixels:16_000_000}).resize(w,h,{fit:'cover',position:'centre'}).png().toBuffer());}
export async function normalizeUpload(data){if(!Buffer.isBuffer(data)||data.length>8*1024*1024)throw new Error('이미지는 8MB 이하로 등록하세요.');const m=await sharp(data,{limitInputPixels:16_000_000}).metadata();if(!['png','jpeg','webp'].includes(m.format))throw new Error('PNG, JPEG, WebP 이미지만 지원합니다.');return sharp(data,{limitInputPixels:16_000_000}).rotate().png().toBuffer();}
export async function asset(p,slot,assetRoot){return p.assets[slot]?readAsset(assetRoot,p.assets[slot],p.assetHashes?.[p.assets[slot]]):null;}
export async function bubbleImage(p,who,scale=3,selected=false,first=true,assetRoot){
 if(p.bubbleDesign?.[who])return composeBubble(p,who,scale,selected,first,assetRoot,{asset,legacy:legacyBubbleImage});
 return legacyBubbleImage(p,who,scale,selected,first,assetRoot);
}
async function legacyBubbleImage(p,who,scale=3,selected=false,first=true,assetRoot){
  const base=who==='sent'?'sentBubble':'receivedBubble';const specific=base+(first?'':'Group')+(selected?'Selected':'');const explicit=p.assets[specific];
  const custom=await asset(p,explicit?specific:(!first&&p.assets[base+'Group']?base+'Group':base),assetRoot);
  if(custom)return cachedImage('bubble:'+sha(custom)+':'+scale+':'+(selected&&!explicit),async()=>{let image=sharp(custom).resize(64*scale,56*scale,{fit:'fill'});if(selected&&!explicit)image=image.modulate({brightness:.88});return image.png().toBuffer();});
  const c=p.palette[who]; const r=p.bubble.radius;
  let buf=await raster(Buffer.from(svg(64,56,`<rect x="2" y="2" width="60" height="52" rx="${r}" fill="${c}"/>${first?`<path d="${who==='sent'?'M52 39 64 54 47 48':'M12 39 0 54 17 48'}" fill="${c}"/>`:''}`)),64*scale,56*scale);
  return selected?sharp(buf).modulate({brightness:.88}).png().toBuffer():buf;
}
export function ninePatch(buf,{stretchX=30,stretchY=26,paddingX=14,paddingY=10,header=0},scale=3){
  const s=PNG.sync.read(buf),p=new PNG({width:s.width+2,height:s.height+2});PNG.bitblt(s,p,0,0,s.width,s.height,1,1);
  const black=(x,y)=>{const i=(p.width*y+x)*4;p.data[i]=p.data[i+1]=p.data[i+2]=0;p.data[i+3]=255;};
  for(let x=1+stretchX*scale;x<1+(stretchX+1)*scale;x++)black(x,0);
  for(let y=1+stretchY*scale;y<1+(stretchY+1)*scale;y++)black(0,y);
  for(let x=1+paddingX*scale;x<1+s.width-paddingX*scale;x++)black(x,p.height-1);
  for(let y=1+(paddingY+header)*scale;y<1+s.height-paddingY*scale;y++)black(p.width-1,y);
  return PNG.sync.write(p);
}
export async function iconImage(p,kind,selected,scale,assetRoot){const slot=`${kind}Icon`;const actual=selected&&p.assets[slot+'Selected']?slot+'Selected':slot;const custom=SLOTS.includes(actual)?await asset(p,actual,assetRoot):null;if(custom)return raster(custom,50*scale,50*scale);return raster(Buffer.from(svg(50,50,`<g stroke="${selected?p.palette.accent:p.palette.secondary}" stroke-width="${selected?3:2.3}" stroke-linecap="round" stroke-linejoin="round" fill="none">${ICONS[kind]??ICONS.now}</g>`)),50*scale,50*scale);}
export async function profileImage(p,size,assetRoot,n=1,full=false){const slot=n===0?'themeIcon':full?'profileFull'+n:n===1?'profile':'profile'+n;const fallback=n>1&&p.assets['profile'+n]?'profile'+n:'profile';const chosen=p.assets[slot]?slot:fallback;const c=await asset(p,chosen,assetRoot);if(c)return raster(c,size,size);return raster(Buffer.from(svg(100,100,`<rect width="100" height="100" rx="38" fill="${p.palette.chat}"/><path d="M25 65C18 25 69 19 77 26 80 61 50 82 25 65Z" fill="${p.palette.accent}"/><path d="m29 69 33-31" stroke="${p.palette.main}" stroke-width="3"/>`)),size,size);}
export async function backgroundImage(p,slot,w,h,assetRoot){const c=await asset(p,slot,assetRoot);const col=slot==='chatBackground'?p.palette.chat:p.palette.main;return c?raster(c,w,h):cachedImage(`solid:${col}:${w}:${h}`,()=>sharp({create:{width:w,height:h,channels:4,background:col}}).png().toBuffer());}
async function auxiliaryImage(p,name,width,height,assetRoot){
 const n=Number(name.match(/(?:Code|passcode_)0([1-4])/)?.[1]);const selected=/Selected|checked/.test(name);const slot=n?'passcode'+n+(selected?'Selected':''):/KeypadPressed/.test(name)?'keypadPressed':/findBtn|find_add/.test(name)?'friendAddButton'+(/pressed/.test(name)?'Pressed':''):null;
 const custom=slot?await asset(p,slot,assetRoot):null;if(custom)return raster(custom,width,height);
 if(/findBtn|find_add/.test(name))return raster(await iconImage(p,'friends',selected||/pressed/.test(name),1,assetRoot),width,height);
 return raster(Buffer.from(svg(36,36,`<circle cx="18" cy="18" r="${selected?12:7}" fill="${p.palette.accent}"/>`)),width,height);
}
export function androidColors(p,template){return serializeAndroid(p);}
export function iosCSS(p,template){return serializeIOS(p);}
const compiledImageCache=new Map();let compiledImageBytes=0;
export async function compile(p,assetRoot){assertValid(p);const files={};const visualKey=path.resolve(assetRoot)+':'+visualRevision(p);const cachedImages=compiledImageCache.get(visualKey);if(cachedImages){for(const ref of assetReferences(p))await asset({...p,assets:{check:ref}},'check',assetRoot);Object.assign(files,cachedImages.files);}
const css=iosCSS(p,await fs.readFile(path.join(ROOT,'templates/ios.css'),'utf8'));files['ios/KakaoTalkTheme.css']=Buffer.from(css);
 const names=[...new Set([...css.matchAll(/'([A-Za-z][A-Za-z0-9]*\.png)'/g)].map(m=>m[1]))];
 if(!cachedImages){for(const name of names){for(const scale of name==='commonIcoTheme.png'?[1]:[2,3]){
   let buf;
   if(name.includes('Bubble'))buf=await bubbleImage(p,name.includes('Send')?'sent':'received',scale,name.includes('Selected'),name.includes('01'),assetRoot);
   else if(name.includes('BgImage'))buf=await backgroundImage(p,name.startsWith('chatroom')?'chatBackground':name.startsWith('passcode')?'lockBackground':'mainBackground',name.startsWith('maintab')?390*scale:390*scale,name.startsWith('maintab')?84*scale:844*scale,assetRoot);
   else if(name.includes('maintabIco')){const kind=name.replace('maintabIco','').replace('Selected','').replace('.png','').toLowerCase();buf=await iconImage(p,kind,name.includes('Selected'),scale,assetRoot);}
   else if(name.includes('profile')||name==='commonIcoTheme.png')buf=await profileImage(p,name==='commonIcoTheme.png'?162:80*scale,assetRoot);
   else buf=await auxiliaryImage(p,name,36*scale,36*scale,assetRoot);
   files[`ios/Images/${name==='commonIcoTheme.png'?name:name.replace('.png',`@${scale}x.png`)}`]=buf;
 }}
 // Theme list icon is implicitly loaded by KakaoTalk, not referenced in CSS.
 files['ios/Images/commonIcoTheme.png']=await profileImage(p,162,assetRoot,0);}
 files['android/res/values/colors.xml']=Buffer.from(androidColors(p,await fs.readFile(path.join(ROOT,'templates/android-colors.xml'),'utf8')));
 const title=xml(p.name.replaceAll('\\','\\\\').replaceAll("'","\\'").replaceAll('"','\\"'));
 files['android/res/values/strings.xml']=Buffer.from(`<?xml version="1.0" encoding="utf-8"?><resources><string name="app_name" formatted="false">${title}</string><string name="theme_title" formatted="false">${title}</string></resources>`);
 for(const dir of ['color','drawable'])for(const f of await fs.readdir(path.join(ROOT,'templates/android-adv',dir)))files[`android/res/${dir}/${f}`]=await fs.readFile(path.join(ROOT,'templates/android-adv',dir,f));
 if(!cachedImages){for(const who of ['me','you'])for(const n of ['01','02'])files[`android/res/drawable-xxhdpi/theme_chatroom_bubble_${who}_${n}_image.9.png`]=ninePatch(await bubbleImage(p,who==='me'?'sent':'received',3,false,n==='01',assetRoot),{...p.bubble,stretchX:bubbleGeometry(p,who==='me'?'sent':'received',n==='02').stretch[0],stretchY:bubbleGeometry(p,who==='me'?'sent':'received',n==='02').stretch[1],paddingY:p.bubble.paddingY,header:bubbleGeometry(p,who==='me'?'sent':'received',n==='02').header});
 for(const kind of ['friends','chats','now','shopping','more','call','piccoma','local'])for(const sel of [false,true])files[`android/res/drawable-xxhdpi/theme_maintab_ico_${kind}${sel?'_focused':''}_image.png`]=await iconImage(p,kind,sel,3,assetRoot);
 for(let n=1;n<=3;n++) {files[`android/res/drawable-xxhdpi/theme_profile_0${n}_image.png`]=await profileImage(p,220,assetRoot,n);files[`android/res/drawable-nodpi/theme_profile_0${n}_image_full.png`]=await profileImage(p,320,assetRoot,n,true);}
 for(const [slot,name] of [['mainBackground','theme_background_image'],['chatBackground','theme_chatroom_background_image'],['lockBackground','theme_passcode_background_image']]){const dir=name==='theme_background_image'?'drawable-nodpi':'drawable-xxhdpi';files[`android/res/${dir}/${name}.png`]=await backgroundImage(p,slot,1080,2160,assetRoot);}
 // Replace the shape fallback with the generated main background bitmap.
 delete files['android/res/drawable/theme_background_image.xml'];
 files['android/res/drawable-xxhdpi/theme_maintab_cell_image.png']=await backgroundImage(p,'mainBackground',1080,168,assetRoot);
 files['android/res/drawable-xxhdpi/theme_find_add_friend_button_image.png']=await auxiliaryImage(p,'theme_find_add_friend_button_image.png',126,102,assetRoot);
 files['android/res/drawable-xxhdpi/theme_find_add_friend_button_pressed_image.png']=await auxiliaryImage(p,'theme_find_add_friend_button_pressed_image.png',126,102,assetRoot);
 for(let n=1;n<=4;n++)for(const checked of [false,true]){const name=`theme_passcode_0${n}${checked?'_checked':''}_image.png`;files[`android/res/drawable-xxhdpi/${name}`]=await auxiliaryImage(p,name,132,132,assetRoot);}
 files['android/res/drawable/icon.png']=await profileImage(p,144,assetRoot,0);}
 const resolved=cachedImages?{styles:resolveStyles(p),views:previewStyles(p)}:await completeResources(p,files,{assetRoot,asset,backgroundImage,profileImage,iconImage,bubbleImage,cachedImage,sha});
 if(!cachedImages){const images=Object.fromEntries(Object.entries(files).filter(([n])=>n.endsWith('.png')));const bytes=Object.values(images).reduce((sum,b)=>sum+b.length,0);if(bytes<64*1024*1024){compiledImageCache.set(visualKey,{files:images,bytes});compiledImageBytes+=bytes;while(compiledImageCache.size>8||compiledImageBytes>64*1024*1024){const key=compiledImageCache.keys().next().value;compiledImageBytes-=compiledImageCache.get(key).bytes;compiledImageCache.delete(key);}}}
 else if(p.resourceOptions?.['android/theme_background_image.png']?.enabled===false)files['android/res/drawable/theme_background_image.xml']=Buffer.from('<shape xmlns:android="http://schemas.android.com/apk/res/android"><solid android:color="@color/theme_background_color"/></shape>');
 if(p.resourceOptions?.['android/theme_background_image.png']?.enabled!==false)delete files['android/res/drawable/theme_background_image.xml'];
 const supported=coverage(files,p);if(!supported.complete)throw new Error('필수 리소스 생성 누락: '+supported.missing.join(', '));
 return {profile:PROFILE,compilerVersion:COMPILER_VERSION,revision:projectRevision(p),visualRevision:visualRevision(p),project:p,files,diagnostics:validate(p),styles:resolved.styles,coverage:supported,preview:{palette:p.palette,bubble:p.bubble,mode:p.mode,views:resolved.views},deviceVerified:false};
}
export async function makeKtheme(compiled){const z=new JSZip();for(const [name,data] of Object.entries(compiled.files))if(name.startsWith('ios/'))z.file(name.slice(4),data,{date:new Date('2026-01-01T00:00:00Z')});return z.generateAsync({type:'nodebuffer',compression:'DEFLATE'});}
export async function writeTree(files,dest,prefix=''){for(const [name,data] of Object.entries(files)){if(!name.startsWith(prefix))continue;const f=path.join(dest,name.slice(prefix.length));await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,data);}}
export async function exportProject(p,root){return createProjectArchive(p,root);}
export async function importProject(buf,root){const {project,assets}=await readProjectArchive(buf);await fs.mkdir(root,{recursive:true,mode:0o700});for(const [ref,bytes] of assets)await writeAsset(root,ref,bytes,{expectedHash:project.assetHashes?.[ref]});return project;}
