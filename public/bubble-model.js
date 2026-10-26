export const MIN_BUBBLE_LINE_HEIGHT=16;
// Shared logical geometry. A design is opt-in; projects without it retain legacy output.
export function bubbleConfig(p,who,group=false){
 const raw=p.bubbleDesign?.[who]??{},base={body:'auto',color:p.palette?.[who],textColor:p.palette?.[who+'Text'],radius:p.bubble?.radius??14,tail:true,decorationEnabled:true,size:32,gap:4,offset:4,anchor:who==='sent'?'right':'left',applyTo:'first',shiftX:0,layer:'front',...raw};
 if(!group)return {...base,decorationSlot:who+'BubbleDecoration'};
 const state=raw.group??{},mode=state.decorationMode??(base.applyTo==='all'?'shared':'none');
 return {...base,...state,body:state.body==='inherit'||state.body===undefined?base.body:state.body,textColor:base.textColor,tail:state.tail??false,decorationEnabled:mode!=='none'&&(state.decorationEnabled??true),decorationMode:mode,decorationSlot:who+'Bubble'+(mode==='separate'?'Group':'')+'Decoration'};
}
// A fixed character needs fixed horizontal caps, but its header must never be
// counted as body padding. Compact generated bodies retain just their corners.
export function bubbleGeometry(p,who,group=false){
 const cfg=bubbleConfig(p,who,group),active=!!p.bubbleDesign?.[who],decorated=active&&cfg.decorationEnabled&&!!p.assets?.[cfg.decorationSlot];
 const paddingX=p.bubble?.paddingX??14,paddingY=p.bubble?.paddingY??10;
 const slot=who+'Bubble'+(group?'Group':''),imageBody=!active||cfg.body==='image'||cfg.body==='auto'&&!!(p.assets?.[slot]||p.assets?.[slot+'Selected']||p.assets?.[who+'Bubble']);
 const radius=cfg.radius,tail=cfg.tail,bodyLeft=imageBody?(p.bubble?.stretchX??30):Math.max(radius+2,tail&&who==='received'?18:2),bodyRight=imageBody?63-bodyLeft:Math.max(radius+2,tail&&who==='sent'?18:2);
 const bodyTop=imageBody?(p.bubble?.stretchY??26):radius+2,bodyBottom=imageBody?55-bodyTop:Math.max(radius+2,tail?18:2);
 const oppositeCap=decorated?Math.max(bodyLeft,bodyRight):0,leftCap=Math.max(bodyLeft,oppositeCap,decorated&&cfg.anchor==='left'?cfg.size+cfg.offset+2:0),rightCap=Math.max(bodyRight,oppositeCap,decorated&&cfg.anchor==='right'?cfg.size+cfg.offset+2:0);
 let width=imageBody?Math.max(64,leftCap+rightCap+1):Math.max(16,leftCap+rightCap+1,2*paddingX+1),bodyHeight=imageBody?56:Math.max(16,bodyTop+bodyBottom+1,2*paddingY+1);
 const placementLimits={minX:-72,maxX:0,minY:-Math.min(24,paddingY,bodyTop-1,cfg.size-1),maxY:24};
 const appliedY=Math.max(placementLimits.minY,Math.min(24,cfg.placementY??cfg.gap)),header=decorated?cfg.size+appliedY:0;
 const outside=decorated?Math.max(0,-cfg.offset-cfg.shiftX):0,bodyX=cfg.anchor==='left'?outside:0;
 // Preserve valid existing manual coordinates when compacting generated color
 // bodies. Do not turn malformed coordinates into arbitrarily large images.
 if(active&&!imageBody){const oldW=Math.max(64,cfg.size+cfg.offset+48+2*paddingX),oldH=56+2*paddingY,prefix='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':'');for(const selected of [false,true]){const v=p.overrides?.ios?.[prefix+(selected?'selected-':'')+'background-image'];if(Array.isArray(v)&&v[0]>=0&&v[0]<oldW&&v[1]>=0&&v[1]<header+oldH){width=Math.max(width,v[0]-bodyX+2);bodyHeight=Math.max(bodyHeight,v[1]-header+2);}}const v=p.overrides?.ios?.[prefix+'title-edgeinsets'];if(Array.isArray(v)&&v.length===4&&v.every(x=>x>=0)&&v[1]+v[3]<oldW&&v[0]+v[2]<header+oldH){width=Math.max(width,Math.ceil(v[1]+v[3]-outside+1));bodyHeight=Math.max(bodyHeight,Math.ceil(v[0]-header+v[2]+1));}}
 const baseX=cfg.anchor==='left'?cfg.offset:width-cfg.offset-cfg.size;
 placementLimits.maxX=Math.max(0,cfg.anchor==='left'?width-bodyRight-2-baseX-cfg.size:baseX-bodyLeft-2);
 const appliedX=Math.max(-72,Math.min(placementLimits.maxX,cfg.shiftX)),x=decorated?bodyX+baseX+(cfg.anchor==='left'?appliedX:-appliedX):0;
 let stretchX=imageBody?leftCap:Math.max(leftCap,Math.min(width-rightCap-1,p.bubble?.stretchX??30));
 if(decorated)stretchX=cfg.anchor==='left'?Math.max(stretchX,x-bodyX+cfg.size+1):Math.min(stretchX,x-bodyX-2);
 const bodyStretchY=imageBody?bodyTop:Math.max(bodyTop,Math.min(bodyHeight-bodyBottom-1,p.bubble?.stretchY??26));
 const bodyInsets=[paddingY,paddingX,paddingY,paddingX];
 if(active){const extraX=Math.max(0,width-2-2*paddingX),extraY=Math.max(0,bodyHeight-1-MIN_BUBBLE_LINE_HEIGHT-2*paddingY);bodyInsets[1]+=Math.floor(extraX/2);bodyInsets[3]+=Math.ceil(extraX/2);bodyInsets[0]+=Math.floor(extraY/2);bodyInsets[2]+=Math.ceil(extraY/2);}
 const bodyWidth=width,bodyRect={x:bodyX,y:header,width:bodyWidth,height:bodyHeight};width+=outside;
 const insets=[header+bodyInsets[0],bodyX+bodyInsets[1],bodyInsets[2],outside-bodyX+bodyInsets[3]];
 return {width,height:bodyHeight+header,layoutHeader:decorated?cfg.size+cfg.gap:0,bodyWidth,bodyRect,placementLimits,placement:{shiftX:appliedX,y:appliedY,layer:cfg.layer},bodyHeight,bodyInsets,bodyCaps:{left:bodyLeft,right:bodyRight,top:bodyTop,bottom:bodyBottom},imageBody,header,decorated,decoration:decorated?{x,y:0,width:cfg.size,height:cfg.size}:null,stretch:[bodyX+stretchX,header+bodyStretchY],insets};
}
export function bubbleIdentity(name){if(!/Bubble|bubble/.test(name))return null;return {who:/Send|_me_/.test(name)?'sent':'received',group:/02/.test(name),selected:/Selected/.test(name)};}
export function iosBubbleGeometry(p,name){const id=bubbleIdentity(name),g=id?bubbleGeometry(platformBubbleProject(p,'ios',id.who,id.group),id.who,id.group):null;return g??{width:64,height:56};}
// Preserve manual body-relative guides when the optional header changes size.
function adaptPlainBubbleGuides(p,before,who){
 for(const group of [false,true]){
  const a=bubbleGeometry(before,who,group),prefix='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':''),overrides=p.overrides?.ios;
  if(!overrides)continue;
  const keys=[prefix+'background-image',prefix+'selected-background-image',prefix+'title-edgeinsets'],original=Object.fromEntries(keys.map(k=>[k,overrides[k]?.slice()])),seed=structuredClone(p);
  for(const k of keys)delete seed.overrides.ios[k];const origin=bubbleGeometry(seed,who,group),dx=origin.bodyRect.x-a.bodyRect.x,dy=origin.header-a.header,dr=(origin.width-origin.bodyRect.x-origin.bodyWidth)-(a.width-a.bodyRect.x-a.bodyWidth);
  for(const k of keys){const v=original[k];if(v)overrides[k]=k.endsWith('title-edgeinsets')?[v[0]+dy,v[1]+dx,v[2],v[3]+dr]:[v[0]+dx,v[1]+dy];}
  const b=bubbleGeometry(p,who,group);
  for(const selected of [false,true]){const key=prefix+(selected?'selected-':'')+'background-image',v=original[key];if(v){let x=v[0]+b.stretch[0]-a.stretch[0];if(b.decorated)x=b.decoration.x<b.stretch[0]?Math.max(b.decoration.x+b.decoration.width+1,x):Math.min(b.decoration.x-2,x);overrides[key]=[Math.max(0,Math.min(b.width-2,Math.round(x))),Math.max(b.decorated?b.decoration.height+1:0,Math.min(b.height-2,v[1]+b.header-a.header))];}}
  const key=prefix+'title-edgeinsets',v=overrides[key];if(v){const left=Math.max(0,Math.min(v[1],b.width-1)),right=Math.max(0,Math.min(v[3],b.width-left-1)),bottom=Math.min(v[2],b.height-1),top=Math.max(0,Math.min(b.height-bottom-1,v[0]));overrides[key]=[top,left,bottom,right];}
 }
}

