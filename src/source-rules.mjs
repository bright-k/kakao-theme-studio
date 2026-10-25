// Physical file → ordered semantic source candidates, shared by the catalog and provenance.
export function resourceChain(f){
 const name=f.fileName,chain=[];
 const add=slot=>{if(!chain.includes(slot))chain.push(slot);};
 if(/Bubble|bubble/.test(name)){
  const base=/Send|_me_/.test(name)?'sentBubble':'receivedBubble',group=/02/.test(name),selected=/Selected/.test(name);add(base+(group?'Group':'')+(selected?'Selected':''));if(group)add(base+'Group');add(base);
 }else if(/BgImage|background_image|splash_image|maintab_cell_image/.test(name)){
  add(/chatroom/.test(name)?'chatBackground':/passcode/.test(name)?'lockBackground':/splash/.test(name)?'splashBackground':/maintab/.test(name)?'tabBackground':'mainBackground');if(/splash|maintab/.test(name))add('mainBackground');
 }else if(/maintabIco|maintab_ico/.test(name)){
  const kind=f.platform==='ios'?name.replace('maintabIco','').replace(/Selected|@[23]x|\.png/g,'').toLowerCase():name.match(/maintab_ico_([a-z]+)/)[1];if(/Selected|focused/.test(name))add(kind+'IconSelected');add(kind+'Icon');
 }else if(/profile/i.test(name)||/commonIcoTheme|^icon\.png$/.test(name)){
  const n=Number(name.match(/0([123])/)?.[1]??1);if(/IcoTheme|^icon\.png$/.test(name))add('themeIcon');else if(/_full/.test(name))add('profileFull'+n);if(n>1)add('profile'+n);add('profile');
 }else if(/findBtn|find_add/.test(name)){const pressed=/pressed/.test(name);add('friendAddButton'+(pressed?'Pressed':''));if(pressed)add('friendsIconSelected');add('friendsIcon');
 }else if(/KeypadPressed/.test(name))add('keypadPressed');
 else {const n=Number(name.match(/(?:Code|passcode_)0([1-4])/)?.[1]);if(n)add('passcode'+n+(/Selected|checked/.test(name)?'Selected':''));}
 if(/Bubble|bubble/.test(name)){const base=(/Send|_me_/.test(name)?'sent':'received')+'Bubble';if(/02/.test(name))add(base+'GroupDecoration');add(base+'Decoration');}
 return chain;
}
