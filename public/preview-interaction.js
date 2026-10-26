// CSS absolute positions start inside the containing block's border. Canvas
// client rectangles include that border and may also be scaled by a transform.
export const SELECTION_PADDING=5;
export function overlayBounds(canvas,region,padding=0){
 const parent=canvas.parentElement,frame=parent.getBoundingClientRect(),rect=canvas.getBoundingClientRect(),s=getComputedStyle(parent),n=key=>parseFloat(s[key])||0;
 const borderWidth=parseFloat(s.width)+(s.boxSizing==='border-box'?0:n('paddingLeft')+n('paddingRight')+n('borderLeftWidth')+n('borderRightWidth'));
 const borderHeight=parseFloat(s.height)+(s.boxSizing==='border-box'?0:n('paddingTop')+n('paddingBottom')+n('borderTopWidth')+n('borderBottomWidth'));
 const sx=frame.width/borderWidth,sy=frame.height/borderHeight;
 const left=(rect.left-frame.left)/sx-n('borderLeftWidth')+parent.scrollLeft,top=(rect.top-frame.top)/sy-n('borderTopWidth')+parent.scrollTop,width=rect.width/sx,height=rect.height/sy;
 const x=Math.max(0,region.x/canvas.width*width-padding),y=Math.max(0,region.y/canvas.height*height-padding),right=Math.min(width,(region.x+region.width)/canvas.width*width+padding),bottom=Math.min(height,(region.y+region.height)/canvas.height*height+padding);
 return {left:left+x,top:top+y,width:right-x,height:bottom-y};
}
export function regionAtPoint(canvas,regions,event){
 const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*canvas.width,y=(event.clientY-rect.top)/rect.height*canvas.height;
 return [...regions].reverse().find(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height);
}
