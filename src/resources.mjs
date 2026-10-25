import sharp from 'sharp';
import {validAssetRef,namedAssetRef} from './asset-names.mjs';
import {bubbleGeometry,bubbleConfig,iosBubbleGeometry} from '../public/bubble-model.js';
import { PNG } from 'pngjs';
import { CATALOG, RESOURCE_FILES, RESOURCES, logicalResource } from './catalog.mjs';
import { resolveStyles, previewStyles } from './styles.mjs';
import {validGeometry,resizeGeometry} from '../public/geometry-model.js';

const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export const assetReferences=p=>[...new Set([...Object.values(p.assets??{}),...Object.values(p.resourceOverrides??{})])];
export function validateExtensions(p){
 const errors=[];const error=(field,message)=>errors.push({severity:'error',field,message});
 if(p.bubbleDesign!==undefined){
  if(!plain(p.bubbleDesign)||Object.keys(p.bubbleDesign).some(k=>!['sent','received'].includes(k)))error('bubbleDesign','말풍선 디자인 형식이 잘못되었습니다.');
  else for(const [who,cfg] of Object.entries(p.bubbleDesign)){
   const allowed=['body','color','textColor','radius','tail','decorationEnabled','size','gap','offset','anchor','applyTo','group'];
   if(!plain(cfg)||Object.keys(cfg).some(k=>!allowed.includes(k))){error('bubbleDesign.'+who,'말풍선 디자인 항목을 확인하세요.');continue;}
   for(const [key,v] of Object.entries(cfg)){if(key==='group'){if(!plain(v)||Object.keys(v).some(k=>!['body','color','radius','tail','decorationMode','decorationEnabled','size','gap','offset','anchor'].includes(k)))error('bubbleDesign.'+who+'.group','연속 말풍선 설정을 확인하세요.');else for(const [k,x] of Object.entries(v)){const ok=k==='body'?['inherit','auto','color','image'].includes(x):k==='color'?typeof x==='string'&&/^#[a-fA-F0-9]{6}$/.test(x):k==='decorationMode'?['none','shared','separate'].includes(x):['tail','decorationEnabled'].includes(k)?typeof x==='boolean':k==='anchor'?['left','right'].includes(x):Number.isInteger(x)&&(k==='radius'?x>=0&&x<=18:k==='size'?x>=12&&x<=72:['gap','offset'].includes(k)&&x>=0&&x<=24);if(!ok)error('bubbleDesign.'+who+'.group.'+k,'연속 말풍선 값의 형식과 범위를 확인하세요.');}if(v?.body==='image'&&!p.assets?.[who+'BubbleGroup']&&!p.assets?.[who+'Bubble'])error('bubbleDesign.'+who+'.group.body','연속 말풍선 본체 이미지를 등록하세요.');continue;}const ok=key==='body'?['auto','color','image'].includes(v):['color','textColor'].includes(key)?typeof v==='string'&&/^#[a-fA-F0-9]{6}$/.test(v):['tail','decorationEnabled'].includes(key)?typeof v==='boolean':key==='anchor'?['left','right'].includes(v):key==='applyTo'?['first','all'].includes(v):Number.isInteger(v)&&(key==='radius'?v>=0&&v<=18:key==='size'?v>=12&&v<=72:['gap','offset'].includes(key)&&v>=0&&v<=24);if(!ok)error('bubbleDesign.'+who+'.'+key,'말풍선 디자인 값의 형식과 범위를 확인하세요.');}
   if(cfg.body==='image'&&!p.assets?.[who+'Bubble'])error('bubbleDesign.'+who+'.body','말풍선 본체 이미지를 먼저 등록하세요.');
  }
 }
 const props=new Map(CATALOG.iosProperties.map(x=>[x.id,x]));const colors=new Set(CATALOG.androidColors.map(x=>x.id));
 if(p.url!==undefined&&(typeof p.url!=='string'||p.url.length>300||(p.url&&!/^https?:\/\/[^\s'"\\<>]+$/.test(p.url))))error('url','테마 URL은 http/https 주소로 입력하세요.');
 if(p.overrides!==undefined){
  if(!plain(p.overrides)||Object.keys(p.overrides).some(k=>!['ios','android'].includes(k)))error('overrides','플랫폼 설정 형식이 잘못되었습니다.');
  else for(const platform of ['ios','android'])if(p.overrides[platform]!==undefined){
   if(!plain(p.overrides[platform])){error(`overrides.${platform}`,'설정은 이름/값 형식이어야 합니다.');continue;}
   for(const [id,value] of Object.entries(p.overrides[platform])){
    const field=`overrides.${platform}.${id}`;
    if(platform==='android'){if(!colors.has(id)||typeof value!=='string'||!/^#(?:[a-fA-F0-9]{6}|[a-fA-F0-9]{8})$/.test(value))error(field,'목록에 있는 Android 색상을 #RRGGBB 또는 #AARRGGBB로 입력하세요.');continue;}
    const spec=props.get(id);const who=id.includes('Send')?'sent':'received';const geometry=bubbleGeometry(p,who,id.includes('group-'));const maxW=geometry.width,maxH=geometry.height;if(!spec?.editable){error(field,'수정할 수 없는 iOS 속성입니다. 이미지와 테마 정보는 해당 편집기를 이용하세요.');continue;}
    if(spec.kind==='color'&&(typeof value!=='string'||!/^#[a-fA-F0-9]{6}$/.test(value)))error(field,'iOS 색상은 #RRGGBB로 입력하세요.');
    if(spec.kind==='number'&&(!Number.isFinite(value)||value<0||value>1))error(field,'투명도는 0~1 범위입니다.');
    if(spec.kind==='insets'&&(!Array.isArray(value)||value.length!==4||value.some(x=>!Number.isFinite(x)||x<0||x>(p.bubbleDesign?.[who]?Math.max(maxW,maxH):28))||value[1]+value[3]>=maxW||value[0]+value[2]>=maxH))error(field,'내용 여백은 top/left/bottom/right 4개 값으로 입력하세요.');
    if(spec.kind==='stretch'&&(!Array.isArray(value)||value.length!==2||value.some(x=>!Number.isInteger(x))||value[0]<0||value[0]>=maxW-1||value[1]<0||value[1]>=maxH-1))error(field,'늘림 지점은 현재 말풍선 논리 크기 안의 가로·세로 두 정수로 입력하세요.');
   }
  }
 }
 if(p.resourceOverrides!==undefined){if(!plain(p.resourceOverrides))error('resourceOverrides','리소스 설정 형식이 잘못되었습니다.');else for(const [file,ref] of Object.entries(p.resourceOverrides))if(!RESOURCE_FILES.has(file)||typeof ref!=='string'||!validAssetRef(ref))error('resourceOverrides.'+file,'목록에 있는 리소스와 유효한 이미지 참조를 사용하세요.');}
 if(p.nativeNinePatch!==undefined&&(!Array.isArray(p.nativeNinePatch)||p.nativeNinePatch.some(f=>!RESOURCE_FILES.get(f)?.ninePatch||!p.resourceOverrides?.[f])))error('nativeNinePatch','원본 9-patch 참조가 잘못되었습니다.');
 if(p.resourceOptions!==undefined){if(!plain(p.resourceOptions))error('resourceOptions','이미지 옵션 형식이 잘못되었습니다.');else for(const [id,opt] of Object.entries(p.resourceOptions)){
  const resource=RESOURCES.find(r=>r.id===id);if(!resource||!plain(opt)){error('resourceOptions.'+id,'목록에 있는 이미지 옵션을 사용하세요.');continue;}
  for(const [k,v] of Object.entries(opt))if(k==='enabled'?typeof v!=='boolean'||!resource.optional:k==='fit'?!['cover','contain','fill'].includes(v):['focalX','focalY'].includes(k)?!Number.isFinite(v)||v<0||v>1:true)error('resourceOptions.'+id, '이미지 옵션은 크롭/맞춤, 초점(0~1), 배경 사용 여부입니다.');
 }}
 if(p.resourceGeometry!==undefined){if(!plain(p.resourceGeometry))error('resourceGeometry','늘림·여백 설정 형식을 확인하세요.');else for(const [file,g] of Object.entries(p.resourceGeometry))if(!RESOURCE_FILES.get(file)?.ninePatch||!validGeometry(g)||Object.keys(g).some(k=>!['width','height','stretchX','stretchY','insets'].includes(k)))error('resourceGeometry.'+file,'유효한 Android 9-patch 좌표와 늘림·내용 영역을 사용하세요.');}
 if(p.assetHashes!==undefined){if(!plain(p.assetHashes))error('assetHashes','자산 검증 정보 형식을 확인하세요.');else for(const [ref,digest] of Object.entries(p.assetHashes))if(!validAssetRef(ref)||typeof digest!=='string'||!/^[a-f0-9]{64}$/.test(digest))error('assetHashes.'+ref,'자산 검증 정보가 잘못되었습니다.');}
 for(const ref of assetReferences(p))if(namedAssetRef(ref)&&!/^([a-f0-9]{64})$/.test(p.assetHashes?.[ref]??''))error('assetHashes.'+ref,'원본 이미지의 검증 정보가 필요합니다.');
 return errors;
}
export function readNinePatch(buf){
 const p=PNG.sync.read(buf);if(p.width<3||p.height<3||p.width>4098||p.height>4098)throw new Error('9-patch 이미지 크기가 잘못되었습니다.');
 const pixel=(x,y)=>[...p.data.subarray((y*p.width+x)*4,(y*p.width+x)*4+4)];
 const black=(x,y)=>{const v=pixel(x,y);if(v[3]===0)return false;if(v.join(',')==='0,0,0,255')return true;throw new Error('9-patch 가이드는 투명 또는 불투명 검정만 사용할 수 있습니다.');};
 for(const [x,y] of [[0,0],[p.width-1,0],[0,p.height-1],[p.width-1,p.height-1]])if(pixel(x,y)[3]!==0)throw new Error('9-patch 모서리는 투명해야 합니다.');
 const runs=(length,test)=>{const list=[];let start=null;for(let i=0;i<=length;i++){const active=i<length&&test(i);if(active&&start===null)start=i;if(!active&&start!==null){list.push([start,i]);start=null;}}return list;};
 const x=runs(p.width-2,i=>black(i+1,0));const y=runs(p.height-2,i=>black(0,i+1));const cx=runs(p.width-2,i=>black(i+1,p.height-1));const cy=runs(p.height-2,i=>black(p.width-1,i+1));
 if(!x.length||!y.length||cx.length>1||cy.length>1)throw new Error('9-patch 늘림 구간과 내용 구간을 확인하세요.');
 return {width:p.width-2,height:p.height-2,stretchX:x,stretchY:y,insets:[cy[0]?.[0]??0,cx[0]?.[0]??0,cy[0]?p.height-2-cy[0][1]:0,cx[0]?p.width-2-cx[0][1]:0]};
}
export function patchImage(buf,guide){
 const s=PNG.sync.read(buf),p=new PNG({width:s.width+2,height:s.height+2});PNG.bitblt(s,p,0,0,s.width,s.height,1,1);
 const black=(x,y)=>{const n=(p.width*y+x)*4;p.data[n]=p.data[n+1]=p.data[n+2]=0;p.data[n+3]=255;};
 const x=Math.min(s.width-1,Math.max(0,guide?.x??Math.floor(s.width/2))),y=Math.min(s.height-1,Math.max(0,guide?.y??Math.floor(s.height/2)));
 for(const [a,b] of guide?.stretchX??[[x,x+1]])for(let n=a;n<b;n++)black(n+1,0);for(const [a,b] of guide?.stretchY??[[y,y+1]])for(let n=a;n<b;n++)black(0,n+1);const [top,left,bottom,right]=guide?.insets??[0,0,0,0];
 for(let i=left;i<s.width-right;i++)black(i+1,p.height-1);for(let i=top;i<s.height-bottom;i++)black(p.width-1,i+1);
 return PNG.sync.write(p);
}
export async function resizeImage(buf,width,height,options={}){
 const fit=options.fit??'cover';if(fit!=='cover')return sharp(buf).resize(width,height,{fit,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 const m=await sharp(buf).metadata();const ratio=Math.max(width/m.width,height/m.height);const w=Math.max(width,Math.ceil(m.width*ratio)),h=Math.max(height,Math.ceil(m.height*ratio));
 return sharp(buf).resize(w,h,{fit:'fill'}).extract({left:Math.round((w-width)*(options.focalX??.5)),top:Math.round((h-height)*(options.focalY??.5)),width,height}).png().toBuffer();
}
export async function completeResources(p,files,ctx){
 const {assetRoot,asset,backgroundImage,profileImage,iconImage,bubbleImage}=ctx;const styles=resolveStyles(p);const views=previewStyles(p,styles);const buffers=new Map();
 async function custom(ref){if(!buffers.has(ref))buffers.set(ref,await asset({...p,assets:{value:ref}},'value',assetRoot));return buffers.get(ref);}
 for(const f of CATALOG.files){
  const id=logicalResource(f),options=p.resourceOptions?.[id]??{};const name=f.fileName;let buf=files[f.path];
  if(options.enabled===false){delete files[f.path];continue;}
  const scale=f.platform==='ios'?(name.includes('@2x')?2:name.includes('@3x')?3:1):f.path.includes('xxxhdpi')?4:3;
  const who=/Send|_me_/.test(name)?'sent':'received';const bubble=/Bubble|bubble/.test(name);
  const ref=p.resourceOverrides?.[f.path];
  if(ref){const raw=await custom(ref);if(f.ninePatch&&p.nativeNinePatch?.includes(f.path)){readNinePatch(raw);buf=raw;}
   else{const w=bubble?64*scale:f.width-(f.ninePatch?2:0),h=bubble?56*scale:f.height-(f.ninePatch?2:0);buf=await resizeImage(raw,w,h,{...options,...(bubble?{fit:'fill'}:{})});if(f.ninePatch)buf=patchImage(buf,bubble?{x:p.bubble.stretchX*scale,y:p.bubble.stretchY*scale,insets:[p.bubble.paddingY,p.bubble.paddingX,p.bubble.paddingY,p.bubble.paddingX].map(n=>n*scale)}:null);}
  }else if(/BgImage|background_image|splash_image|maintab_cell_image/.test(name)){
   const slot=/chatroom/.test(name)?'chatBackground':/passcode/.test(name)?'lockBackground':/splash/.test(name)?'splashBackground':/maintab/.test(name)?'tabBackground':'mainBackground';
   const fallback=/splash|maintab/.test(name)?'mainBackground':slot;
   const colors=views[f.platform].palette;let color=slot==='chatBackground'?colors.chat:colors.main;
   if(slot==='lockBackground')color=f.platform==='ios'?styles.ios['BackgroundStyle-Passcode/background-color']:styles.android.theme_passcode_background_color;
   if(f.platform==='android'&&/^#[\da-f]{8}$/i.test(color))color='#'+color.slice(3)+color.slice(1,3);
   const adjusted={...p,palette:{...p.palette,main:color,chat:color},assets:{...p.assets,[slot]:p.assets[slot]??p.assets[fallback]}};
   const w=f.width-(f.ninePatch?2:0),h=f.height-(f.ninePatch?2:0);const source=await asset(adjusted,slot,assetRoot);
   buf=source?await resizeImage(source,w,h,options):await backgroundImage(adjusted,slot,w,h,assetRoot);if(f.ninePatch)buf=patchImage(buf);
  }else if(!buf){
   if(/maintabIco|maintab_ico/.test(name)){const kind=f.platform==='ios'?name.replace('maintabIco','').replace(/Selected|@[23]x|\.png/g,'').toLowerCase():name.match(/maintab_ico_([a-z]+)/)[1];buf=await resizeImage(await iconImage(p,kind,/Selected|focused/.test(name),1,assetRoot),f.width,f.height);}
   else if(/profile/.test(name)){const n=Number(name.match(/0([123])/)?.[1]??1);buf=await profileImage(p,f.width,assetRoot,n,/_full/.test(name));}
   else if(name==='icon.png')buf=await profileImage(p,f.width,assetRoot,0);
  }
  if(!buf)throw new Error(`리소스 생성 규칙이 없습니다: ${f.path}`);
  if(!bubble&&!f.ninePatch&&(buf.readUInt32BE(16)!==f.width||buf.readUInt32BE(20)!==f.height))buf=await resizeImage(buf,f.width,f.height,{fit:'fill'});
  if(f.ninePatch&&p.resourceGeometry?.[f.path]){const parsed=readNinePatch(buf),g=resizeGeometry(p.resourceGeometry[f.path],parsed.width,parsed.height),raw=PNG.sync.read(buf),inner=new PNG({width:parsed.width,height:parsed.height});PNG.bitblt(raw,inner,1,1,parsed.width,parsed.height,0,0);buf=patchImage(PNG.sync.write(inner),g);}
  files[f.path]=buf;
 }
 // One Android resource ID must not have duplicate PNG and NinePatch definitions.
 delete files['android/res/drawable-xxhdpi/theme_maintab_cell_image.png'];
 delete files['android/res/drawable-nodpi/theme_background_image.png'];
 if(p.resourceOptions?.['android/theme_background_image.png']?.enabled===false)files['android/res/drawable/theme_background_image.xml']=Buffer.from('<shape xmlns:android="http://schemas.android.com/apk/res/android"><solid android:color="@color/theme_background_color"/></shape>');
 return {styles,views};
}
export function coverage(files,p){const expected=CATALOG.files;const disabled=expected.filter(f=>p.resourceOptions?.[logicalResource(f)]?.enabled===false);const missing=expected.filter(f=>!files[f.path]&&!disabled.includes(f));return {scope:CATALOG.scope,iosProperties:CATALOG.iosProperties.length,androidColors:CATALOG.androidColors.length,sampleImages:expected.filter(f=>f.source==='sample').length,imageVariants:expected.length,emitted:expected.filter(f=>files[f.path]).length,intentionallyDisabled:disabled.map(f=>f.path),missing:missing.map(f=>f.path),complete:missing.length===0,actualAppVerified:false};}
export function matchResourceNames(items){
 const used=new Set();const matched=[],unmatched=[],conflicts=[];
 for(const item of items){const name=item.name.replace(/^\.\//,'');let found=CATALOG.files.filter(f=>f.path===name||f.path==='ios/'+name||f.path==='android/res/'+name);
  if(!found.length&&!name.includes('/'))found=CATALOG.files.filter(f=>f.fileName===name);
  if(!found.length){unmatched.push(item.name);continue;}
  for(const f of found){if(used.has(f.path))conflicts.push(f.path);used.add(f.path);}
  matched.push({name:item.name,targets:found.map(f=>f.path)});
 }
 return {matched,unmatched,conflicts};
}
