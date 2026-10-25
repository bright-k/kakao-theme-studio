// Shared logical geometry. A design is opt-in; projects without it retain legacy output.
export function bubbleConfig(p,who,group=false){
 const raw=p.bubbleDesign?.[who]??{},base={body:'auto',color:p.palette?.[who],textColor:p.palette?.[who+'Text'],radius:p.bubble?.radius??14,tail:true,decorationEnabled:true,size:32,gap:4,offset:4,anchor:who==='sent'?'right':'left',applyTo:'first',...raw};
 if(!group)return {...base,decorationSlot:who+'BubbleDecoration'};
 const state=raw.group??{},mode=state.decorationMode??(base.applyTo==='all'?'shared':'none');
 return {...base,...state,body:state.body==='inherit'||state.body===undefined?base.body:state.body,textColor:base.textColor,tail:state.tail??false,decorationEnabled:mode!=='none'&&(state.decorationEnabled??true),decorationMode:mode,decorationSlot:who+'Bubble'+(mode==='separate'?'Group':'')+'Decoration'};
}
export function bubbleGeometry(p,who,group=false){
 const cfg=bubbleConfig(p,who,group),active=!!p.bubbleDesign?.[who],decorated=active&&cfg.decorationEnabled&&!!p.assets?.[cfg.decorationSlot];
 const header=decorated?cfg.size+cfg.gap:0,width=decorated?Math.max(64,cfg.size+cfg.offset+48):64;
 const x=decorated?(cfg.anchor==='left'?cfg.offset:width-cfg.offset-cfg.size):0;
 return {width,height:56+header,header,decorated,decoration:decorated?{x,y:0,width:cfg.size,height:cfg.size}:null,stretch:[decorated?(cfg.anchor==='left'?x+cfg.size+3:x-3):(p.bubble?.stretchX??30),header+(p.bubble?.stretchY??26)],insets:[header+(p.bubble?.paddingY??10),p.bubble?.paddingX??14,p.bubble?.paddingY??10,p.bubble?.paddingX??14]};
}
export function bubbleIdentity(name){if(!/Bubble|bubble/.test(name))return null;return {who:/Send|_me_/.test(name)?'sent':'received',group:/02/.test(name),selected:/Selected/.test(name)};}
export function iosBubbleGeometry(p,name){const id=bubbleIdentity(name),g=id?bubbleGeometry(p,id.who,id.group):null;return g??{width:64,height:56};}
// Preserve manual body-relative guides when the optional header changes size.
export function adaptBubbleGuides(p,before,who){
 for(const group of [false,true]){
  const a=bubbleGeometry(before,who,group),b=bubbleGeometry(p,who,group),prefix='MessageCellStyle-'+(who==='sent'?'Send':'Receive')+'/-ios-'+(group?'group-':''),overrides=p.overrides?.ios;
  if(!overrides)continue;
  for(const selected of [false,true]){const key=prefix+(selected?'selected-':'')+'background-image',v=overrides[key];if(v){let x=b.stretch[0]+v[0]-a.stretch[0];if(b.decorated)x=b.decoration.x<b.stretch[0]?Math.max(b.decoration.x+b.decoration.width+1,x):Math.min(b.decoration.x-2,x);overrides[key]=[Math.max(0,Math.min(b.width-2,Math.round(x))),Math.max(0,Math.min(b.height-2,v[1]-a.header+b.header))];}}
  const key=prefix+'title-edgeinsets',v=overrides[key];if(v){const left=Math.min(v[1],b.width-1),right=Math.min(v[3],b.width-left-1),bottom=Math.min(v[2],b.height-1),top=Math.max(0,Math.min(b.height-bottom-1,v[0]-a.header+b.header));overrides[key]=[top,left,bottom,right];}
 }
}
