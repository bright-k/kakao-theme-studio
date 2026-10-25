export class ProjectHistory {
 constructor(project,limit=60){this.limit=limit;this.reset(project);}
 reset(project){this.states=[structuredClone(project)];this.index=0;this.group=null;this.at=0;}
 record(project,group='',now=Date.now()){
  if(JSON.stringify(this.states[this.index])===JSON.stringify(project))return;
  this.states=this.states.slice(0,this.index+1);
  if(group&&this.group===group&&now-this.at<500&&this.index>0)this.states[this.index]=structuredClone(project);
  else{this.states.push(structuredClone(project));if(this.states.length>this.limit)this.states.shift();this.index=this.states.length-1;}
  this.group=group;this.at=now;
 }
 get canUndo(){return this.index>0;}
 get canRedo(){return this.index<this.states.length-1;}
 undo(){if(this.canUndo)this.index--;this.group=null;return structuredClone(this.states[this.index]);}
 redo(){if(this.canRedo)this.index++;this.group=null;return structuredClone(this.states[this.index]);}
}
