import {COMMON_COLORS} from '../public/common-colors.js';
import {resourceChain} from './source-rules.mjs';
import { readFileSync } from 'node:fs';
export const COMPILER_VERSION = '0.12.0';
export const CATALOG = JSON.parse(readFileSync(new URL('../templates/profile-26.9.0.json',import.meta.url),'utf8'));
export const IOS_PROPERTIES = new Map(CATALOG.iosProperties.map(p=>[p.id,p]));
export const ANDROID_COLORS = new Set(CATALOG.androidColors.map(p=>p.id));
export const RESOURCE_FILES = new Map(CATALOG.files.map(p=>[p.path,p]));
export function resourceGroup(file) {
 const s=typeof file==='string'?file:file.path;
 return /Bubble|bubble/.test(s)?'말풍선':/maintab|TabBar/.test(s)?'탭':/passcode|Passcode/.test(s)?'잠금화면':/profile|Profile/.test(s)?'프로필':/splash/.test(s)?'시작화면':/Icon|IcoTheme|icon.png/.test(s)?'테마 아이콘':/findBtn|find_add/.test(s)?'버튼':'배경';
}
export function logicalResource(file){return `${file.platform}/`+file.fileName.replace(/@[23]x(?=\.png)/,'');}
export const RESOURCES = [...new Set(CATALOG.files.map(logicalResource))].map(id=>{
 const variants=CATALOG.files.filter(f=>logicalResource(f)===id);const first=variants[0];
 return {id,platform:first.platform,name:first.fileName.replace(/@[23]x(?=\.png)/,''),group:resourceGroup(first),variants,
  optional:/BgImage|background_image|maintabBgImage|maintab_cell_image|splash/.test(first.path),
  note:/splash/.test(first.path)?'공식 가이드상 Android 12 미만에서만 적용됩니다.':first.path.includes('sw600dp')?'태블릿 리소스입니다. 실제 기기 적용은 미검증입니다.':''};
});
const names={'background-color':'배경색','border-color':'구분선 색','border-alpha':'구분선 투명도','-ios-text-color':'글자색','-ios-text-alpha':'글자 투명도','-ios-title-edgeinsets':'첫 말풍선 내용 여백','-ios-group-title-edgeinsets':'연속 말풍선 내용 여백','-ios-background-image':'배경 이미지 / 늘림 지점','-ios-selected-background-image':'선택 이미지 / 늘림 지점','-ios-group-background-image':'연속 이미지 / 늘림 지점','-ios-group-selected-background-image':'연속 선택 이미지 / 늘림 지점'};
export function propertyLabel(p){return names[p.name]??p.name.replace(/^-ios-/,'').replaceAll('-',' ');}
export function propertyGroup(p){return /MessageCell/.test(p.selector)?'말풍선':/Passcode/.test(p.selector)?'잠금화면':/TabBar|BottomBanner/.test(p.selector)?'탭':/Notification|DirectShare/.test(p.selector)?'배너':/InputBar/.test(p.selector)?'입력창':p.selector==='ManifestStyle'?'테마 정보':/Profile/.test(p.selector)?'프로필':'목록·버튼';}
export function publicCatalog(){const links=new Map();for(const f of CATALOG.files)for(const key of resourceChain(f).map(slot=>'assets.'+slot)){if(!key.startsWith('assets.'))continue;const slot=key.slice(7);if(!links.has(slot))links.set(slot,[]);links.get(slot).push(f.path);}return {...CATALOG,commonColors:COMMON_COLORS,commonSources:[...links].map(([slot,files])=>({slot,files,platforms:[...new Set(files.map(x=>x.split('/')[0]))]})),compilerVersion:COMPILER_VERSION,bubblePlatformSources:['ios','android'].flatMap(platform=>['sent','received'].flatMap(who=>[false,true].flatMap(group=>['body','character'].map(kind=>({platform,who,group,kind,screen:'chat',files:CATALOG.files.filter(f=>f.platform===platform&&/Bubble|bubble/.test(f.fileName)&&(/Send|_me_/.test(f.fileName)?'sent':'received')===who&&/02/.test(f.fileName)===group).map(f=>f.path)}))))),resources:RESOURCES,iosProperties:CATALOG.iosProperties.map(p=>({...p,label:propertyLabel(p),group:propertyGroup(p)})),androidColors:CATALOG.androidColors.map(p=>({...p,label:p.id.replace(/^theme_/,'').replaceAll('_',' '),group:/chatroom/.test(p.id)?'채팅방':/passcode/.test(p.id)?'잠금화면':/notification|direct_share/.test(p.id)?'배너':/maintab|bannerbadge|navigation/.test(p.id)?'탭':'목록·버튼'}))};}
