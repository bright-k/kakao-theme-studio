// Uses existing resourceOptions/commonColors contracts; registered images and
// per-platform exceptions survive a switch to a solid background and back.
export const BACKGROUNDS={
 mainBackground:{color:'mainBackground',resources:['ios/mainBgImage.png','android/theme_background_image.png']},
 chatBackground:{color:'chatBackground',resources:['ios/chatroomBgImage.png','android/theme_chatroom_background_image.png']},
 lockBackground:{color:'passcodeBackground',resources:['ios/passcodeBgImage.png','android/theme_passcode_background_image.png']},
 tabBackground:{color:'tabBackground',resources:['ios/maintabBgImage.png','android/theme_maintab_cell_image.9.png']}
};
export function backgroundMode(p,slot){const disabled=BACKGROUNDS[slot].resources.map(id=>p.resourceOptions?.[id]?.enabled===false);return disabled.every(Boolean)?'color':disabled.some(Boolean)?'mixed':'image';}
export function setBackgroundMode(p,slot,mode){if(!['color','image'].includes(mode)||!BACKGROUNDS[slot])throw new Error('배경 방식을 확인하세요.');p.resourceOptions??={};for(const id of BACKGROUNDS[slot].resources)p.resourceOptions[id]={...p.resourceOptions[id],enabled:mode==='image'};}
export function activateBackground(p,slot){if(BACKGROUNDS[slot])setBackgroundMode(p,slot,'image');}
