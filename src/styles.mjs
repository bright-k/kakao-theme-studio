import { CATALOG } from './catalog.mjs';
const quote=s=>"'"+String(s).replaceAll('\\','\\\\').replaceAll("'","\\'").replace(/[\r\n\f]/g,' ')+"'";
export function resolveStyles(p){
 const c=p.palette;const ios={};const android={};
 for(const prop of CATALOG.iosProperties){const {selector:s,name:n,kind}=prop;let value=prop.default;
  if(kind==='number')value=Number(value);
  if(kind==='insets')value=[p.bubble.paddingY,p.bubble.paddingX,p.bubble.paddingY,p.bubble.paddingX];
  if(kind==='stretch')value=[p.bubble.stretchX,p.bubble.stretchY];
  if(kind==='color'){
   value=n.includes('background')?(s.includes('ChatRoom')?c.chat:s.includes('InputBar')||s.includes('DirectShare')?c.input:c.main):c.secondary;
   if(n==='background-color'&&s.includes('ButtonStyle'))value=c.chat;
   if(n==='background-color'&&s.includes('BottomBanner'))value=c.accent;
   if(n==='-ios-text-color')value=s.includes('MessageCellStyle-Send')?c.sentText:s.includes('MessageCellStyle-Receive')?c.receivedText:s.includes('FeatureStyle')||s.includes('SectionTitle')?c.accent:c.text;
   if(n==='-ios-selected-text-color')value=s.includes('Send')?c.sentText:c.receivedText;
   if(n.includes('description')||n.includes('paragraph')||n.includes('tab-text'))value=c.secondary;
   if(n.includes('highlighted')||n.includes('unread'))value=c.accent;
   if(n.includes('send-'))value=n.includes('foreground')?c.sentText:c.sent;
   if(n.includes('button-')&&n.includes('foreground'))value=c.accent;
   if(n==='-ios-button-text-color'||n==='-ios-keypad-text-normal-color')value=c.text;
  }
  if(s==='ManifestStyle')value=({'-kakaotalk-theme-name':p.name,'-kakaotalk-theme-version':p.version,'-kakaotalk-theme-url':p.url??'','-kakaotalk-author-name':p.author,'-kakaotalk-theme-id':p.packageId,'-kakaotalk-theme-style':p.mode})[n];
  ios[prop.id]=p.overrides?.ios?.[prop.id]??value;
 }
 const map={theme_background_color:c.main,theme_chatroom_background_color:c.chat,theme_passcode_background_color:c.main,theme_header_color:c.text,theme_title_color:c.text,theme_section_title_color:c.secondary,theme_paragraph_color:c.secondary,theme_description_color:c.secondary,theme_header_cell_color:c.main,theme_body_cell_color:'#00'+c.main.slice(1),theme_body_cell_pressed_color:c.chat,theme_body_cell_border_color:'#22'+c.text.slice(1),theme_body_secondary_cell_color:c.main,theme_maintab_cell_color:c.main,theme_navigationbar_background_color:c.input,theme_navigationrail_background_color:c.main,theme_chatroom_bubble_me_color:c.sentText,theme_chatroom_bubble_you_color:c.receivedText,theme_chatroom_unread_count_color:c.accent,theme_chatroom_input_bar_color:c.text,theme_chatroom_input_bar_background_color:c.input,theme_chatroom_input_bar_menu_icon_color:c.accent,theme_chatroom_input_bar_menu_button_color:'#11000000',theme_chatroom_input_bar_send_icon_color:c.sentText,theme_chatroom_input_bar_send_button_color:c.sent,theme_passcode_keypad_background_color:c.main,theme_passcode_color:c.text,theme_passcode_keypad_color:c.text,theme_passcode_pattern_line_color:c.accent,theme_button_background_color:c.chat,theme_button_selected_background_color:c.accent,theme_direct_share_background_color:c.input,theme_notification_background_color:c.main};
 for(const {id} of CATALOG.androidColors)android[id]=p.overrides?.android?.[id]??map[id]??(/background|bannerbadge/.test(id)?c.chat:/pressed|focused|primary|button/.test(id)?c.accent:c.secondary);
 return {ios,android};
}
export function serializeIOS(p){const values=resolveStyles(p).ios;const selectors=[...new Set(CATALOG.iosProperties.map(x=>x.selector))];return selectors.map(selector=>`${selector}\n{\n`+CATALOG.iosProperties.filter(x=>x.selector===selector).map(prop=>{
  let val=values[prop.id];const resource=prop.default.match(/'([^']+\.png)'/)?.[1];
  if(resource&&p.resourceOptions?.[`ios/${resource}`]?.enabled===false)return '';
  if(prop.kind==='insets')val=val.map(x=>`${x}px`).join(' ');
  else if(prop.kind==='stretch')val=`${quote(resource)} ${val.map(x=>`${x}px`).join(' ')}`;
  else if(prop.kind==='text')val=quote(val);
  return `    ${prop.name}: ${val};`;
 }).filter(Boolean).join('\n')+'\n}').join('\n\n')+'\n';}
export function serializeAndroid(p){return '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'+Object.entries(resolveStyles(p).android).map(([k,v])=>`    <color name="${k}">${v}</color>`).join('\n')+'\n</resources>\n';}
export function previewStyles(p,values=resolveStyles(p)){
 const i=(s,n)=>values.ios[`${s}/${n}`];const a=values.android;
 return {ios:{palette:{...p.palette,main:i('MainViewStyle-Primary','background-color'),chat:i('BackgroundStyle-ChatRoom','background-color'),text:i('MainViewStyle-Primary','-ios-text-color'),secondary:i('MainViewStyle-Primary','-ios-paragraph-text-color'),sentText:i('MessageCellStyle-Send','-ios-text-color'),receivedText:i('MessageCellStyle-Receive','-ios-text-color'),input:i('InputBarStyle-Chat','background-color')},values:values.ios},android:{palette:{...p.palette,main:a.theme_background_color,chat:a.theme_chatroom_background_color,text:a.theme_title_color,secondary:a.theme_paragraph_color,sentText:a.theme_chatroom_bubble_me_color,receivedText:a.theme_chatroom_bubble_you_color,input:a.theme_chatroom_input_bar_background_color},values:a}};
}