// Registering/promoting a common body is an explicit request to use that image.
// Keep other states, characters, platform images and guide overrides intact.
export function activateCommonBubbleBody(p,slot,before){
 const match=/^(sent|received)Bubble(Group)?(Selected)?$/.exec(slot);if(!match)return false;
 const [,who,group]=match,normal=who+'Bubble'+(group?'Group':'');p.bubbleDesign??={};p.bubbleDesign[who]??={};const cfg=group?(p.bubbleDesign[who].group??={}):p.bubbleDesign[who];cfg.body=p.assets?.[normal]||group&&p.assets?.[who+'Bubble']?'image':'auto';
 if(before)adaptBubbleGuides(p,before,who);return true;
}

export const PLATFORM_CHARACTER_KEYS=['decorationEnabled','size','gap','offset','anchor','shiftX','placementY','layer'];
export function platformBubbleState(p,platform,who,group=false,create=false){
 if(create){p.bubblePlatforms??={};p.bubblePlatforms[platform]??={};p.bubblePlatforms[platform][who]??={};if(group)p.bubblePlatforms[platform][who].group??={};}
 const side=p.bubblePlatforms?.[platform]?.[who];return group?side?.group:side;
}
export function platformBubbleAssets(p){
 const entries=[];for(const platform of ['ios','android'])for(const who of ['sent','received'])for(const group of [false,true]){const state=platformBubbleState(p,platform,who,group);if(state?.body)entries.push({platform,who,group,kind:'body',ref:state.body});if(state?.character?.image)entries.push({platform,who,group,kind:'character',ref:state.character.image});}return entries;
}
// A transient platform view overlays only body/character inputs. The original
// project and final resourceOverrides are never rewritten by resolution.
export function platformBubbleProject(p,platform,who,group=false){
 const side=p.bubblePlatforms?.[platform]?.[who];if(!side||!side.body&&!side.group?.body&&!Object.keys(side.character??{}).length&&!Object.keys(side.group?.character??{}).length)return p;
 const view={...p,assets:{...p.assets},bubbleDesign:{...p.bubbleDesign}},raw={...(p.bubbleDesign?.[who]??{body:'image',decorationEnabled:false})};raw.group={...raw.group};view.bubbleDesign[who]=raw;
 const base=who+'Bubble',commonGroup=bubbleConfig(p,who,true);
 if(side.body){view.assets[base]=side.body;raw.body='image';if(group&&(p.assets?.[base+'Group']||p.assets?.[base+'GroupSelected'])&&(!raw.group.body||raw.group.body==='inherit'))raw.group.body=commonGroup.body;}
 if(side.group?.body){view.assets[base+'Group']=side.group.body;raw.group.body='image';}
 if(side.character){for(const key of PLATFORM_CHARACTER_KEYS)if(side.character[key]!==undefined)raw[key]=side.character[key];if(side.character.image)view.assets[base+'Decoration']=side.character.image;}
 if(side.group?.character){const c=side.group.character;for(const key of PLATFORM_CHARACTER_KEYS)if(c[key]!==undefined)raw.group[key]=c[key];if(c.image){view.assets[base+'GroupDecoration']=c.image;raw.group.decorationMode='separate';}else if(c.decorationEnabled===true&&bubbleConfig(view,who,true).decorationMode==='none')raw.group.decorationMode='shared';}
 return view;
}
export function editPlatformBubble(p,before,platform,who){if(platform==='ios')adaptPlatformBubbleGuides(p,before,who);}
function adaptPlatformBubbleGuides(p,before,who){
 if(!p.overrides?.ios)return;
 for(const group of [false,true]){const a=structuredClone(platformBubbleProject(before,'ios',who,group)),b=structuredClone(platformBubbleProject(p,'ios',who,group));delete a.bubblePlatforms;delete b.bubblePlatforms;adaptPlainBubbleGuides(b,a,who);const prefix='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':'');for(const suffix of ['background-image','selected-background-image','title-edgeinsets']){const key=prefix+suffix;if(b.overrides?.ios?.[key])p.overrides.ios[key]=b.overrides.ios[key];}}
}

export function adaptBubbleGuides(p,before,who){if(p.bubblePlatforms?.ios?.[who]||before.bubblePlatforms?.ios?.[who])adaptPlatformBubbleGuides(p,before,who);else adaptPlainBubbleGuides(p,before,who);}
